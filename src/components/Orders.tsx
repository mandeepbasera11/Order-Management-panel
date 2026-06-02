import { useState, useMemo, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
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
import { logAudit } from "@/lib/audit";

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

const genRMA = () => `RMA-${Date.now().toString().slice(-6)}`;

type DbOrderRow = {
  id: string; order_no: string; customer: string; email: string | null; phone: string | null;
  status: string; channel: string | null; warehouse: string | null; carrier: string | null;
  tracking_no: string | null; total: number; notes: string | null; backorder: boolean;
  rma: string | null; created_at: string; updated_at: string;
  order_items: { sku: string; name: string; qty: number; price: number }[];
};

const mapRow = (r: DbOrderRow): Order => ({
  id: r.id, orderNo: r.order_no, customer: r.customer,
  email: r.email ?? "", phone: r.phone ?? "",
  items: r.order_items ?? [],
  status: r.status as OrderStatus,
  created: r.created_at?.slice(0, 10) ?? "",
  updated: r.updated_at?.slice(0, 10) ?? "",
  warehouse: r.warehouse ?? "", carrier: r.carrier ?? "",
  trackingNo: r.tracking_no ?? "", rma: r.rma ?? undefined,
  notes: r.notes ?? "", channel: r.channel ?? "",
  total: Number(r.total) || 0, backorder: !!r.backorder,
});

export function Orders() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
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

  // New order dialog
  const emptyItem = { sku: "", name: "", qty: 1, price: 0 };
  const blankNew = {
    order_no: "", customer: "", email: "", phone: "",
    channel: "Shopify", warehouse: "", carrier: "", tracking_no: "",
    notes: "", backorder: false,
    items: [ { ...emptyItem } ],
  };
  const [newOpen, setNewOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<typeof blankNew>(blankNew);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const newTotal = newOrder.items.reduce((s,i)=> s + (Number(i.qty)||0) * (Number(i.price)||0), 0);

  const createOrder = async () => {
    if (!newOrder.order_no.trim() || !newOrder.customer.trim()) {
      toast.error("Order # and customer are required"); return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("orders").insert({
      order_no: newOrder.order_no.trim(),
      customer: newOrder.customer.trim(),
      email: newOrder.email || null,
      phone: newOrder.phone || null,
      status: "New Order",
      channel: newOrder.channel || null,
      warehouse: newOrder.warehouse || null,
      carrier: newOrder.carrier || null,
      tracking_no: newOrder.tracking_no || null,
      notes: newOrder.notes || null,
      backorder: newOrder.backorder,
      total: newTotal,
    }).select("id").single();
    if (error || !data) { setSaving(false); toast.error(error?.message || "Failed"); return; }
    const items = newOrder.items
      .filter(i => i.sku.trim() || i.name.trim())
      .map(i => ({ order_id: data.id, sku: i.sku, name: i.name, qty: Number(i.qty)||0, price: Number(i.price)||0 }));
    if (items.length) {
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) { setSaving(false); toast.error(iErr.message); return; }
    }
    setSaving(false); setNewOpen(false); setNewOrder(blankNew);
    toast.success(`Order ${newOrder.order_no} created`);
    loadOrders();
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { toast.error("CSV is empty"); return; }
    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const idx = (k:string) => header.indexOf(k);
    const rows = lines.slice(1).map(l => {
      const c = l.split(",");
      return {
        order_no: c[idx("order no")] ?? c[idx("order_no")] ?? c[0],
        customer: c[idx("customer")] ?? c[1] ?? "",
        email: c[idx("email")] ?? null,
        channel: c[idx("channel")] ?? "Shopify",
        total: Number(c[idx("total")]?.replace(/[^0-9.\-]/g,"")) || 0,
        status: "New Order",
      };
    }).filter(r => r.order_no);
    if (!rows.length) { toast.error("No valid rows found"); return; }
    const { error } = await supabase.from("orders").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${rows.length} order(s)`);
    loadOrders();
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(sku,name,qty,price)")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setOrders((data as DbOrderRow[]).map(mapRow));
  };

  const loadReturns = async () => {
    const { data, error } = await supabase
      .from("returns").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setReturns((data ?? []).map((r: any) => ({
      id: r.id, orderNo: r.order_no, customer: r.customer, rma: r.rma,
      reason: r.reason, status: r.status, date: r.created_at?.slice(0,10) ?? "",
    })));
  };

  useEffect(() => {
    Promise.all([loadOrders(), loadReturns()]).finally(() => setLoading(false));
  }, []);

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

  const advanceStatus = async (id: string) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const idx = STATUS_FLOW.indexOf(o.status as any);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    void logAudit({
      action: "order.status_changed", entity_type: "order",
      entity_id: id, entity_label: o.orderNo,
      before: { status: o.status }, after: { status: next },
    });
    setOrders(os => os.map(x => x.id === id ? { ...x, status: next, updated: new Date().toISOString().slice(0,10) } : x));
    toast.success(`Order ${o.orderNo} → ${next}`);
  };

  const bulkAdvance = async () => {
    for (const id of Array.from(selected)) { await advanceStatus(id); }
    setSelected(new Set());
  };

  const bulkCancel = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("orders").update({ status: "Cancelled" }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    const cancelled = orders.filter(o => selected.has(o.id));
    for (const o of cancelled) {
      void logAudit({
        action: "order.cancelled", entity_type: "order",
        entity_id: o.id, entity_label: o.orderNo,
        before: { status: o.status }, after: { status: "Cancelled" },
        metadata: { customer: o.customer, total: o.total, source: "bulk_cancel" },
      });
    }
    setOrders(os => os.map(o => selected.has(o.id) ? {...o, status:"Cancelled"} : o));
    toast.success(`${ids.length} order(s) cancelled`);
    setSelected(new Set());
  };

  const submitReturn = async () => {
    if (!returnOrder || !returnReason) { toast.error("Please provide a return reason"); return; }
    const rma = genRMA();
    const { error: rErr } = await supabase.from("returns").insert({
      order_id: returnOrder.id, order_no: returnOrder.orderNo,
      customer: returnOrder.customer, rma, reason: returnReason, status: "Pending",
    });
    if (rErr) { toast.error(rErr.message); return; }
    const { error: oErr } = await supabase.from("orders")
      .update({ status: "Returned", rma }).eq("id", returnOrder.id);
    if (oErr) { toast.error(oErr.message); return; }
    await Promise.all([loadOrders(), loadReturns()]);
    toast.success(`Return filed. RMA: ${rma}`);
    setReturnOrder(null); setReturnReason("");
  };

  const fulfillBackorder = async (id: string) => {
    const { error } = await supabase.from("orders")
      .update({ backorder: false, status: "Processing" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders(os => os.map(x => x.id===id ? {...x, backorder:false, status:"Processing"} : x));
    toast.success("Backorder fulfilled — moved to Processing");
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
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value=""; }}/>
          <Button variant="outline" size="sm" onClick={()=>fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1"/>Import Orders
          </Button>
          <Button size="sm" onClick={()=>setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1"/>New Order
          </Button>
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
                          onClick={()=>fulfillBackorder(o.id)}>
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

      {/* ── New Order Dialog ── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5"/>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Order # *</Label>
                <Input value={newOrder.order_no} onChange={e=>setNewOrder({...newOrder, order_no:e.target.value})} placeholder="ORD-1001"/>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={newOrder.channel} onValueChange={v=>setNewOrder({...newOrder, channel:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {["Amazon","eBay","Walmart","Shopify","Manual"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Customer *</Label>
                <Input value={newOrder.customer} onChange={e=>setNewOrder({...newOrder, customer:e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={newOrder.email} onChange={e=>setNewOrder({...newOrder, email:e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={newOrder.phone} onChange={e=>setNewOrder({...newOrder, phone:e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label>Warehouse</Label>
                <Input value={newOrder.warehouse} onChange={e=>setNewOrder({...newOrder, warehouse:e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label>Carrier</Label>
                <Input value={newOrder.carrier} onChange={e=>setNewOrder({...newOrder, carrier:e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label>Tracking #</Label>
                <Input value={newOrder.tracking_no} onChange={e=>setNewOrder({...newOrder, tracking_no:e.target.value})}/>
              </div>
            </div>

            <Separator/>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={()=>setNewOrder({...newOrder, items:[...newOrder.items, {...emptyItem}]})}>
                  <Plus className="w-3 h-3 mr-1"/>Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {newOrder.items.map((it,i)=>(
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-3" placeholder="SKU" value={it.sku} onChange={e=>{
                      const items=[...newOrder.items]; items[i]={...it, sku:e.target.value}; setNewOrder({...newOrder, items});
                    }}/>
                    <Input className="col-span-5" placeholder="Name" value={it.name} onChange={e=>{
                      const items=[...newOrder.items]; items[i]={...it, name:e.target.value}; setNewOrder({...newOrder, items});
                    }}/>
                    <Input className="col-span-1" type="number" min="1" value={it.qty} onChange={e=>{
                      const items=[...newOrder.items]; items[i]={...it, qty:Number(e.target.value)}; setNewOrder({...newOrder, items});
                    }}/>
                    <Input className="col-span-2" type="number" step="0.01" placeholder="Price" value={it.price} onChange={e=>{
                      const items=[...newOrder.items]; items[i]={...it, price:Number(e.target.value)}; setNewOrder({...newOrder, items});
                    }}/>
                    <Button size="sm" variant="ghost" className="col-span-1"
                      onClick={()=>setNewOrder({...newOrder, items: newOrder.items.filter((_,j)=>j!==i)})}
                      disabled={newOrder.items.length===1}>
                      <XCircle className="w-4 h-4"/>
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 font-semibold text-sm">
                Total: ${newTotal.toFixed(2)}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={newOrder.notes} onChange={e=>setNewOrder({...newOrder, notes:e.target.value})}/>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newOrder.backorder} onChange={e=>setNewOrder({...newOrder, backorder:e.target.checked})}/>
              Mark as backorder
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setNewOpen(false)}>Cancel</Button>
            <Button onClick={createOrder} disabled={saving}>
              <Plus className="w-4 h-4 mr-1"/>{saving ? "Saving..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
