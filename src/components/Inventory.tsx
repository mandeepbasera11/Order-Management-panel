import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  Columns3,
  Upload,
  Download,
  Package,
  Filter,
  Boxes,
  Tags,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

const statusFor = (stock: number) => {
  if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
  if (stock < 20) return { label: "Low Stock", variant: "secondary" as const };
  return { label: "In Stock", variant: "default" as const };
};

const emptyForm = { sku: "", name: "", category: "", price: "", stock: "" };

// ---------- CSV utilities ----------
const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.some((c) => c.length)) rows.push(row);
        row = [];
      } else cur += ch;
    }
  }
  if (cur.length || row.length) { row.push(cur); if (row.some((c) => c.length)) rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
};

const pick = (row: Record<string, string>, keys: string[]) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
};

type ColumnKey = "sku" | "name" | "category" | "price" | "stock" | "status";
type ExtraKey =
  | "manufacturerCode"
  | "tireLoad"
  | "tireSpeed"
  | "plyRating"
  | "brand"
  | "size"
  | "season"
  | "warehouse";
type AllColumnKey = ColumnKey | ExtraKey;
const ALL_COLUMNS: { key: AllColumnKey; label: string; group: string }[] = [
  { key: "sku", label: "GE SKU", group: "Core" },
  { key: "name", label: "Item Name", group: "Core" },
  { key: "category", label: "Category", group: "Core" },
  { key: "manufacturerCode", label: "Manufacturer Code", group: "Specs" },
  { key: "tireLoad", label: "Tire Load", group: "Specs" },
  { key: "tireSpeed", label: "Tire Speed", group: "Specs" },
  { key: "plyRating", label: "Ply Rating", group: "Specs" },
  { key: "brand", label: "Brand", group: "Specs" },
  { key: "size", label: "Size", group: "Specs" },
  { key: "season", label: "Season", group: "Specs" },
  { key: "price", label: "Price", group: "Inventory" },
  { key: "stock", label: "Stock", group: "Inventory" },
  { key: "warehouse", label: "Warehouse", group: "Inventory" },
  { key: "status", label: "Status", group: "Inventory" },
];

