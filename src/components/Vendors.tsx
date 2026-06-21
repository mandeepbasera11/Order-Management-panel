import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Pencil, Trash2, Phone, Mail, Globe, Star, Package } from "lucide-react";
import { toast } from "sonner";

type Vendor = {
  id:string; name:string; contact:string; email:string; phone:string; website:string;
  location:string; categories:string[]; leadTime:string; minOrder:number;
  paymentTerms:string; rating:number; totalOrders:number; totalVolume:number; status:"Active"|"Inactive";
};

const INIT_VENDORS: Vendor[] = [
  { id:"1", name:"National Tire Supply",  contact:"John Barnes",   email:"john@nts.com",    phone:"(800)111-2222", website:"nts.com",         location:"Charlotte, NC", categories:["MM","LT","HP"],    leadTime:"1-2 days", minOrder:10,  paymentTerms:"Net 30", rating:4.8, totalOrders:201, totalVolume:67800,  status:"Active" },
  { id:"2", name:"Cleve Tire Wholesale",  contact:"Mike Cleve",    email:"mike@cleve.com",  phone:"(800)222-3333", website:"clevetire.com",    location:"Cleveland, OH", categories:["MM","UHP","AT"],   leadTime:"2-3 days", minOrder:4,   paymentTerms:"Net 15", rating:4.6, totalOrders:142, totalVolume:48200,  status:"Active" },
  { id:"3", name:"Vans Tire Pros",        contact:"Van Smith",     email:"van@vanstire.com",phone:"(800)333-4444", website:"vanstire.com",     location:"Atlanta, GA",   categories:["HP","UHP"],        leadTime:"3-4 days", minOrder:8,   paymentTerms:"Net 30", rating:4.2, totalOrders:98,  totalVolume:31500,  status:"Active" },
  { id:"4", name:"Wholesale Tires Co",    contact:"Lisa Chang",    email:"lisa@wtco.com",   phone:"(800)444-5555", website:"wholesaletires.com",location:"Dallas, TX",    categories:["MM","LT","OTR"],  leadTime:"4-5 days", minOrder:20,  paymentTerms:"Net 45", rating:3.8, totalOrders:76,  totalVolume:24100,  status:"Active" },
  { id:"5", name:"Southeast Tire Depot",  contact:"Bob Harris",    email:"bob@setd.com",    phone:"(800)555-6666", website:"setd.com",         location:"Birmingham, AL",categories:["MC","HPLT"],      leadTime:"2-3 days", minOrder:6,   paymentTerms:"Net 30", rating:4.4, totalOrders:55,  totalVolume:18400,  status:"Inactive"},
];

const emptyForm = { name:"", contact:"", email:"", phone:"", website:"", location:"", categories:"", leadTime:"", minOrder:"", paymentTerms:"Net 30" };

export function Vendors() {
  const [vendors, setVendors]   = useState<Vendor[]>(INIT_VENDORS);
  const [search, setSearch]     = useState("");
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Vendor|null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [selected, setSelected] = useState<Vendor|null>(null);

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q);
  });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({ name:v.name, contact:v.contact, email:v.email, phone:v.phone, website:v.website,
              location:v.location, categories:v.categories.join(", "), leadTime:v.leadTime,
              minOrder:String(v.minOrder), paymentTerms:v.paymentTerms });
    setOpen(true);
  };

  const save = () => {
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }
    if (editing) {
      setVendors(v => v.map(x => x.id===editing.id ? { ...x,...form,categories:form.categories.split(",").map(c=>c.trim()),minOrder:Number(form.minOrder)||0 } : x));
      toast.success("Vendor updated");
    } else {
      const vendor: Vendor = {
        id:Date.now().toString(),...form as any,
        categories:form.categories.split(",").map(c=>c.trim()),
        minOrder:Number(form.minOrder)||0,
        rating:4.0, totalOrders:0, totalVolume:0, status:"Active",
      };
      setVendors(v => [vendor,...v]);
      toast.success("Vendor added");
    }
    setOpen(false);
  };

  const deleteVendor = (id: string) => {
    setVendors(v => v.filter(x => x.id!==id));
    toast.success("Vendor removed");
  };

  const activeVendors = vendors.filter(v => v.status==="Active").length;
  const totalVolume   = vendors.reduce((s,v) => s+v.totalVolume, 0);
  const avgRating     = (vendors.reduce((s,v) => s+v.rating, 0)/vendors.length).toFixed(1);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
  <p className="text-muted-foreground mt-1">Manage supplier relationships and purchase contacts</p>
