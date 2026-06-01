import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Phone, Mail, Car, ShoppingCart, FileText, Star, Plus } from "lucide-react";
import { toast } from "sonner";

type Customer = {
  id:string; name:string; email:string; phone:string; since:string;
  totalOrders:number; totalSpent:number; creditLimit:number; preferredBrand:string;
  vehicles:{year:number;make:string;model:string;trim:string}[];
  notes:string; tier:"Gold"|"Silver"|"Bronze"|"New";
  orders:{orderNo:string;date:string;total:number;status:string;items:string}[];
};

const CUSTOMERS: Customer[] = [
  {id:"1",name:"Mike Johnson",    email:"mike@example.com",   phone:"(555)111-2222",since:"2022-03-15",totalOrders:12,totalSpent:4820,creditLimit:5000,preferredBrand:"Michelin",  tier:"Gold",  vehicles:[{year:2021,make:"Toyota",model:"RAV4",trim:"XLE"}],      notes:"Prefers premium brands. Rush orders OK.",orders:[{orderNo:"ORD-2026-0001",date:"2026-05-30",total:580,status:"New Order",items:"Michelin Defender 225/65R17 x4"}]},
  {id:"2",name:"Sarah Williams",  email:"sarah@example.com",  phone:"(555)222-3333",since:"2023-01-08",totalOrders:6, totalSpent:2340,creditLimit:3000,preferredBrand:"Goodyear",  tier:"Silver",vehicles:[{year:2020,make:"Honda",model:"Civic",trim:"Sport"}],    notes:"Monthly subscription customer.",orders:[{orderNo:"ORD-2026-0002",date:"2026-05-29",total:480,status:"Processing",items:"Goodyear Assurance 205/55R16 x4"}]},
  {id:"3",name:"Tom Brown",       email:"tom@example.com",    phone:"(555)333-4444",since:"2021-11-22",totalOrders:18,totalSpent:8960,creditLimit:10000,preferredBrand:"BFGoodrich",tier:"Gold",  vehicles:[{year:2023,make:"Ford",model:"F-150",trim:"Lariat"},{year:2019,make:"Jeep",model:"Wrangler",trim:"Rubicon"}],notes:"Fleet customer — 2 trucks.",orders:[{orderNo:"ORD-2026-0003",date:"2026-05-28",total:840,status:"Picking",items:"BFGoodrich KO2 265/70R17 x4"}]},
  {id:"4",name:"Lisa Davis",      email:"lisa@example.com",   phone:"(555)444-5555",since:"2024-02-10",totalOrders:3, totalSpent:1680,creditLimit:2000,preferredBrand:"Pirelli",   tier:"Bronze",vehicles:[{year:2022,make:"BMW",model:"3 Series",trim:"330i"}],    notes:"European car enthusiast. Prefers performance tires.",orders:[{orderNo:"ORD-2026-0004",date:"2026-05-27",total:1120,status:"Packed",items:"Pirelli P Zero 255/40R19 x4"}]},
  {id:"5",name:"James Wilson",    email:"james@example.com",  phone:"(555)555-6666",since:"2022-08-30",totalOrders:9, totalSpent:3210,creditLimit:4000,preferredBrand:"Continental",tier:"Silver",vehicles:[{year:2021,make:"Chevrolet",model:"Equinox",trim:"LT"}],  notes:"Good payer. Pays on receipt.",orders:[{orderNo:"ORD-2026-0005",date:"2026-05-26",total:660,status:"Shipped",items:"Continental CrossContact 235/55R18 x4"}]},
];

const TIER_COLORS = { Gold:"bg-yellow-100 text-yellow-700", Silver:"bg-gray-100 text-gray-600", Bronze:"bg-orange-100 text-orange-700", New:"bg-blue-100 text-blue-700" };