// Derive tire-spec fields from SKU/name so the row always has a sensible value.
const deriveSpec = (p: Product) => {
  const parts = p.sku.split("-");
  const brand = parts[1] || p.name.split(" ")[0] || "—";
  const manufacturerCode = parts[2] || parts[parts.length - 1] || "—";
  const sizeMatch = p.name.match(/\d{3}\/\d{2}R\d{2}/);
  const size = sizeMatch ? sizeMatch[0] : "—";
  const loadMatch = p.name.match(/\b(\d{2,3})\b(?!\/)/);
  const tireLoad = loadMatch ? loadMatch[1] : "—";
  const speedMatch = p.name.match(/\b([HVWYTSQR])\b/);
  const tireSpeed = speedMatch ? speedMatch[1] : "—";
  const plyRating = "N/A";
  const season = /winter/i.test(p.category)
    ? "Winter"
    : /performance/i.test(p.category)
    ? "Summer"
    : "All-Season";
  return { brand, manufacturerCode, size, tireLoad, tireSpeed, plyRating, season };
};

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [marketplaces, setMarketplaces] = useState<Record<string, boolean>>({
    Amazon: false,
    Walmart: false,
    eBay: false,
    Shopify: false,
  });
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState<number>(1);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ price: "", stock: "", category: "", mode: "set" as "set" | "adjust" });
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const tireFileRef = useRef<HTMLInputElement>(null);
  const marketFileRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState<Record<AllColumnKey, boolean>>({
    sku: true,
    name: true,
    category: true,
    manufacturerCode: true,
    tireLoad: true,
    tireSpeed: true,
    plyRating: true,
    brand: false,
    size: false,
    season: false,
    price: true,
    stock: true,
    warehouse: false,
    status: true,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.sku || !form.name) {
      toast.error("SKU and name are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      sku: form.sku,
      name: form.name,
      category: form.category || "Uncategorized",
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product added");
    setForm(emptyForm);
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    setProducts((p) => p.filter((x) => x.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  // ---------- Bulk actions ----------
  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected tire(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    const { error } = await supabase.from("products").delete().in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} tire(s) deleted`);
    setProducts((p) => p.filter((x) => !selected.has(x.id)));
    setSelected(new Set());
  };

  const applyBulkUpdate = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const hasPrice = bulkForm.price !== "";
    const hasStock = bulkForm.stock !== "";
    const hasCategory = bulkForm.category.trim() !== "";
    if (!hasPrice && !hasStock && !hasCategory) {
      return toast.error("Enter at least one field to update");
    }
    setBulkBusy(true);
    try {
      if (bulkForm.mode === "adjust" && (hasPrice || hasStock)) {
        // Per-row adjust: read selected, compute, update individually
        const targets = products.filter((p) => selected.has(p.id));
        const priceDelta = hasPrice ? Number(bulkForm.price) : 0;
        const stockDelta = hasStock ? Number(bulkForm.stock) : 0;
        for (const p of targets) {
          const payload: TablesUpdate<"products"> = {};
          if (hasPrice) payload.price = Math.max(0, Number(p.price) + priceDelta);
          if (hasStock) payload.stock = Math.max(0, p.stock + stockDelta);
          if (hasCategory) payload.category = bulkForm.category.trim();
          const { error } = await supabase.from("products").update(payload).eq("id", p.id);
          if (error) throw error;
        }
      } else {
        const payload: TablesUpdate<"products"> = {};
        if (hasPrice) payload.price = Number(bulkForm.price);
        if (hasStock) payload.stock = Number(bulkForm.stock);
        if (hasCategory) payload.category = bulkForm.category.trim();
        const { error } = await supabase.from("products").update(payload).in("id", ids);
        if (error) throw error;
      }
      toast.success(`${ids.length} tire(s) updated`);
      setBulkOpen(false);
      setBulkForm({ price: "", stock: "", category: "", mode: "set" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkSetOutOfStock = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error } = await supabase.from("products").update({ stock: 0 }).in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} tire(s) marked Out of Stock`);
    await load();
  };

  // ---------- Merge selected duplicates ----------
  const mergeSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length < 2) return toast.error("Select at least 2 tires to merge");
    const items = products.filter((p) => ids.includes(p.id));
    const primary = items[0];
    const totalStock = items.reduce((sum, p) => sum + (p.stock || 0), 0);
    const avgPrice = items.reduce((sum, p) => sum + Number(p.price || 0), 0) / items.length;
    if (!confirm(`Merge ${items.length} tires into "${primary.name}"? Stock will be summed (${totalStock}) and price averaged ($${avgPrice.toFixed(2)}).`)) return;
    setBulkBusy(true);
    try {
      const { error: updErr } = await supabase
        .from("products")
        .update({ stock: totalStock, price: Number(avgPrice.toFixed(2)) })
        .eq("id", primary.id);
      if (updErr) throw updErr;
      const toDelete = items.slice(1).map((p) => p.id);
      if (toDelete.length) {
        const { error: delErr } = await supabase.from("products").delete().in("id", toDelete);
        if (delErr) throw delErr;
      }
      toast.success(`Merged ${items.length} tires into "${primary.name}"`);
      setSelected(new Set());
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setBulkBusy(false);
    }
  };

  // ---------- CSV imports ----------
  const importTires = async (file: File) => {
    setImportBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toast.error("CSV is empty"); return; }
      const records = rows
        .map((r) => ({
          sku: pick(r, ["sku", "ge sku", "ge_sku"]),
          name: pick(r, ["name", "item name", "product", "item_name"]),
          category: pick(r, ["category"]) || "Uncategorized",
          price: Number(pick(r, ["price"])) || 0,
          stock: Number(pick(r, ["stock", "qty", "quantity"])) || 0,
        }))
        .filter((r) => r.sku && r.name);
      if (records.length === 0) { toast.error("No valid rows (need SKU and Name columns)"); return; }
      const { error } = await supabase
        .from("products")
        .upsert(records, { onConflict: "sku" });
      if (error) throw error;
      toast.success(`Imported ${records.length} tire(s)`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportBusy(false);
      if (tireFileRef.current) tireFileRef.current.value = "";
    }
  };

  const importMarketplace = async (file: File) => {
    setImportBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toast.error("CSV is empty"); return; }
      let matched = 0;
      let skipped = 0;
      for (const r of rows) {
        const sku = pick(r, ["sku", "ge sku", "ge_sku"]);
        if (!sku) { skipped++; continue; }
        const priceStr = pick(r, ["price", "marketplace price", "market_price"]);
        const stockStr = pick(r, ["stock", "qty", "quantity"]);
        const payload: TablesUpdate<"products"> = {};
        if (priceStr !== "") payload.price = Number(priceStr);
        if (stockStr !== "") payload.stock = Number(stockStr);
        if (Object.keys(payload).length === 0) { skipped++; continue; }
        const { error, count } = await supabase
          .from("products")
          .update(payload, { count: "exact" })
          .eq("sku", sku);
        if (error) throw error;
        if (count && count > 0) matched++;
        else skipped++;
      }
      toast.success(`Marketplace import: ${matched} updated, ${skipped} skipped`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Marketplace import failed");
    } finally {
      setImportBusy(false);
      if (marketFileRef.current) marketFileRef.current.value = "";
    }
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setEditForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
    });
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editForm.sku || !editForm.name) {
      toast.error("SKU and name are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        sku: editForm.sku,
        name: editForm.name,
        category: editForm.category || "Uncategorized",
        price: Number(editForm.price) || 0,
        stock: Number(editForm.stock) || 0,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product updated");
    setEditing(null);
    load();
  };

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    const matchesBrand =
      brandFilter === "all" || deriveSpec(p).brand === brandFilter;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
  const uniqueBrands = Array.from(
    new Set(products.map((p) => deriveSpec(p).brand))
  );
  const activeMarketplaces = Object.entries(marketplaces)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const filtersApplied =
    !!search ||
    categoryFilter !== "all" ||
    brandFilter !== "all" ||
    activeMarketplaces.length > 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  const allSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));
  const toggleAll = () => {
    setSelected((s) => {
      const n = new Set(s);
      if (allSelected) paged.forEach((p) => n.delete(p.id));
      else paged.forEach((p) => n.add(p.id));
      return n;
    });
  };
  const toggleRow = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const visibleCount = ALL_COLUMNS.filter((c) => visible[c.key]).length;
  const colSpan = visibleCount + 2; // checkbox + actions

  const exportCsv = () => {
    const cols = ALL_COLUMNS.filter((c) => visible[c.key]);
    const header = cols.map((c) => c.label).join(",");
    const rows = filtered.map((p) => {
      const spec = deriveSpec(p);
      return cols
        .map((c) => {
          const val =
            c.key === "status"
              ? statusFor(p.stock).label
              : c.key in spec
              ? (spec as Record<string, string>)[c.key]
              : c.key === "warehouse"
              ? "Hickory, NC"
              : (p as unknown as Record<string, unknown>)[c.key];
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        })
        .join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tires-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const renderCell = (p: Product, key: AllColumnKey) => {
    const spec = deriveSpec(p);
    switch (key) {
      case "sku":
        return <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>;
      case "name":
        return <span className="font-medium text-foreground">{p.name}</span>;
      case "category":
        return <Badge variant="outline">{p.category}</Badge>;
      case "manufacturerCode":
        return <span className="font-mono text-xs">{spec.manufacturerCode}</span>;
      case "tireLoad":
        return spec.tireLoad;
      case "tireSpeed":
        return spec.tireSpeed;
      case "plyRating":
        return <span className="text-muted-foreground">{spec.plyRating}</span>;
      case "brand":
        return spec.brand;
      case "size":
        return spec.size;
      case "season":
        return spec.season;
      case "price":
        return `$${Number(p.price).toFixed(2)}`;
      case "stock":
        return p.stock;
      case "warehouse":
        return <span className="text-muted-foreground">Hickory, NC</span>;
      case "status": {
        const s = statusFor(p.stock);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      }
    }
  };

  const groupedColumns = ALL_COLUMNS.reduce<Record<string, typeof ALL_COLUMNS>>((acc, c) => {
    (acc[c.group] = acc[c.group] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Manage Tires</h2>
          <p className="text-muted-foreground mt-2">
            Search, filter, and manage your full tire catalog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={tireFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importTires(f); }}
          />
          <input
            ref={marketFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importMarketplace(f); }}
          />
          <Button variant="outline" size="sm" disabled={importBusy} onClick={() => tireFileRef.current?.click()}>
            {importBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Import Tires
          </Button>
          <Button variant="outline" size="sm" disabled={bulkBusy || selected.size < 2} onClick={mergeSelected}>
            <Layers className="w-4 h-4" /> Merge Tires{selected.size >= 2 ? ` (${selected.size})` : ""}
          </Button>
          <Button variant="outline" size="sm" disabled={importBusy} onClick={() => marketFileRef.current?.click()}>
            {importBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Import Marketplace
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="MICH-DEF-22555R17" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Michelin Defender T+H 225/55R17" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="All-Season, Performance, Winter, All-Terrain..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tires", value: products.length.toLocaleString(), hint: "Total in database", Icon: Package },
          { label: "Brands", value: uniqueBrands.length.toString(), hint: "All unique brands", Icon: Tags },
          { label: "Categories", value: uniqueCategories.length.toString(), hint: "All unique categories", Icon: Boxes },
          { label: "Filtered Results", value: filtersApplied ? filtered.length.toLocaleString() : "All", hint: filtersApplied ? "Filters applied" : "No filters applied", Icon: Filter },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, brand, model, size..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="All Brands" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <Label className="text-sm font-medium">Marketplace</Label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {Object.keys(marketplaces).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={marketplaces[m]}
                    onCheckedChange={(v) =>
                      setMarketplaces((prev) => ({ ...prev, [m]: !!v }))
                    }
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setPage(1)}>
          <Search className="w-4 h-4" /> Search
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-accent/40">
            <p className="text-sm font-medium">
              {selected.size} tire{selected.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => setBulkOpen(true)}>
                <Pencil className="w-4 h-4" /> Bulk Edit
              </Button>
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={bulkSetOutOfStock}>
                Mark Out of Stock
              </Button>
              <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={bulkDelete}>
                {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold">Tires Details ({filtered.length.toLocaleString()})</h3>
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + pageSize, filtered.length)} of {filtered.length.toLocaleString()} tires
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            )}
            <span className="text-sm text-muted-foreground hidden md:inline">Columns:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="w-4 h-4" />
                  Select Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[28rem] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="p-0">Select columns</DropdownMenuLabel>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() =>
                        setVisible(
                          Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true])) as Record<AllColumnKey, boolean>
                        )
                      }
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() =>
                        setVisible(
                          Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, false])) as Record<AllColumnKey, boolean>
                        )
                      }
                    >
                      None
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {Object.entries(groupedColumns).map(([group, cols]) => (
                  <div key={group}>
                    <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">{group}</DropdownMenuLabel>
                    {cols.map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.key}
                        checked={visible[c.key]}
                        onCheckedChange={(v) =>
                          setVisible((prev) => ({ ...prev, [c.key]: !!v }))
                        }
                      >
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">View Results:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 200].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground hidden md:inline">Page {safePage} of {totalPages}</span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              {ALL_COLUMNS.filter((c) => visible[c.key]).map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground">
                  No tires found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleRow(item.id)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
                    {ALL_COLUMNS.filter((c) => visible[c.key]).map((c) => (
                      <TableCell key={c.key}>{renderCell(item, c.key)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => startEdit(item)} aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)} aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tire</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input id="edit-sku" value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input id="edit-category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input id="edit-price" type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input id="edit-stock" type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk edit {selected.size} tire{selected.size === 1 ? "" : "s"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Mode</Label>
              <Select
                value={bulkForm.mode}
                onValueChange={(v) => setBulkForm({ ...bulkForm, mode: v as "set" | "adjust" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to value</SelectItem>
                  <SelectItem value="adjust">Adjust by (+/-)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {bulkForm.mode === "set"
                  ? "Replaces the field on every selected tire."
                  : "Adds the value (use negative numbers to decrease)."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bulk-price">Price</Label>
                <Input
                  id="bulk-price"
                  type="number"
                  step="0.01"
                  placeholder="Leave blank to skip"
                  value={bulkForm.price}
                  onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-stock">Stock</Label>
                <Input
                  id="bulk-stock"
                  type="number"
                  placeholder="Leave blank to skip"
                  value={bulkForm.stock}
                  onChange={(e) => setBulkForm({ ...bulkForm, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-category">Category</Label>
              <Input
                id="bulk-category"
                placeholder="Leave blank to skip"
                value={bulkForm.category}
                onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={applyBulkUpdate} disabled={bulkBusy}>
              {bulkBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              Apply to {selected.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}