import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck, RefreshCw, Download, Upload, Search, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Severity = "critical" | "high" | "medium" | "low";

type Check = {
  id: string;
  label: string;
  short: string;
  description: string;
  severity: Severity;
  /** PostgREST filter fragments (OR-ed) identifying failing rows */
  parts: string[];
};

const CHECKS: Check[] = [
  { id: "weight",   label: "Missing shipping weight",     short: "shipping weight", severity: "critical",
    description: "FedEx quotes fall back to a 25 lb guess, so shipping is under- or over-charged.",
    parts: ["tire_weight.is.null", "tire_weight.eq."] },
  { id: "dims",     label: "Missing dimensions",          short: "dimensions", severity: "critical",
    description: "Neither the size string nor overall diameter is usable, so default box sizing applies.",
    parts: ["overall_diam.is.null", "overall_diam.eq."] },
  { id: "photos",   label: "Missing photos",              short: "photos", severity: "high",
    description: "Listings publish without a product image, which suppresses conversion on every channel.",
    parts: ["images.is.null", "images.eq."] },
  { id: "desc",     label: "Missing description",         short: "description", severity: "high",
    description: "Shopify/marketplace exports ship with an empty body, hurting listing quality and SEO.",
    parts: ["description.is.null", "description.eq."] },
  { id: "category", label: "Missing category",            short: "category", severity: "high",
    description: "Category drives catalog rules and reporting; blank rows fall outside every rule set.",
    parts: ["category.is.null", "category.eq.", "category.eq.Uncategorized"] },
  { id: "specs",    label: "Missing load / speed rating", short: "load/speed", severity: "medium",
    description: "Load index and speed rating are required attributes on several marketplace templates.",
    parts: ["tire_load.is.null", "tire_load.eq.", "tire_speed.is.null", "tire_speed.eq."] },
  { id: "features", label: "Missing features & benefits", short: "features", severity: "medium",
    description: "Bullet copy is blank on generated listings.",
    parts: ["features_and_benefits.is.null", "features_and_benefits.eq."] },
  { id: "logo",     label: "Missing brand logo",          short: "brand logo", severity: "low",
    description: "Brand badge is blank on storefront templates that use it.",
    parts: ["brand_logo.is.null", "brand_logo.eq."] },
  { id: "warranty", label: "Missing warranty",            short: "warranty", severity: "low",
    description: "Warranty text is missing from listings and customer questions.",
    parts: ["warranty.is.null", "warranty.eq."] },
  { id: "upc",      label: "Missing UPC",                 short: "UPC", severity: "low",
    description: "Marketplaces that require a GTIN cannot list the SKU, and order matching falls back to fuzzy lookups.",
    parts: ["upc.is.null", "upc.eq."] },
];

const SEV_BADGE: Record<Severity, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-amber-100 text-amber-800 border-amber-200",
  medium:   "bg-indigo-100 text-indigo-700 border-indigo-200",
  low:      "bg-slate-100 text-slate-700 border-slate-200",
};

const ROW_COLS =
  "id,sku,item_name,brand,category,size,tire_weight,overall_diam,images,description,tire_load,tire_speed,features_and_benefits,brand_logo,warranty,upc";

type Row = {
  id: string; sku: string; item_name: string | null; brand: string | null;
  category: string | null; size: string | null; tire_weight: string | null;
  overall_diam: string | null; images: string | null; description: string | null;
  tire_load: string | null; tire_speed: string | null;
  features_and_benefits: string | null; brand_logo: string | null;
  warranty: string | null; upc: string | null;
};

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

function failing(row: Row): Check[] {
  return CHECKS.filter((c) => {
    switch (c.id) {
      case "weight":   return isBlank(row.tire_weight);
      case "dims":     return isBlank(row.overall_diam);
      case "photos":   return isBlank(row.images);
      case "desc":     return isBlank(row.description);
      case "category": return isBlank(row.category) || row.category === "Uncategorized";
      case "specs":    return isBlank(row.tire_load) || isBlank(row.tire_speed);
      case "features": return isBlank(row.features_and_benefits);
      case "logo":     return isBlank(row.brand_logo);
      case "warranty": return isBlank(row.warranty);
      case "upc":      return isBlank(row.upc);
      default:         return false;
    }
  });
}

const PAGE_SIZE = 50;