export function CustomerCRM() {
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Customer|null>(null);
  const [newNote, setNewNote]      = useState("");
  const [notes, setNotes]         = useState<Record<string,string[]>>({});

  const filtered = useMemo(() => CUSTOMERS.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  }), [search]);

  const addNote = (customerId: string) => {
    if (!newNote.trim()) return;
    setNotes(n => ({ ...n, [customerId]: [...(n[customerId]||[]), newNote] }));
    setNewNote(""); toast.success("Note added");
  };

  const totalRevenue = CUSTOMERS.reduce((s,c) => s + c.totalSpent, 0);
  const goldCustomers = CUSTOMERS.filter(c => c.tier === "Gold").length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Customer Management (CRM)</h1>
          <p className="text-sm text-muted-foreground">Customer profiles, purchase history and vehicle details</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1"/>Add Customer</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:"Total Customers", value:CUSTOMERS.length,         color:"text-blue-600"},
          {label:"Gold Tier",       value:goldCustomers,             color:"text-yellow-600"},
          {label:"Total Revenue",   value:`$${totalRevenue.toLocaleString()}`, color:"text-green-600"},
          {label:"Avg Order Value", value:`$${Math.round(totalRevenue/CUSTOMERS.reduce((s,c)=>s+c.totalOrders,0))}`, color:"text-purple-600"},
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input className="pl-9" placeholder="Search by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </Card>

      {/* Customer List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Preferred Brand</TableHead>
              <TableHead>Since</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {c.name.split(" ").map(w=>w[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[c.tier]}`}>
                    <Star className="w-3 h-3"/>{c.tier}
                  </span>
                </TableCell>
                <TableCell className="font-semibold">{c.totalOrders}</TableCell>
                <TableCell className="font-semibold text-green-700">${c.totalSpent.toLocaleString()}</TableCell>
                <TableCell>${c.creditLimit.toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{c.preferredBrand}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.since}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setSelected(c)}>View Profile</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Customer Profile Dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {selected && (
            <>
              <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {selected.name.split(" ").map(w=>w[0]).join("")}
                  </div>
                  <div>
                    <DialogTitle>{selected.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[selected.tier]}`}>
                        <Star className="w-3 h-3"/>{selected.tier} Customer
                      </span>
                      <span className="text-xs text-muted-foreground">Since {selected.since}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-4 space-y-6">
                <Tabs defaultValue="profile">
                  <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/><span>{selected.email}</span></div>
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/><span>{selected.phone}</span></div>
                        <div className="flex items-center gap-2"><Star className="w-4 h-4 text-muted-foreground"/><span>Preferred: {selected.preferredBrand}</span></div>
                      </div>
                      <div className="space-y-3">
                        <div><p className="text-muted-foreground">Total Orders</p><p className="font-bold text-lg">{selected.totalOrders}</p></div>
                        <div><p className="text-muted-foreground">Total Spent</p><p className="font-bold text-lg text-green-600">${selected.totalSpent.toLocaleString()}</p></div>
                        <div><p className="text-muted-foreground">Credit Limit</p><p className="font-bold">${selected.creditLimit.toLocaleString()}</p></div>
                      </div>
                    </div>
                    {selected.notes && (
                      <div className="bg-muted/40 rounded p-3 text-sm">
                        <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Internal Notes</p>
                        <p>{selected.notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="orders">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Order #</TableHead><TableHead>Date</TableHead>
                        <TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {selected.orders.map(o => (
                          <TableRow key={o.orderNo}>
                            <TableCell className="font-mono text-xs">{o.orderNo}</TableCell>
                            <TableCell className="text-sm">{o.date}</TableCell>
                            <TableCell className="text-sm">{o.items}</TableCell>
                            <TableCell className="font-semibold">${o.total}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{o.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="vehicles" className="space-y-2">
                    {selected.vehicles.map((v,i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <Car className="w-5 h-5 text-muted-foreground"/>
                        <span className="font-medium">{v.year} {v.make} {v.model}</span>
                        <Badge variant="outline">{v.trim}</Badge>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Add an internal note..." value={newNote} onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => e.key==="Enter"&&addNote(selected.id)}/>
                      <Button onClick={() => addNote(selected.id)}><Plus className="w-4 h-4"/></Button>
                    </div>
                    <div className="space-y-2">
                      {[selected.notes,...(notes[selected.id]||[])].filter(Boolean).map((n,i) => (
                        <div key={i} className="bg-muted/40 rounded p-3 text-sm border-l-2 border-primary/30">{n}</div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
