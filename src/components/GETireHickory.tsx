import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Search, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

const FEED = [
  { sku:"GE-MICH-22565R17",  brand:"Michelin",    model:"Defender LTX",     size:"225/65R17", qty:48, cost:118.4, updated:"2m ago" },
  { sku:"GE-GDYR-20555R16",  brand:"Goodyear",    model:"Assurance",        size:"205/55R16", qty:36, cost:96.2,  updated:"2m ago" },
  { sku:"GE-BFG-26570R17",   brand:"BFGoodrich",  model:"KO2 All Terrain",  size:"265/70R17", qty:7,  cost:182.0, updated:"5m ago" },
  { sku:"GE-PIRL-25540R19",  brand:"Pirelli",     model:"P Zero",           size:"255/40R19", qty:14, cost:241.5, updated:"5m ago" },
  { sku:"GE-CONT-23555R18",  brand:"Continental", model:"CrossContact LX",  size:"235/55R18", qty:22, cost:151.0, updated:"11m ago" },
  { sku:"GE-IRON-26570R17",  brand:"Ironman",     model:"All Country AT",   size:"265/70R17", qty:61, cost:78.9,  updated:"11m ago" },
  { sku:"GE-HANK-21560R16",  brand:"Hankook",     model:"Kinergy PT",       size:"215/60R16", qty:52, cost:71.0,  updated:"15m ago" },
  { sku:"GE-NEXN-22550R17",  brand:"Nexen",       model:"N5000 Plus",       size:"225/50R17", qty:29, cost:62.4,  updated:"15m ago" },
];

export function GETireHickory() {
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return !s ? FEED : FEED.filter(r =>
      [r.sku, r.brand, r.model, r.size].some(v => v.toLowerCase().includes(s)));
  }, [q]);

  const totals = useMemo(() => ({
    skus: FEED.length,
    units: FEED.reduce((s,r)=>s+r.qty,0),
    value: FEED.reduce((s,r)=>s+r.qty*r.cost,0),
    low: FEED.filter(r=>r.qty<10).length,
  }), []);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success("Hickory feed refreshed"); }, 900);
  };

  const exportCsv = () => {
    const header = "sku,brand,model,size,qty,cost\n";
    const body = FEED.map(r => `${r.sku},${r.brand},${r.model},${r.size},${r.qty},${r.cost}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ge-hickory-inventory.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-primary"/>GE Tire Hickory Inventory
          </h2>
          <p className="text-muted-foreground mt-1">Live warehouse feed from the Hickory, NC distribution center.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2"/>Export CSV</Button>
          <Button onClick={sync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing?"animate-spin":""}`}/>{syncing?"Syncing...":"Sync feed"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">SKUs</p><p className="text-2xl font-bold mt-1">{totals.skus}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Units</p><p className="text-2xl font-bold mt-1">{totals.units}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Inventory Value</p><p className="text-2xl font-bold mt-1">${totals.value.toLocaleString(undefined,{maximumFractionDigits:0})}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Low Stock</p><p className="text-2xl font-bold mt-1 text-red-500">{totals.low}</p></Card>
      </div>

      <Card className="p-4">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input className="pl-9" placeholder="Search SKU, brand, size..." value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead><TableHead>Brand</TableHead><TableHead>Model</TableHead>
              <TableHead>Size</TableHead><TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Cost</TableHead><TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.sku}>
                <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                <TableCell>{r.brand}</TableCell>
                <TableCell>{r.model}</TableCell>
                <TableCell>{r.size}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={r.qty<10?"destructive":"secondary"}>{r.qty}</Badge>
                </TableCell>
                <TableCell className="text-right">${r.cost.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}