export function CatalogHealth() {
  const [scope, setScope]       = useState<"all" | "vendor">("all");
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [counts, setCounts]     = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string[]>(["weight"]);

  const [rows, setRows]         = useState<Row[]>([]);
  const [matchCount, setMatch]  = useState(0);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [search, setSearch]     = useState("");
  const [debounced, setDebounced] = useState("");
  const [brand, setBrand]       = useState("__all");
  const [category, setCategory] = useState("__all");
  const [brands, setBrands]     = useState<string[]>([]);
  const [categories, setCats]   = useState<string[]>([]);
  const [checkedSkus, setChecked] = useState<string[]>([]);
  const [drafts, setDrafts]     = useState<Record<string, { tire_weight?: string; overall_diam?: string }>>({});
  const [saving, setSaving]     = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const scoped = useCallback(
    <T,>(q: T): T =>
      scope === "vendor"
        ? ((q as unknown as { gt: (c: string, v: number) => T }).gt("total_vendor_inventory", 0))
        : q,
    [scope],
  );

  const selectedFilter = useMemo(
    () => CHECKS.filter((c) => selected.includes(c.id)).flatMap((c) => c.parts).join(","),
    [selected],
  );

  /* ---------- counts ---------- */
  const loadCounts = useCallback(async () => {
    setLoading(true);
    try {
      const { count } = await scoped(
        supabase.from("products").select("id", { count: "exact", head: true }),
      );
      setTotal(count ?? 0);

      const res = await Promise.all(
        CHECKS.map(async (c) => {
          const { count: n } = await scoped(
            supabase.from("products").select("id", { count: "exact", head: true }),
          ).or(c.parts.join(","));
          return [c.id, n ?? 0] as const;
        }),
      );
      setCounts(Object.fromEntries(res));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to scan catalog");
    } finally {
      setLoading(false);
    }
  }, [scoped]);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("brand,category").limit(2000);
      const list = (data ?? []) as { brand: string | null; category: string | null }[];
      setBrands([...new Set(list.map((r) => r.brand).filter(Boolean) as string[])].sort().slice(0, 200));
      setCats([...new Set(list.map((r) => r.category).filter(Boolean) as string[])].sort().slice(0, 200));
    })();
  }, []);

  /* ---------- failing rows ---------- */
  const loadRows = useCallback(async () => {
    if (!selectedFilter) { setRows([]); setMatch(0); return; }
    setRowsLoading(true);
    try {
      let q = scoped(supabase.from("products").select(ROW_COLS, { count: "exact" })).or(selectedFilter);
      if (brand !== "__all") q = q.eq("brand", brand);
      if (category !== "__all") q = q.eq("category", category);
      if (debounced) q = q.or(`sku.ilike.%${debounced}%,item_name.ilike.%${debounced}%,size.ilike.%${debounced}%`);
      const { data, count, error } = await q.order("sku").limit(PAGE_SIZE);
      if (error) throw error;
      setRows((data ?? []) as unknown as Row[]);
      setMatch(count ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load SKUs");
    } finally {
      setRowsLoading(false);
    }
  }, [selectedFilter, scoped, brand, category, debounced]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const toggleCheck = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  /* ---------- inline fix ---------- */
  const saveRow = async (row: Row) => {
    const d = drafts[row.id];
    if (!d || (d.tire_weight === undefined && d.overall_diam === undefined)) {
      toast.info("Nothing to save for this SKU");
      return;
    }
    setSaving(row.id);
    const patch: Record<string, string> = {};
    if (d.tire_weight !== undefined) patch.tire_weight = d.tire_weight;
    if (d.overall_diam !== undefined) patch.overall_diam = d.overall_diam;
    const { error } = await supabase.from("products").update(patch as never).eq("id", row.id);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${row.sku} updated`);
    setDrafts((p) => { const n = { ...p }; delete n[row.id]; return n; });
    loadRows(); loadCounts();
  };

  /* ---------- export ---------- */
  const exportCsv = async () => {
    if (!selectedFilter) { toast.error("Select at least one check"); return; }
    setExporting(true);
    try {
      let q = scoped(supabase.from("products").select(ROW_COLS)).or(selectedFilter);
      if (brand !== "__all") q = q.eq("brand", brand);
      if (category !== "__all") q = q.eq("category", category);
      const { data, error } = await q.order("sku").limit(5000);
      if (error) throw error;
      const list = (data ?? []) as unknown as Row[];
      const cols = ["sku", "item_name", "brand", "category", "size", "tire_weight", "overall_diam", "upc", "missing"];
      const csv = [
        cols.join(","),
        ...list.map((r) => {
          const vals: Record<string, unknown> = { ...r, missing: failing(r).map((c) => c.short).join(" | ") };
          return cols.map((c) => {
            const s = vals[c] === null || vals[c] === undefined ? "" : String(vals[c]);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(",");
        }),
      ].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url; a.download = "catalog-health.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${list.length} SKUs`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  /* ---------- import fixes ---------- */
  const importFixes = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("CSV has no data rows");
      const parse = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.slice(0, -1)
        .map((s) => s.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
      const header = parse(lines[0]).map((h) => h.toLowerCase());
      const skuIdx = header.indexOf("sku");
      if (skuIdx === -1) throw new Error("CSV must contain a 'sku' column");
      const editable = ["tire_weight", "overall_diam", "upc", "warranty", "description", "category", "tire_load", "tire_speed", "images", "brand_logo", "features_and_benefits"];
      let ok = 0, fail = 0;
      for (const line of lines.slice(1)) {
        const cells = parse(line);
        const sku = cells[skuIdx];
        if (!sku) { fail++; continue; }
        const patch: Record<string, string> = {};
        header.forEach((h, i) => {
          if (editable.includes(h) && cells[i]) patch[h] = cells[i];
        });
        if (!Object.keys(patch).length) continue;
        const { error } = await supabase.from("products").update(patch as never).eq("sku", sku);
        error ? fail++ : ok++;
      }
      toast.success(`Applied ${ok} fixes${fail ? `, ${fail} failed` : ""}`);
      loadRows(); loadCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };

  const pct = (n: number) => (total ? ((n / total) * 100).toFixed(1) : "0.0");

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary" /> Catalog Health
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          Find catalog SKUs missing the data that shipping, pricing and listings depend on — then fix
          them inline or round-trip the list through a spreadsheet.
        </p>
      </div>

      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {([["all", "All catalog"], ["vendor", "Vendor-stocked only"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setScope(v)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition ${
                scope === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { loadCounts(); loadRows(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            aria-label="Import catalog fixes CSV"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importFixes(f); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1.5" /> Import fixes
          </Button>
          <Button onClick={exportCsv} disabled={exporting}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{total.toLocaleString()} SKUs in scope</span>
        <button className="font-semibold hover:underline"
          onClick={() => setSelected(CHECKS.filter((c) => c.severity === "critical").map((c) => c.id))}>
          Critical only
        </button>
        <button className="font-semibold hover:underline" onClick={() => setSelected(CHECKS.map((c) => c.id))}>Select all</button>
        <button className="font-semibold hover:underline" onClick={() => setSelected([])}>Clear</button>
      </div>

      {/* check cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CHECKS.map((c) => {
          const n = counts[c.id] ?? 0;
          const on = selected.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggleCheck(c.id)} aria-pressed={on}
              className={`text-left rounded-xl border p-4 transition bg-card hover:shadow-md ${
                on ? "border-primary ring-1 ring-primary/40" : "border-border"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm leading-tight">{c.label}</p>
                <Badge variant="outline" className={`${SEV_BADGE[c.severity]} shrink-0 text-[10px]`}>{c.severity}</Badge>
              </div>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{loading ? "—" : n.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{loading ? "" : `${pct(n)}%`}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{c.description}</p>
            </button>
          );
        })}
      </div>

      {/* failing SKUs */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold">SKUs failing {selected.length} selected check{selected.length === 1 ? "" : "s"}</h2>
            <p className="text-xs text-muted-foreground">
              {selected.length === 0
                ? "Select one or more checks above."
                : `${matchCount.toLocaleString()} SKUs match. Showing ${rows.length}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                aria-label="Search failing SKUs" placeholder="Search SKU, name, size…" className="pl-8 w-56" />
            </div>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-40" aria-label="Filter by brand"><SelectValue placeholder="All brands" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__all">All brands</SelectItem>
                {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44" aria-label="Filter by category"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {rowsLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading SKUs…
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {selected.length === 0 ? "No checks selected." : "No SKUs fail the selected checks."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox aria-label="Select all rows"
                    checked={checkedSkus.length === rows.length && rows.length > 0}
                    onCheckedChange={(v) => setChecked(v ? rows.map((r) => r.id) : [])} />
                </TableHead>
                <TableHead>GE SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Missing</TableHead>
                <TableHead className="w-32">Weight (lb)</TableHead>
                <TableHead className="w-32">Diameter (in)</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const miss = failing(r);
                const d = drafts[r.id] ?? {};
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox aria-label={`Select ${r.sku}`}
                        checked={checkedSkus.includes(r.id)}
                        onCheckedChange={(v) => setChecked((s) => v ? [...s, r.id] : s.filter((x) => x !== r.id))} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{r.item_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.brand || "—"}</p>
                    </TableCell>
                    <TableCell className="text-sm">{r.size || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {miss.map((c) => (
                          <Badge key={c.id} variant="outline" className={`${SEV_BADGE[c.severity]} text-[10px]`}>{c.short}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" aria-label={`Shipping weight for ${r.sku}`}
                        placeholder="—" value={d.tire_weight ?? r.tire_weight ?? ""}
                        onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], tire_weight: e.target.value } }))} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" aria-label={`Overall diameter for ${r.sku}`}
                        placeholder="—" value={d.overall_diam ?? r.overall_diam ?? ""}
                        onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], overall_diam: e.target.value } }))} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" className="h-8" disabled={saving === r.id} onClick={() => saveRow(r)}>
                        {saving === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Fix"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
