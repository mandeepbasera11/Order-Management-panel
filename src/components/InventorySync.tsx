import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, ArrowUpDown, Warehouse, BarChart3, Package, Plus, Send } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SyncStatus = "Synced" | "Pending" | "Error" | "Out of Sync";
type Channel = { name: string; color: string; icon: string };

const CHANNELS: Channel[] = [
  { name: "Shopify",  color: "text-green-600",  icon: < SiShopify /> },
  { name: "Amazon",   color: "text-orange-600", icon: "📦" },
  { name: "eBay",     color: "text-blue-600",   icon: "🔵" },
  { name: "Walmart",  color: "text-yellow-600", icon: "🟡" },
];

const STATUS_COLORS: Record<SyncStatus, string> = {
  Synced:       "bg-green-100 text-green-700",
  Pending:      "bg-yellow-100 text-yellow-700",
  Error:        "bg-red-100 text-red-700",
  "Out of Sync":"bg-orange-100 text-orange-700",
};

type SyncItem = { sku: string; name: string; stock: number; shopify: SyncStatus; amazon: SyncStatus; ebay: SyncStatus; walmart: SyncStatus; lastSync: string };

const INIT_ITEMS: SyncItem[] = [
  { sku:"GE-Michelin-123",    name:"Michelin Defender 225/65R17",           stock:24, shopify:"Synced",      amazon:"Synced",       ebay:"Out of Sync",  walmart:"Synced",      lastSync:"2026-05-30 09:00" },
  { sku:"GE-Goodyear-456",    name:"Goodyear Assurance 205/55R16",          stock:18, shopify:"Synced",      amazon:"Pending",      ebay:"Synced",       walmart:"Synced",      lastSync:"2026-05-30 08:55" },
  { sku:"GE-BFG-KO2",        name:"BFGoodrich KO2 265/70R17",              stock:3,  shopify:"Synced",      amazon:"Out of Sync",  ebay:"Synced",       walmart:"Error",       lastSync:"2026-05-29 18:00" },
  { sku:"GE-Pirelli-321",    name:"Pirelli P Zero 255/40R19",              stock:11, shopify:"Out of Sync", amazon:"Synced",       ebay:"Synced",       walmart:"Synced",      lastSync:"2026-05-29 17:30" },
  { sku:"GE-Continental-654",name:"Continental CrossContact 235/55R18",    stock:31, shopify:"Synced",      amazon:"Synced",       ebay:"Synced",       walmart:"Synced",      lastSync:"2026-05-30 09:00" },
  { sku:"GE-Ironman-111",    name:"Ironman All Country AT 265/70R17",      stock:44, shopify:"Error",       amazon:"Synced",       ebay:"Pending",      walmart:"Synced",      lastSync:"2026-05-28 12:00" },
  { sku:"GE-Hankook-222",    name:"Hankook Kinergy 215/60R16",             stock:38, shopify:"Synced",      amazon:"Synced",       ebay:"Synced",       walmart:"Out of Sync", lastSync:"2026-05-29 09:00" },
];

type Warehouse = { id:string; name:string; location:string; stock:number; capacity:number };
const WAREHOUSES: Warehouse[] = [
  { id:"wh1", name:"Hickory Main",    location:"Hickory, NC",   stock:1842, capacity:3000 },
  { id:"wh2", name:"Charlotte Hub",  location:"Charlotte, NC", stock:624,  capacity:1500 },
  { id:"wh3", name:"Atlanta Depot",  location:"Atlanta, GA",   stock:312,  capacity:1000 },
];

type WHStock = { sku:string; name:string; wh1:number; wh2:number; wh3:number };
const WH_STOCK: WHStock[] = [
  { sku:"GE-Michelin-123", name:"Michelin Defender 225/65R17",    wh1:14, wh2:6,  wh3:4  },
  { sku:"GE-Goodyear-456", name:"Goodyear Assurance 205/55R16",   wh1:12, wh2:4,  wh3:2  },
  { sku:"GE-BFG-KO2",     name:"BFGoodrich KO2 265/70R17",       wh1:2,  wh2:1,  wh3:0  },
  { sku:"GE-Ironman-111", name:"Ironman All Country AT 265/70R17",wh1:28, wh2:10, wh3:6  },
  { sku:"GE-Hankook-222", name:"Hankook Kinergy 215/60R16",       wh1:20, wh2:12, wh3:6  },
];

const REORDER_ALERTS = [
  { sku:"GE-BFG-KO2",     name:"BFGoodrich KO2 265/70R17",  stock:3,  reorderPoint:20, suggested:40, vendor:"Cleve Tire" },
  { sku:"GE-Michelin-123",name:"Michelin Defender 225/65R17",stock:8,  reorderPoint:15, suggested:30, vendor:"National Tire" },
  { sku:"GE-Pirelli-321", name:"Pirelli P Zero 255/40R19",   stock:11, reorderPoint:12, suggested:24, vendor:"Vans Tire Pros" },
];

