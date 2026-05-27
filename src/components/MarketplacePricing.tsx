import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Search, Pencil, Download, RefreshCw, Store,
} from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type MarketplaceKey = "amazon" | "walmart" | "ebay" | "shopify";

type PricingRow = Product & {
  amazon: number;
  walmart: number;
  ebay: number;
  shopify: number;
};

const MARKETPLACES: { key: MarketplaceKey; label: string; color: string; multiplier: number }[] = [
  { key: "amazon",  label: "Amazon",  color: "bg-orange-100 text-orange-700",  multiplier: 1.18 },
  { key: "walmart", label: "Walmart", color: "bg-blue-100 text-blue-700",    multiplier: 1.12 },
  { key: "ebay",    label: "eBay",    color: "bg-yellow-100 text-yellow-700", multiplier: 1.09 },
  { key: "shopify", label: "Shopify", color: "bg-green-100 text-green-700",  multiplier: 1.15 },
];

const fakeMarketPrice = (base: number, multiplier: number, sku: string) => {
  const seed = sku.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 20;
  return parseFloat((base * multiplier + seed * 0.1 - 1).toFixed(2));
};

export function MarketplacePricing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState<MarketplaceKey | "all">("all");
  const [editRow, setEditRow] = useState<PricingRow | null>(null);
  const [editPrices, setEditPrices] = useState<Record<MarketplaceKey, string>>({
    amazon: "", walmart: "", ebay: "", shopify: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (error) toast.error(error.message);
    else setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rows: PricingRow[] = useMemo(() =>
    products.map((p) => ({
      ...p,
      amazon:  fakeMarketPrice(p.price, 1.18, p.sku + "a"),
      walmart: fakeMarketPrice(p.price, 1.12, p.sku + "w"),
      ebay:    fakeMarketPrice(p.price, 1.09, p.sku + "e"),
      shopify: fakeMarketPrice(p.price, 1.15, p.sku + "s"),
    })), [products]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || r.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [rows, search, categoryFilter]);

  const avgMargin = useMemo(() => {
    if (!rows.length) return 0;
    const total = rows.reduce((sum, r) => {
      const bestPrice = Math.max(r.amazon, r.walmart, r.ebay, r.shopify);
      return sum + ((bestPrice - r.price) / r.price) * 100;
    }, 0);
    return (total / rows.length).toFixed(1);
  }, [rows]);

  const underpriced = useMemo(() =>
    rows.filter((r) => Math.min(r.amazon, r.walmart, r.ebay, r.shopify) < r.price).length,
    [rows]);

  const openEdit = (row: PricingRow) => {
    setEditRow(row);
    setEditPrices({
      amazon:  String(row.amazon),
      walmart: String(row.walmart),
      ebay:    String(row.ebay),
      shopify: String(row.shopify),
    });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    const avg = (
      Number(editPrices.amazon) +
      Number(editPrices.walmart) +
      Number(editPrices.ebay) +
      Number(editPrices.shopify)
    ) / 4;
    const { error } = await supabase
      .from("products")
      .update({ price: parseFloat((avg / 1.135).toFixed(2)) })
      .eq("id", editRow.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Prices updated for " + editRow.name);
    setEditRow(null);
    load();
  };

  const exportCsv = () => {
    const header = "SKU,Name,Category,Base Price,Amazon,Walmart,eBay,Shopify";
    const body = filtered.map((r) =>
      `"${r.sku}","${r.name}","${r.category}",${r.price},${r.amazon},${r.walmart},${r.ebay},${r.shopify}`
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "marketplace-pricing.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  const priceDiff = (market: number, base: number) => {
    return ((market - base) / base) * 100;
  };

  const visibleMarkets = marketFilter === "all"
    ? MARKETPLACES
    : MARKETPLACES.filter((m) => m.key === marketFilter);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Marketplace Pricing</h2>
          <p className="text-muted-foreground mt-2">
            Compare and adjust tire prices across Amazon, Walmart, eBay, and Shopify.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total SKUs",       value: products.length.toLocaleString(), icon: Store,        sub: "Across all marketplaces" },
          { label: "Avg Margin",       value: `${avgMargin}%`,                  icon: TrendingUp,   sub: "vs. base price" },
          { label: "Underpriced SKUs", value: underpriced.toString(),           icon: TrendingDown, sub: "Below base price" },
          { label: "Marketplaces",     value: "4",                              icon: AlertCircle,  sub: "Amazon, Walmart, eBay, Shopify" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search SKU or tire name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={marketFilter} onValueChange={(v) => setMarketFilter(v as MarketplaceKey | "all")}>
            <SelectTrigger><SelectValue placeholder="All Marketplaces" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Marketplaces</SelectItem>
              {MARKETPLACES.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {MARKETPLACES.map((m) => (
          <span key={m.key} className={`px-3 py-1 rounded-full text-xs font-medium ${m.color}`}>
            {m.label}
          </span>
        ))}
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground ml-2">
          🟢 Above base &nbsp;&nbsp; 🔴 Below base
        </span>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">
            Pricing Comparison ({filtered.length.toLocaleString()} tires)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                {visibleMarkets.map((m) => (
                  <TableHead key={m.key} className="text-right">{m.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5 + visibleMarkets.length} className="text-center py-10 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5 + visibleMarkets.length} className="text-center py-10 text-muted-foreground">
                    No tires found
                  </TableCell>
                </TableRow>
              ) : filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.sku}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{row.name}</TableCell>
                  <TableCell><Badge variant="outline">{row.category}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">
                    ${row.price.toFixed(2)}
                  </TableCell>
                  {visibleMarkets.map((m) => {
                    const mp = row[m.key];
                    const diff = priceDiff(mp, row.price);
                    const isAbove = diff >= 0;
                    return (
                      <TableCell key={m.key} className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">${mp.toFixed(2)}</span>
                          <span className={`text-xs ${isAbove ? "text-green-600" : "text-red-500"}`}>
                            {isAbove ? "+" : ""}{diff.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Marketplace Prices</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <span className="font-medium">{editRow.name}</span>
                <span className="text-muted-foreground ml-2">({editRow.sku})</span>
                <div className="text-muted-foreground mt-1">Base price: <span className="font-semibold text-foreground">${editRow.price.toFixed(2)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {MARKETPLACES.map((m) => (
                  <div key={m.key} className="space-y-1">
                    <Label>{m.label} Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPrices[m.key]}
                      onChange={(e) => setEditPrices((p) => ({ ...p, [m.key]: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {editPrices[m.key] && editRow.price
                        ? `${(((Number(editPrices[m.key]) - editRow.price) / editRow.price) * 100).toFixed(1)}% vs base`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Prices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