</div>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1"/>Add Vendor</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Active Vendors",  value:activeVendors,               color:"text-green-600" },
          { label:"Total Vendors",   value:vendors.length,              color:"text-blue-600"  },
          { label:"Total Volume",    value:`$${(totalVolume/1000).toFixed(0)}K`, color:"text-purple-600"},
          { label:"Avg Rating",      value:`${avgRating}★`,             color:"text-yellow-600"},
        ].map(s=>(
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input className="pl-9" placeholder="Search vendors..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </Card>

      {/* Vendor Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(v=>(
              <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30" onClick={()=>setSelected(v)}>
                <TableCell>
                  <p className="font-semibold text-sm">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.contact}</p>
                </TableCell>
                <TableCell className="text-sm">{v.location}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {v.categories.slice(0,3).map(c=><Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{v.leadTime}</TableCell>
                <TableCell className="text-sm">{v.minOrder} units</TableCell>
                <TableCell className="text-sm">{v.paymentTerms}</TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500"/>
                    <span className="font-bold text-sm">{v.rating}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={v.status==="Active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-600"}>{v.status}</Badge>
                </TableCell>
                <TableCell onClick={e=>e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={()=>openEdit(v)}><Pencil className="w-3.5 h-3.5"/></Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={()=>deleteVendor(v.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Vendor Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={o=>!o&&setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5"/>{selected.name}
                  <Badge className={selected.status==="Active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-600"}>{selected.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/>{selected.email}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/>{selected.phone}</div>
                <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground"/>{selected.website}</div>
                <div><span className="text-muted-foreground">Contact: </span>{selected.contact}</div>
                <div><span className="text-muted-foreground">Lead Time: </span><strong>{selected.leadTime}</strong></div>
                <div><span className="text-muted-foreground">Min Order: </span><strong>{selected.minOrder} units</strong></div>
                <div><span className="text-muted-foreground">Payment: </span><strong>{selected.paymentTerms}</strong></div>
                <div><span className="text-muted-foreground">Rating: </span><strong className="text-yellow-600">{selected.rating}★</strong></div>
                <div><span className="text-muted-foreground">Total Orders: </span><strong>{selected.totalOrders}</strong></div>
                <div><span className="text-muted-foreground">Total Volume: </span><strong>${selected.totalVolume.toLocaleString()}</strong></div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {selected.categories.map(c=><Badge key={c} variant="outline">{c}</Badge>)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?"Edit Vendor":"Add Vendor"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Vendor Name *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Contact Name</Label><Input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></div>
              <div className="space-y-1.5 col-span-2"><Label>Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="City, State"/></div>
              <div className="space-y-1.5 col-span-2"><Label>Categories (comma separated)</Label><Input value={form.categories} onChange={e=>setForm({...form,categories:e.target.value})} placeholder="MM, LT, HP"/></div>
              <div className="space-y-1.5"><Label>Lead Time</Label><Input value={form.leadTime} onChange={e=>setForm({...form,leadTime:e.target.value})} placeholder="2-3 days"/></div>
              <div className="space-y-1.5"><Label>Min Order (units)</Label><Input type="number" value={form.minOrder} onChange={e=>setForm({...form,minOrder:e.target.value})}/></div>
              <div className="space-y-1.5 col-span-2"><Label>Payment Terms</Label><Input value={form.paymentTerms} onChange={e=>setForm({...form,paymentTerms:e.target.value})} placeholder="Net 30"/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing?"Update":"Add Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