export function InventorySync() {
  const [items, setItems]         = useState<SyncItem[]>(INIT_ITEMS);
  const [syncing, setSyncing]     = useState<string|null>(null);
  const [progress, setProgress]   = useState(0);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transfer, setTransfer]   = useState({ from:"wh1", to:"wh2", sku:"", qty:"" });
  const [search, setSearch]       = useState("");

  const syncChannel = (channel: string) => {
    setSyncing(channel); setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setSyncing(null);
          setItems(prev => prev.map(it => {
            const key = channel.toLowerCase() as keyof SyncItem;
            return { ...it, [key]: "Synced", lastSync: new Date().toISOString().slice(0,16).replace("T"," ") };
          }));
          toast.success(`${channel} sync complete — ${items.length} SKUs updated`);
          return 100;
        }
        return p + 8;
      });
    }, 120);
  };

  const syncAll = () => {
    CHANNELS.forEach((c, i) => setTimeout(() => syncChannel(c.name), i * 1500));
  };

  const submitTransfer = () => {
    if (!transfer.sku || !transfer.qty || transfer.from === transfer.to) {
      toast.error("Fill all fields and select different warehouses"); return;
    }
    toast.success(`Transferred ${transfer.qty} units of ${transfer.sku} from ${transfer.from} to ${transfer.to}`);
    setTransferOpen(false); setTransfer({ from:"wh1", to:"wh2", sku:"", qty:"" });
  };

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    return !q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q);
  });

  const syncErrors  = items.filter(it => [it.shopify,it.amazon,it.ebay,it.walmart].includes("Error")).length;
  const outOfSync   = items.filter(it => [it.shopify,it.amazon,it.ebay,it.walmart].includes("Out of Sync")).length;
  const fullySynced = items.filter(it => [it.shopify,it.amazon,it.ebay,it.walmart].every(s=>s==="Synced")).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Real-time sync, multi-warehouse management and reorder alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
            <ArrowUpDown className="w-4 h-4 mr-1"/>Stock Transfer
          </Button>
          <Button size="sm" onClick={syncAll} disabled={!!syncing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing?"animate-spin":""}`}/>
            {syncing ? `Syncing ${syncing}...` : "Sync All Channels"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Fully Synced",  value:fullySynced, color:"text-green-600" },
          { label:"Out of Sync",   value:outOfSync,   color:"text-orange-600" },
          { label:"Sync Errors",   value:syncErrors,  color:"text-red-600" },
          { label:"Total SKUs",    value:items.length,color:"text-blue-600" },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {syncing && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500"/>
            <span className="text-sm font-medium">Syncing {syncing}... {progress}%</span>
          </div>
          <Progress value={progress} className="h-2"/>
        </Card>
      )}

      <Tabs defaultValue="sync">
        <TabsList>
          <TabsTrigger value="sync">Channel Sync</TabsTrigger>
          <TabsTrigger value="warehouse">Multi-Warehouse</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Alerts</TabsTrigger>
          <TabsTrigger value="barcode">Barcode / QR</TabsTrigger>
        </TabsList>

        {/* Channel Sync */}
        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CHANNELS.map(ch => {
              const chKey = ch.name.toLowerCase() as keyof SyncItem;
              const synced  = items.filter(it => it[chKey]==="Synced").length;
              const errors  = items.filter(it => it[chKey]==="Error").length;
              const pending = items.filter(it => it[chKey]==="Pending" || it[chKey]==="Out of Sync").length;
              return (
                <Card key={ch.name} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ch.icon}</span>
                      <span className={`font-bold ${ch.color}`}>{ch.name}</span>
                    </div>
                    {errors > 0 && <AlertTriangle className="w-4 h-4 text-red-500"/>}
                    {errors === 0 && <CheckCircle2 className="w-4 h-4 text-green-500"/>}
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between"><span>Synced</span><span className="text-green-600 font-bold">{synced}</span></div>
                    <div className="flex justify-between"><span>Pending</span><span className="text-yellow-600 font-bold">{pending}</span></div>
                    <div className="flex justify-between"><span>Errors</span><span className="text-red-600 font-bold">{errors}</span></div>
                  </div>
                  <Button size="sm" className="w-full text-xs" variant="outline"
                    disabled={syncing === ch.name}
                    onClick={() => syncChannel(ch.name)}>
                    <RefreshCw className={`w-3 h-3 mr-1 ${syncing===ch.name?"animate-spin":""}`}/>
                    {syncing===ch.name?"Syncing...":"Sync Now"}
                  </Button>
                </Card>
              );
            })}
          </div>

          <Card className="p-4">
            <div className="mb-3">
              <Input placeholder="Search SKU or product name..." value={search} onChange={e=>setSearch(e.target.value)}
                className="max-w-xs"/>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Shopify</TableHead>
                    <TableHead>Amazon</TableHead>
                    <TableHead>eBay</TableHead>
                    <TableHead>Walmart</TableHead>
                    <TableHead>Last Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(it => (
                    <TableRow key={it.sku}>
                      <TableCell className="font-mono text-xs">{it.sku}</TableCell>
                      <TableCell className="font-medium text-sm">{it.name}</TableCell>
                      <TableCell><span className={it.stock<10?"text-red-600 font-bold":"font-medium"}>{it.stock}</span></TableCell>
                      {([it.shopify,it.amazon,it.ebay,it.walmart] as SyncStatus[]).map((s,i) => (
                        <TableCell key={i}>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s]}`}>
                            {s==="Synced"?<CheckCircle2 className="w-3 h-3"/>:s==="Error"?<XCircle className="w-3 h-3"/>:<AlertTriangle className="w-3 h-3"/>}
                            {s}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-muted-foreground">{it.lastSync}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Multi-Warehouse */}
        <TabsContent value="warehouse" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {WAREHOUSES.map(wh => (
              <Card key={wh.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">{wh.name}</p>
                    <p className="text-sm text-muted-foreground">{wh.location}</p>
                  </div>
                  <Warehouse className="w-5 h-5 text-muted-foreground"/>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stock</span><span className="font-bold">{wh.stock.toLocaleString()} / {wh.capacity.toLocaleString()}</span>
                  </div>
                  <Progress value={(wh.stock/wh.capacity)*100} className="h-2"/>
                  <p className="text-xs text-muted-foreground">{Math.round((wh.stock/wh.capacity)*100)}% capacity used</p>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Stock by Warehouse</h3>
              <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)}>
                <ArrowUpDown className="w-4 h-4 mr-1"/>Transfer Stock
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Hickory Main</TableHead>
                  <TableHead className="text-center">Charlotte Hub</TableHead>
                  <TableHead className="text-center">Atlanta Depot</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {WH_STOCK.map(w => (
                  <TableRow key={w.sku}>
                    <TableCell className="font-mono text-xs">{w.sku}</TableCell>
                    <TableCell className="font-medium text-sm">{w.name}</TableCell>
                    <TableCell className="text-center font-semibold">{w.wh1}</TableCell>
                    <TableCell className="text-center">{w.wh2}</TableCell>
                    <TableCell className="text-center">{w.wh3}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{w.wh1+w.wh2+w.wh3}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Reorder Alerts */}
        <TabsContent value="reorder" className="space-y-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5"/>
              <span className="font-semibold">{REORDER_ALERTS.length} items below reorder point — action required</span>
            </div>
          </Card>
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Reorder Recommendations</h3>
              <Button size="sm" onClick={() => toast.success("Purchase orders created for all low-stock items!")}>
                <Package className="w-4 h-4 mr-1"/>Create All POs
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="text-right">Suggested Qty</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REORDER_ALERTS.map(r => (
                  <TableRow key={r.sku} className="bg-red-50">
                    <TableCell>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">{r.stock}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.reorderPoint}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">{r.suggested}</TableCell>
                    <TableCell><Badge variant="outline">{r.vendor}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" className="text-xs h-7"
                        onClick={() => toast.success(`PO created for ${r.name} — ${r.suggested} units from ${r.vendor}`)}>
                        Create PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Barcode / QR */}
        <TabsContent value="barcode" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title:"Scan to Receive",  desc:"Scan barcode when stock arrives at warehouse. Automatically updates inventory count.", icon:"📷", action:"Open Scanner" },
              { title:"Scan to Pick",     desc:"Scan tire barcode during order picking to confirm correct item and reduce errors.",     icon:"✅", action:"Start Picking" },
              { title:"Print Barcode",    desc:"Generate and print barcodes or QR codes for any SKU in your catalog.",                icon:"🖨️", action:"Print Labels" },
            ].map(b => (
              <Card key={b.title} className="p-5 space-y-3">
                <div className="text-3xl">{b.icon}</div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
                <Button size="sm" className="w-full" onClick={() => toast.success(`${b.action} — feature requires device camera/printer integration`)}>
                  {b.action}
                </Button>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Generate Barcode / QR Code</h3>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="space-y-1.5 flex-1 min-w-48">
                <Label>SKU</Label>
                <Input placeholder="e.g. GE-Michelin-123"/>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue="barcode">
                  <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barcode">Barcode (128)</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => toast.success("Barcode generated — print dialog opened")}>
                Generate & Print
              </Button>
            </div>
            <div className="mt-4 p-8 border-2 border-dashed border-border rounded-lg text-center text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p className="text-sm">Enter a SKU and click Generate to preview the barcode here</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpDown className="w-5 h-5"/>Stock Transfer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From Warehouse</Label>
                <Select value={transfer.from} onValueChange={v => setTransfer({...transfer,from:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{WAREHOUSES.map(w=><SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>To Warehouse</Label>
                <Select value={transfer.to} onValueChange={v => setTransfer({...transfer,to:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{WAREHOUSES.map(w=><SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input placeholder="e.g. GE-Michelin-123" value={transfer.sku} onChange={e=>setTransfer({...transfer,sku:e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" placeholder="e.g. 10" value={transfer.qty} onChange={e=>setTransfer({...transfer,qty:e.target.value})}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setTransferOpen(false)}>Cancel</Button>
            <Button onClick={submitTransfer}><Send className="w-4 h-4 mr-1"/>Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
