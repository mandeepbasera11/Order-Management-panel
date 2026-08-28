import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  HeartPulse, RefreshCw, Download, AlertTriangle, AlertCircle, Info,
  CheckCircle2, Copy, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Severity = "critical" | "warning" | "info";

type Check = {
  id: string;
  label: string;
  description: string;
  severity: Severity;
  weight: number;
  /** PostgREST `or` filter identifying the failing rows */
  filter: string;
};

const CHECKS: Check[] = [
  { id: "no_price",     label: "Missing / zero price",        description: "Products that cannot be sold because retail price is 0.",        severity: "critical", weight: 3, filter: "price.is.null,price.lte.0" },
  { id: "no_name",      label: "Missing item name",           description: "No marketing item name — listings will look broken.",             severity: "critical", weight: 3, filter: "item_name.is.null,item_name.eq." },
  { id: "no_brand",     label: "Missing brand",               description: "Brand is required for search, filters and marketplace feeds.",    severity: "critical", weight: 2, filter: "brand.is.null,brand.eq." },
  { id: "no_size",      label: "Missing tire size",           description: "No size means the tire cannot be matched to a vehicle.",          severity: "critical", weight: 3, filter: "size.is.null,size.eq." },
  { id: "no_stock",     label: "Out of stock",                description: "Zero on-hand stock — hide the listing or reorder.",               severity: "warning",  weight: 1, filter: "stock.is.null,stock.lte.0" },
  { id: "no_vendor",    label: "No vendor inventory",         description: "No vendor quantity available to fulfil the SKU.",                 severity: "warning",  weight: 1, filter: "total_vendor_inventory.is.null,total_vendor_inventory.lte.0" },
  { id: "no_wholesale", label: "Missing wholesale price",     description: "Margin and profitability reports will be inaccurate.",            severity: "warning",  weight: 2, filter: "wholesale_price.is.null,wholesale_price.lte.0" },
  { id: "no_image",     label: "Missing images",              description: "Listings without images convert far worse.",                      severity: "warning",  weight: 2, filter: "images.is.null,images.eq." },
  { id: "no_category",  label: "Uncategorized",               description: "Category is empty or still set to 'Uncategorized'.",              severity: "warning",  weight: 1, filter: "category.is.null,category.eq.,category.eq.Uncategorized" },
  { id: "no_specs",     label: "Missing load / speed rating", description: "Load index and speed rating are required by most marketplaces.",  severity: "warning",  weight: 2, filter: "tire_load.is.null,tire_load.eq.,tire_speed.is.null,tire_speed.eq." },
  { id: "no_upc",       label: "Missing UPC",                 description: "UPC/GTIN is required by Amazon, Walmart and Google Shopping.",    severity: "info",     weight: 1, filter: "upc.is.null,upc.eq." },
  { id: "no_desc",      label: "Missing description",         description: "No description or features text for the product page.",           severity: "info",     weight: 1, filter: "description.is.null,description.eq." },
  { id: "no_warranty",  label: "Missing warranty",            description: "Warranty info helps conversion and is often requested.",          severity: "info",     weight: 1, filter: "warranty.is.null,warranty.eq." },
];

const SEV_META: Record<Severity, { label: string; badge: string; icon: typeof AlertTriangle; bar: string }> = {
  critical: { label: "Critical", badge: "bg-red-100 text-red-700 border-red-200",       icon: AlertCircle,   bar: "bg-red-500" },
  warning:  { label: "Warning",  badge: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle, bar: "bg-amber-500" },
  info:     { label: "Info",     badge: "bg-sky-100 text-sky-800 border-sky-200",       icon: Info,          bar: "bg-sky-500" },
};

const DRILL_COLS = [
  "sku", "item_name", "brand", "model", "size", "category",
  "price", "wholesale_price", "stock", "total_vendor_inventory",
  "tire_load", "tire_speed", "upc",
] as const;

type DrillRow = Record<string, string | number | null>;

