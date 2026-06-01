import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Upload, Download, Truck, Package, CheckCircle2, Clock, RefreshCw, XCircle, RotateCcw, FileText, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "New Order" | "Processing" | "Picking" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
type Order = {
  id: string; orderNo: string; customer: string; email: string; phone: string;
  items: { sku: string; name: string; qty: number; price: number }[];
  status: OrderStatus; created: string; updated: string;
  warehouse: string; carrier: string; trackingNo: string; rma?: string;
  notes: string; channel: string; total: number; backorder: boolean;
};

const STATUS_FLOW: OrderStatus[] = ["New Order","Processing","Picking","Packed","Shipped","Delivered"];
const STATUS_COLORS: Record<OrderStatus,string> = {
  "New Order":  "bg-blue-100 text-blue-700",
  "Processing": "bg-yellow-100 text-yellow-700",
  "Picking":    "bg-orange-100 text-orange-700",
  "Packed":     "bg-purple-100 text-purple-700",
  "Shipped":    "bg-indigo-100 text-indigo-700",
  "Delivered":  "bg-green-100 text-green-700",
  "Cancelled":  "bg-red-100 text-red-700",
  "Returned":   "bg-gray-100 text-gray-700",
};
const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  "New Order":  <Plus className="w-3.5 h-3.5"/>,
  "Processing": <Clock className="w-3.5 h-3.5"/>,
  "Picking":    <Package className="w-3.5 h-3.5"/>,
  "Packed":     <CheckCircle2 className="w-3.5 h-3.5"/>,
  "Shipped":    <Truck className="w-3.5 h-3.5"/>,
  "Delivered":  <CheckCircle2 className="w-3.5 h-3.5"/>,
  "Cancelled":  <XCircle className="w-3.5 h-3.5"/>,
  "Returned":   <RotateCcw className="w-3.5 h-3.5"/>,
};

const SAMPLE_ORDERS: Order[] = [
  { id:"1", orderNo:"ORD-2026-0001", customer:"Mike Johnson",   email:"mike@example.com",  phone:"(555)111-2222", items:[{sku:"GE-Michelin-123",name:"Michelin Defender 225/65R17",qty:4,price:145}], status:"New Order",  created:"2026-05-30",updated:"2026-05-30",warehouse:"Hickory, NC",carrier:"FedEx",trackingNo:"",notes:"",channel:"Amazon",total:580,backorder:false},
  { id:"2", orderNo:"ORD-2026-0002", customer:"Sarah Williams", email:"sarah@example.com", phone:"(555)222-3333", items:[{sku:"GE-Goodyear-456",name:"Goodyear Assurance 205/55R16",qty:4,price:120}], status:"Processing",created:"2026-05-29",updated:"2026-05-30",warehouse:"Hickory, NC",carrier:"UPS",trackingNo:"",notes:"Rush order",channel:"Shopify",total:480,backorder:false},
  { id:"3", orderNo:"ORD-2026-0003", customer:"Tom Brown",      email:"tom@example.com",   phone:"(555)333-4444", items:[{sku:"GE-BFG-789",name:"BFGoodrich KO2 265/70R17",qty:4,price:210}], status:"Picking",    created:"2026-05-28",updated:"2026-05-30",warehouse:"Hickory, NC",carrier:"FedEx",trackingNo:"",notes:"",channel:"eBay",total:840,backorder:false},
  { id:"4", orderNo:"ORD-2026-0004", customer:"Lisa Davis",     email:"lisa@example.com",  phone:"(555)444-5555", items:[{sku:"GE-Pirelli-321",name:"Pirelli P Zero 255/40R19",qty:4,price:280}], status:"Packed",     created:"2026-05-27",updated:"2026-05-30",warehouse:"Hickory, NC",carrier:"DHL",trackingNo:"",notes:"",channel:"Walmart",total:1120,backorder:false},
  { id:"5", orderNo:"ORD-2026-0005", customer:"James Wilson",   email:"james@example.com", phone:"(555)555-6666", items:[{sku:"GE-Continental-654",name:"Continental CrossContact 235/55R18",qty:4,price:165}], status:"Shipped",    created:"2026-05-26",updated:"2026-05-30",warehouse:"Hickory, NC",carrier:"UPS",trackingNo:"1Z999AA10123456784",notes:"",channel:"Amazon",total:660,backorder:false},
  { id:"6", orderNo:"ORD-2026-0006", customer:"Amy Chen",       email:"amy@example.com",   phone:"(555)666-7777", items:[{sku:"GE-Ironman-111",name:"Ironman All Country AT 265/70R17",qty:4,price:97}], status:"Delivered",  created:"2026-05-25",updated:"2026-05-29",warehouse:"Hickory, NC",carrier:"FedEx",trackingNo:"7489234790234",notes:"",channel:"Shopify",total:388,backorder:false},
  { id:"7", orderNo:"ORD-2026-0007", customer:"Bob Martinez",   email:"bob@example.com",   phone:"(555)777-8888", items:[{sku:"GE-Hankook-222",name:"Hankook Kinergy 215/60R16",qty:4,price:88}], status:"Cancelled",  created:"2026-05-24",updated:"2026-05-25",warehouse:"Hickory, NC",carrier:"",trackingNo:"",notes:"Customer cancelled",channel:"Walmart",total:352,backorder:false},
  { id:"8", orderNo:"ORD-2026-0008", customer:"Carol White",    email:"carol@example.com", phone:"(555)888-9999", items:[{sku:"GE-Nexen-333",name:"Nexen N5000 Plus 225/50R17",qty:4,price:75}], status:"New Order",  created:"2026-05-30",updated:"2026-05-30",warehouse:"Hickory, NC",carrier:"USPS",trackingNo:"",notes:"",channel:"eBay",total:300,backorder:true},
];

