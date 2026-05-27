import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Store, Search, RefreshCw, Download, CheckCircle2,
  XCircle, AlertCircle, Pencil, Loader2, Package, Zap,
} from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type SyncStatus = "synced" | "pending" | "not_listed" | "out_of_sync";

type ShopifyRow = Product & {
  syncStatus: SyncStatus;
  shopifyPrice: number;
  shopifyStock: number;
  handle: string;
  lastSynced: string;
};

const fakeSyncStatus = (sku: string): SyncStatus => {
  const statuses: SyncStatus[] = ["synced", "synced", "synced", "pending", "not_listed", "out_of_sync"];
  const idx = sku.charCodeAt(0) % statuses.length;
  return statuses[idx];
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const STATUS_CONFIG: Record<SyncStatus, { label: string; icon: typeof CheckCircle2; color: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  synced:      { label: "Synced",      icon: CheckCircle2, color: "text-green-600",        variant: "default" },
  pending:     { label: "Pending",     icon: AlertCircle,  color: "text-yellow-600",       variant: "secondary" },
  not_listed:  { label: "Not Listed",  icon: XCircle,      color: "text-muted-foreground", variant: "outline" },
  out_of_sync: { label: "Out of Sync", icon: AlertCircle,  color: "text-red-500",          variant: "destructive" },
};

export function ShopifyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<SyncStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [editRow, setEditRow] = useState<ShopifyRow | null>(null);
  const [editForm, setEditForm] = useState({ price: "", stock: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) toast.error(error.message);
    else setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rows: ShopifyRow[] = useMemo(() =>
    products.map((p) => {
      const status = fakeSyncStatus(p.sku);
      const priceDrift = (p.sku.charCodeAt(1) % 10) * 0.5;
      return {
        ...p,
        syncStatus: status,
        shopifyPrice: status === "out_of_sync" ? p.price + priceDrift : p.price,
        shopifyStock: status === "out_of_sync" ? Math.max(0, p.stock - 5) : p.stock,
        handle: slugify(p.name),
        lastSynced: status === "not_listed" ? "Never" : "2 hours ago",
      };
    }), [products]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || r.category === categoryFilter;
      const matchStatus = statusFilter === "all" || r.syncStatus === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [rows, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    synced:    rows.filter((r) => r.syncStatus === "synced").length,
    pending:   rows.filter((r) => r.syncStatus === "pending").length,
    notListed: rows.filter((r) => r.syncStatus === "not_listed").length,
    outOfSync: rows.filter((r) => r.syncStatus === "out_of_sync").length,
  }), [rows]);

  const toggleRow = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    const ids = paged.map((r) => r.id);
    const all = ids.every((i) => selected.has(i));
    setSelected((s) => { const n = new Set(s); all ? ids.forEach((i) => n.delete(i)) : ids.forEach((i) => n.add(i)); return n; });
  };

  const bulkSync = async () => {
    if (!selected.size) return;
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSyncing(false);
    toast.success(`Synced ${selected.size} product(s) to Shopify`);
    setSelected(new Set());
  };

  const openEdit = (row: ShopifyRow) => {
    setEditRow(row);
    setEditForm({ price: String(row.shopifyPrice), stock: String(row.shopifyStock) });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({ price: Number(editForm.price), stock: Number(editForm.stock) })
      .eq("id", editRow.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product updated & queued for Shopify sync");
    setEditRow(null);
    load();
  };

  const exportCsv = () => {
    const header = "SKU,Name,Category,Shopify Handle,Price,Stock,Sync Status,Last Synced";
    const body = filtered.map((r) =>
      `"${r.sku}","${r.name}","${r.category}","${r.handle}",${r.shopifyPrice},${r.shopifyStock},"${r.syncStatus}","${r.lastSynced}"`
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "shopify-products.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Shopify Products</h2>
          <p className="text-muted-foreground mt-2">
            Manage and sync your tire catalog with your Shopify store.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          {selected.size > 0 && (
            <Button size="sm" onClick={bulkSync} disabled={syncing}>
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Sync {selected.size} to Shopify
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Synced",      value: stats.synced,    icon: CheckCircle2, color: "text-green-600",        bg: "bg-green-50" },
          { label: "Pending",     value: stats.pending,   icon: AlertCircle,  color: "text-yellow-600",       bg: "bg-yellow-50" },
          { label: "Not Listed",  value: stats.notListed, icon: Package,      color: "text-muted-foreground", bg: "bg-muted/50" },
          { label: "Out of Sync", value: stats.outOfSync, icon: XCircle,      color: "text-red-500",          bg: "bg-red-50" },
        ].map((s) => (
          <Card key={s.label} className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(s.label.toLowerCase().replace(" ", "_") as SyncStatus | "all")}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search SKU or product name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as SyncStatus | "all"); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="not_listed">Not Listed</SelectItem>
              <SelectItem value="out_of_sync">Out of Sync</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {selected.size > 0 && (
        <Card className="p-3 flex items-center gap-3 bg-muted/40">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" onClick={bulkSync} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
            Sync to Shopify
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">Shopify Catalog ({filtered.length.toLocaleString()} products)</h3>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={paged.length > 0 && paged.every((r) => selected.has(r.id))}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : paged.map((row) => {
                const cfg = STATUS_CONFIG[row.syncStatus];
                const Icon = cfg.icon;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleRow(row.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.sku}</TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{row.name}</TableCell>
                    <TableCell><Badge variant="outline">{row.category}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">{row.handle}</TableCell>
                    <TableCell className="text-right">${row.shopifyPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{row.shopifyStock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.lastSynced}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Card>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shopify Product</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p className="font-medium">{editRow.name}</p>
                <p className="text-muted-foreground">SKU: {editRow.sku}</p>
                <p className="text-muted-foreground">Handle: <span className="font-mono">{editRow.handle}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Shopify Price ($)</Label>
                  <Input type="number" step="0.01" value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Shopify Stock</Label>
                  <Input type="number" value={editForm.stock}
                    onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save & Queue Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