export function CatalogHealth() {
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [counts, setCounts]     = useState<Record<string, number>>({});
  const [dupes, setDupes]       = useState<{ sku: string; occurrences: number }[]>([]);
  const [active, setActive]     = useState<Check | null>(null);
  const [rows, setRows]         = useState<DrillRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [exporting, setExporting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from("products").select("id", { count: "exact", head: true });
      if (error) throw error;
      setTotal(count ?? 0);

      const results = await Promise.all(
        CHECKS.map(async (c) => {
          const { count: n } = await supabase
            .from("products").select("id", { count: "exact", head: true }).or(c.filter);
          return [c.id, n ?? 0] as const;
        }),
      );
      setCounts(Object.fromEntries(results));

      const { data: dupData } = await supabase.rpc("catalog_duplicate_skus", { _limit: 50 });
      setDupes((dupData ?? []) as { sku: string; occurrences: number }[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load catalog health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const score = useMemo(() => {
    if (!total) return 100;
    const maxWeight = CHECKS.reduce((s, c) => s + c.weight, 0);
    const penalty = CHECKS.reduce((s, c) => s + c.weight * ((counts[c.id] ?? 0) / total), 0);
    return Math.max(0, Math.round(100 - (penalty / maxWeight) * 100));
  }, [counts, total]);

  const bySeverity = (sev: Severity) =>
    CHECKS.filter((c) => c.severity === sev).reduce((s, c) => s + (counts[c.id] ?? 0), 0);

  const openCheck = async (check: Check) => {
    setActive(check); setRows([]); setRowsLoading(true);
    const { data, error } = await supabase
      .from("products").select(DRILL_COLS.join(",")).or(check.filter).limit(100);
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as DrillRow[]);
    setRowsLoading(false);
  };

  const exportCheck = async (check: Check) => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("products").select(DRILL_COLS.join(",")).or(check.filter).limit(5000);
      if (error) throw error;
      const list = (data ?? []) as unknown as DrillRow[];
      const csv = [
        DRILL_COLS.join(","),
        ...list.map((r) => DRILL_COLS.map((c) => {
          const v = r[c];
          const s = v === null || v === undefined ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(",")),
      ].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url; a.download = `catalog-health-${check.id}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${list.length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const scoreColor = score >= 85 ? "text-emerald-700" : score >= 60 ? "text-amber-700" : "text-red-600";

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-rose-500" /> Catalog Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Data-quality scoring across your product catalog — find and fix incomplete listings
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Rescan
        </Button>
      </div>

      {/* Score + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-5 lg:col-span-1">
          <p className="text-sm text-muted-foreground">Health score</p>
          <p className={`text-4xl font-bold mt-1 ${scoreColor}`}>{loading ? "—" : `${score}%`}</p>
          <Progress value={loading ? 0 : score} className="mt-3" />
          <p className="text-xs text-muted-foreground mt-2">{total.toLocaleString()} products scanned</p>
        </Card>
        {([
          { sev: "critical" as Severity, help: "Blocks selling" },
          { sev: "warning"  as Severity, help: "Hurts conversion" },
          { sev: "info"     as Severity, help: "Nice to complete" },
        ]).map(({ sev, help }) => {
          const M = SEV_META[sev]; const Icon = M.icon;
          return (
            <Card key={sev} className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="w-4 h-4" /> {M.label} issues
              </div>
              <p className="text-3xl font-bold mt-1">{loading ? "—" : bySeverity(sev).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{help}</p>
            </Card>
          );
        })}
      </div>

      {/* Checks */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Data quality checks</h2>
          <p className="text-xs text-muted-foreground">Click a check to inspect the affected products</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="w-[220px]">Affected</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CHECKS.map((c) => {
              const n = counts[c.id] ?? 0;
              const pct = total ? Math.round((n / total) * 100) : 0;
              const M = SEV_META[c.severity];
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium text-sm flex items-center gap-1.5">
                      {!loading && n === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {c.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={M.badge}>{M.label}</Badge></TableCell>
                  <TableCell>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{n.toLocaleString()} <span className="font-normal text-muted-foreground">({pct}%)</span></p>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${M.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      disabled={loading || n === 0} onClick={() => openCheck(c)}>
                      View
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                      disabled={loading || exporting || n === 0} onClick={() => exportCheck(c)}
                      aria-label={`Export ${c.label} products`}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Duplicates */}
      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <Copy className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Duplicate SKUs</h2>
          <Badge variant="outline" className="ml-1">{dupes.length}</Badge>
        </div>
        {dupes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {loading ? "Checking…" : "No duplicate SKUs found — every product is unique."}
          </p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Occurrences</TableHead></TableRow></TableHeader>
            <TableBody>
              {dupes.map((d) => (
                <TableRow key={d.sku}>
                  <TableCell className="font-mono text-xs">{d.sku}</TableCell>
                  <TableCell><Badge className="bg-red-100 text-red-700">{d.occurrences}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Drill-down */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{active?.label}</DialogTitle>
            <DialogDescription>
              {active?.description} Showing up to 100 affected products
              {active ? ` of ${(counts[active.id] ?? 0).toLocaleString()}` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {rowsLoading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading products…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead><TableHead>Item</TableHead><TableHead>Brand</TableHead>
                    <TableHead>Size</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.sku}-${i}`}>
                      <TableCell className="font-mono text-xs">{r.sku ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.item_name || "—"}</TableCell>
                      <TableCell className="text-sm">{r.brand || "—"}</TableCell>
                      <TableCell className="text-sm">{r.size || "—"}</TableCell>
                      <TableCell className="text-sm">{r.price != null ? `$${Number(r.price).toFixed(2)}` : "—"}</TableCell>
                      <TableCell className="text-sm">{r.stock ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" disabled={!active || exporting}
              onClick={() => active && exportCheck(active)}>
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