const genRMA = () => `RMA-${Date.now().toString().slice(-6)}`;

export function Orders() {
  const [orders, setOrders]       = useState<Order[]>(SAMPLE_ORDERS);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [tab, setTab]             = useState("orders");

  // Returns
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returns, setReturns] = useState<{id:string;orderNo:string;customer:string;rma:string;reason:string;status:string;date:string}[]>([]);

  // Backorders
  const backorders = orders.filter(o => o.backorder);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const ms = !q || o.orderNo.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    const mst = statusFilter === "all" || o.status === statusFilter;
    const mc  = channelFilter === "all" || o.channel === channelFilter;
    return ms && mst && mc;
  }), [orders, search, statusFilter, channelFilter]);

  const stats = [
    { label:"Total Orders",   value: orders.length,                              color:"text-blue-600"   },
    { label:"New",            value: orders.filter(o=>o.status==="New Order").length, color:"text-indigo-600"},
    { label:"In Transit",     value: orders.filter(o=>o.status==="Shipped").length,   color:"text-orange-600"},
    { label:"Delivered",      value: orders.filter(o=>o.status==="Delivered").length, color:"text-green-600" },
    { label:"Backorders",     value: backorders.length,                          color:"text-red-500"    },
    { label:"Returns",        value: returns.length,                             color:"text-gray-600"   },
  ];

  const advanceStatus = (id: string) => {
    setOrders(os => os.map(o => {
      if (o.id !== id) return o;
      const idx = STATUS_FLOW.indexOf(o.status as any);
      if (idx < 0 || idx >= STATUS_FLOW.length - 1) return o;
      const next = STATUS_FLOW[idx + 1];
      toast.success(`Order ${o.orderNo} → ${next}`);
      return { ...o, status: next, updated: new Date().toISOString().slice(0,10) };
    }));
  };

  const bulkAdvance = () => {
    Array.from(selected).forEach(id => advanceStatus(id));
    setSelected(new Set());
  };

  const bulkCancel = () => {
    setOrders(os => os.map(o => selected.has(o.id) ? {...o, status:"Cancelled"} : o));
    toast.success(`${selected.size} order(s) cancelled`);
    setSelected(new Set());
  };

  const submitReturn = () => {
    if (!returnOrder || !returnReason) { toast.error("Please provide a return reason"); return; }
    const rma = genRMA();
    setReturns(r => [...r, { id:Date.now().toString(), orderNo:returnOrder.orderNo, customer:returnOrder.customer, rma, reason:returnReason, status:"Pending", date:new Date().toISOString().slice(0,10) }]);
    setOrders(os => os.map(o => o.id===returnOrder.id ? {...o, status:"Returned", rma} : o));
    toast.success(`Return filed. RMA: ${rma}`);
    setReturnOrder(null); setReturnReason("");
  };

  const toggleSelect = (id:string) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const allSel = filtered.length>0 && filtered.every(o=>selected.has(o.id));
  const toggleAll = () => setSelected(s => { const n=new Set(s); if(allSel) filtered.forEach(o=>n.delete(o.id)); else filtered.forEach(o=>n.add(o.id)); return n; });

  const exportCSV = () => {
    const header = "Order No,Customer,Status,Channel,Total,Created";
    const rows = filtered.map(o => `${o.orderNo},${o.customer},${o.status},${o.channel},$${o.total},${o.created}`);
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="orders.csv"; a.click();
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-sm text-muted-foreground">Manage orders, returns, backorders and bulk processing</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1"/>Export CSV</Button>
          <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1"/>Import Orders</Button>
          <Button size="sm"><Plus className="w-4 h-4 mr-1"/>New Order</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s=>(
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="returns">Returns & Warranty</TabsTrigger>
          <TabsTrigger value="backorders">Backorders</TabsTrigger>
        </TabsList>

        {/* ── ALL ORDERS ── */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input className="pl-9" placeholder="Search order, customer..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {[...STATUS_FLOW,"Cancelled","Returned"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Channels"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {["Amazon","eBay","Walmart","Shopify"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {selected.size>0 && (
            <Card className="p-3 flex items-center gap-3 bg-muted/40">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={bulkAdvance}><ChevronRight className="w-4 h-4 mr-1"/>Advance Status</Button>
              <Button size="sm" variant="outline"><FileText className="w-4 h-4 mr-1"/>Print Labels</Button>
              <Button size="sm" variant="destructive" onClick={bulkCancel}><XCircle className="w-4 h-4 mr-1"/>Cancel</Button>
              <Button size="sm" variant="ghost" onClick={()=>setSelected(new Set())}>Clear</Button>
            </Card>
          )}

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><input type="checkbox" checked={allSel} onChange={toggleAll}/></TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o=>(
                    <TableRow key={o.id} className={o.backorder?"bg-red-50":""}>
                      <TableCell><input type="checkbox" checked={selected.has(o.id)} onChange={()=>toggleSelect(o.id)}/></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{o.orderNo}</span>
                          {o.backorder && <Badge variant="destructive" className="text-xs">Backorder</Badge>}
                          {o.rma && <Badge variant="secondary" className="text-xs">{o.rma}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{o.customer}</p>
                          <p className="text-xs text-muted-foreground">{o.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{o.channel}</Badge></TableCell>
                      <TableCell className="text-sm">{o.items.length} item(s)</TableCell>
                      <TableCell className="font-semibold">${o.total}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                          {STATUS_ICONS[o.status]}{o.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.created}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={()=>setViewOrder(o)}>View</Button>
                          {STATUS_FLOW.includes(o.status as any) && STATUS_FLOW.indexOf(o.status as any) < STATUS_FLOW.length-1 && (
                            <Button size="sm" className="text-xs h-7" onClick={()=>advanceStatus(o.id)}>
                              <ChevronRight className="w-3 h-3"/>Next
                            </Button>
                          )}
                          {!["Cancelled","Returned","Delivered"].includes(o.status) && (
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={()=>setReturnOrder(o)}>
                              <RotateCcw className="w-3 h-3"/>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── RETURNS ── */}
        <TabsContent value="returns" className="space-y-4">
          <Card>
            <div className="p-4 border-b">
              <h3 className="font-semibold">Returns & RMA Tracking</h3>
              <p className="text-xs text-muted-foreground">All return requests and warranty claims</p>
            </div>
            {returns.length===0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30"/>
                <p>No returns filed yet</p>
                <p className="text-xs mt-1">Use the "↩" button on any delivered order to file a return</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RMA #</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map(r=>(
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-bold text-orange-600">{r.rma}</TableCell>
                      <TableCell className="font-mono text-xs">{r.orderNo}</TableCell>
                      <TableCell className="text-sm">{r.customer}</TableCell>
                      <TableCell className="text-sm">{r.reason}</TableCell>
                      <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ── BACKORDERS ── */}
        <TabsContent value="backorders" className="space-y-4">
          <Card>
            <div className="p-4 border-b flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500"/>
              <h3 className="font-semibold">Backorder Management</h3>
              <Badge variant="destructive">{backorders.length}</Badge>
            </div>
            {backorders.length===0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30"/>
                <p>No backorders — all items are in stock!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backorders.map(o=>(
                    <TableRow key={o.id} className="bg-red-50">
                      <TableCell className="font-mono text-xs font-bold">{o.orderNo}</TableCell>
                      <TableCell className="text-sm">{o.customer}</TableCell>
                      <TableCell className="text-sm">{o.items.map(i=>i.name).join(", ")}</TableCell>
                      <TableCell className="font-semibold">${o.total}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                          {o.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="text-xs h-7"
                          onClick={()=>{ setOrders(os=>os.map(x=>x.id===o.id?{...x,backorder:false,status:"Processing"}:x)); toast.success("Backorder fulfilled — moved to Processing"); }}>
                          Fulfill Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Order Detail Dialog ── */}
      <Dialog open={!!viewOrder} onOpenChange={o=>!o&&setViewOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5"/>
                  {viewOrder.orderNo}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewOrder.status]}`}>{viewOrder.status}</span>
                </DialogTitle>
              </DialogHeader>

              {/* Workflow stepper */}
              <div className="flex items-center gap-1 py-3 overflow-x-auto">
                {STATUS_FLOW.map((s,i)=>{
                  const idx = STATUS_FLOW.indexOf(viewOrder.status as any);
                  const done = i <= idx;
                  return (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all
                        ${done?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>
                        {s}
                      </div>
                      {i < STATUS_FLOW.length-1 && <ChevronRight className={`w-3 h-3 ${done&&i<idx?"text-primary":"text-muted-foreground"}`}/>}
                    </div>
                  );
                })}
              </div>
              <Separator/>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{viewOrder.customer}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{viewOrder.email}</p></div>
                <div><p className="text-muted-foreground">Channel</p><Badge variant="outline">{viewOrder.channel}</Badge></div>
                <div><p className="text-muted-foreground">Warehouse</p><p className="font-medium">{viewOrder.warehouse}</p></div>
                <div><p className="text-muted-foreground">Carrier</p><p className="font-medium">{viewOrder.carrier||"—"}</p></div>
                <div><p className="text-muted-foreground">Tracking</p><p className="font-mono text-xs">{viewOrder.trackingNo||"—"}</p></div>
                {viewOrder.rma && <div><p className="text-muted-foreground">RMA</p><p className="font-bold text-orange-600">{viewOrder.rma}</p></div>}
              </div>
              <Separator/>
              <div>
                <p className="text-sm font-semibold mb-2">Order Items</p>
                {viewOrder.items.map((it,i)=>(
                  <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <div>
                      <p className="font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{it.sku} × {it.qty}</p>
                    </div>
                    <p className="font-semibold">${(it.price*it.qty).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t">
                  <span>Total</span><span>${viewOrder.total}</span>
                </div>
              </div>
              {viewOrder.notes && <div className="text-sm bg-muted/40 rounded p-3"><span className="font-semibold">Notes: </span>{viewOrder.notes}</div>}
              <DialogFooter className="gap-2">
                {STATUS_FLOW.includes(viewOrder.status as any) && STATUS_FLOW.indexOf(viewOrder.status as any)<STATUS_FLOW.length-1 && (
                  <Button onClick={()=>{ advanceStatus(viewOrder.id); setViewOrder(null); }}>
                    <ChevronRight className="w-4 h-4 mr-1"/>Advance to Next Step
                  </Button>
                )}
                <Button variant="outline" onClick={()=>setViewOrder(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Return Dialog ── */}
      <Dialog open={!!returnOrder} onOpenChange={o=>!o&&setReturnOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5"/>File Return / Warranty Claim</DialogTitle></DialogHeader>
          {returnOrder && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded p-3 text-sm">
                <p className="font-medium">{returnOrder.orderNo}</p>
                <p className="text-muted-foreground">{returnOrder.customer}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Return Reason</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason"/></SelectTrigger>
                  <SelectContent>
                    {["Defective product","Wrong item shipped","Customer changed mind","Warranty claim","Damaged in transit","Other"].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">An RMA number will be automatically generated.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setReturnOrder(null)}>Cancel</Button>
            <Button onClick={submitReturn}><RotateCcw className="w-4 h-4 mr-1"/>Submit Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
