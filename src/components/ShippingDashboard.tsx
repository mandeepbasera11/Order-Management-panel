import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Package, AlertTriangle, CheckCircle2, Clock, Search, Download, Calculator } from "lucide-react";
import { toast } from "sonner";

const SHIPMENTS = [
  {id:"SH001",order:"ORD-2026-0005",customer:"James Wilson",carrier:"FedEx",tracking:"7489234790234",status:"In Transit",origin:"Hickory, NC",dest:"Austin, TX",eta:"Jun 2, 2026",weight:"48 lbs",cost:28.50,exception:false},
  {id:"SH002",order:"ORD-2026-0006",customer:"Amy Chen",carrier:"UPS",tracking:"1Z999AA10123456784",status:"Delivered",origin:"Hickory, NC",dest:"Seattle, WA",eta:"May 29, 2026",weight:"52 lbs",cost:34.20,exception:false},
  {id:"SH003",order:"ORD-2026-0003",customer:"Tom Brown",carrier:"FedEx",tracking:"7489234790235",status:"Exception",origin:"Hickory, NC",dest:"Miami, FL",eta:"Jun 3, 2026",weight:"56 lbs",cost:41.00,exception:true},
  {id:"SH004",order:"ORD-2026-0002",customer:"Sarah Williams",carrier:"UPS",tracking:"1Z999AA10123456785",status:"Processing",origin:"Hickory, NC",dest:"Chicago, IL",eta:"Jun 4, 2026",weight:"44 lbs",cost:29.80,exception:false},
  {id:"SH005",order:"ORD-2026-0004",customer:"Lisa Davis",carrier:"DHL",tracking:"DHL1234567890",status:"Out for Delivery",origin:"Hickory, NC",dest:"New York, NY",eta:"Jun 1, 2026",weight:"60 lbs",cost:52.10,exception:false},
  {id:"SH006",order:"ORD-2026-0001",customer:"Mike Johnson",carrier:"USPS",tracking:"9400111899223764564",status:"Label Created",origin:"Hickory, NC",dest:"Denver, CO",eta:"Jun 5, 2026",weight:"48 lbs",cost:22.40,exception:false},
];

const STATUS_COLORS: Record<string,string> = {
  "Delivered":       "bg-green-100 text-green-700",
  "In Transit":      "bg-blue-100 text-blue-700",
  "Out for Delivery":"bg-indigo-100 text-indigo-700",
  "Processing":      "bg-yellow-100 text-yellow-700",
  "Label Created":   "bg-gray-100 text-gray-700",
  "Exception":       "bg-red-100 text-red-700",
};

const CARRIER_COLORS: Record<string,string> = {
  FedEx:"text-purple-700", UPS:"text-yellow-700", DHL:"text-yellow-600", USPS:"text-blue-700",
};

const FREIGHT_ZONES = [
  {zone:"Zone 1 (0–150 mi)",  ltl:"$1.82/lb", min:"$180", transit:"1–2 days"},
  {zone:"Zone 2 (151–300 mi)",ltl:"$2.14/lb", min:"$210", transit:"2–3 days"},
  {zone:"Zone 3 (301–600 mi)",ltl:"$2.56/lb", min:"$255", transit:"3–4 days"},
  {zone:"Zone 4 (601–1000 mi)",ltl:"$3.12/lb",min:"$310", transit:"4–5 days"},
  {zone:"Zone 5 (1000+ mi)",  ltl:"$3.78/lb", min:"$380", transit:"5–7 days"},
];

export function ShippingDashboard() {
  const [search, setSearch]     = useState("");
  const [carrier, setCarrier]   = useState("all");
  const [weight, setWeight]     = useState("");
  const [zone, setZone]         = useState("");
  const [freightResult, setFreightResult] = useState<{ltl:string;min:string;transit:string}|null>(null);

  const filtered = SHIPMENTS.filter(s => {
    const q = search.toLowerCase();
    const ms = !q || s.order.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q) || s.tracking.toLowerCase().includes(q);
    const mc = carrier === "all" || s.carrier === carrier;
    return ms && mc;
  });

  const calcFreight = () => {
    if (!weight || !zone) { toast.error("Enter weight and select zone"); return; }
    const zoneData = FREIGHT_ZONES.find(z => z.zone === zone);
    if (!zoneData) return;
    const w = parseFloat(weight);
    const ratePerLb = parseFloat(zoneData.ltl.replace("$","").replace("/lb",""));
    const minCharge = parseFloat(zoneData.min.replace("$",""));
    const calc = Math.max(w * ratePerLb, minCharge);
    setFreightResult({ ltl: `$${calc.toFixed(2)}`, min: zoneData.min, transit: zoneData.transit });
    toast.success("Freight cost calculated");
  };

  const exceptions = SHIPMENTS.filter(s => s.exception);
  const delivered  = SHIPMENTS.filter(s => s.status === "Delivered").length;
  const inTransit  = SHIPMENTS.filter(s => s.status === "In Transit" || s.status === "Out for Delivery").length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Shipping & Logistics</h1>
          <p className="text-sm text-muted-foreground">Live tracking, freight management and carrier integrations</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success("Labels generated")}><Download className="w-4 h-4 mr-1"/>Print All Labels</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:"Total Shipments", value:SHIPMENTS.length, color:"text-blue-600"},
          {label:"In Transit",      value:inTransit,         color:"text-indigo-600"},
          {label:"Delivered",       value:delivered,          color:"text-green-600"},
          {label:"Exceptions",      value:exceptions.length,  color:"text-red-600"},
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Exception alert */}
      {exceptions.length > 0 && (
        <Card className="p-4 border-red-300 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5"/>
            <span className="font-semibold">{exceptions.length} shipment exception(s) need attention</span>
          </div>
          {exceptions.map(e => (
            <div key={e.id} className="mt-2 text-sm text-red-600 ml-7">
              • {e.order} — {e.customer} — Tracking: {e.tracking}
            </div>
          ))}
        </Card>
      )}

      <Tabs defaultValue="tracking">
        <TabsList>
          <TabsTrigger value="tracking">Shipment Tracking</TabsTrigger>
          <TabsTrigger value="freight">Freight Calculator</TabsTrigger>
          <TabsTrigger value="rates">Carrier Rates</TabsTrigger>
        </TabsList>

        {/* Tracking */}
        <TabsContent value="tracking" className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input className="pl-9" placeholder="Search order, tracking, customer..." value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Carriers"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  {["FedEx","UPS","DHL","USPS"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id} className={s.exception ? "bg-red-50" : ""}>
                      <TableCell className="font-mono text-xs font-bold">{s.order}</TableCell>
                      <TableCell className="text-sm">{s.customer}</TableCell>
                      <TableCell>
                        <span className={`font-bold text-sm ${CARRIER_COLORS[s.carrier]}`}>{s.carrier}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.tracking}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                          {s.status === "Exception" && <AlertTriangle className="w-3 h-3"/>}
                          {s.status === "Delivered" && <CheckCircle2 className="w-3 h-3"/>}
                          {s.status === "In Transit" && <Truck className="w-3 h-3"/>}
                          {s.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.dest}</TableCell>
                      <TableCell className="text-sm">{s.eta}</TableCell>
                      <TableCell className="font-semibold">${s.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Freight Calculator */}
        <TabsContent value="freight" className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Calculator className="w-5 h-5"/>LTL Freight Cost Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shipment Weight (lbs)</label>
                <Input type="number" placeholder="e.g. 200" value={weight} onChange={e => setWeight(e.target.value)}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shipping Zone</label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger><SelectValue placeholder="Select Zone"/></SelectTrigger>
                  <SelectContent>{FREIGHT_ZONES.map(z => <SelectItem key={z.zone} value={z.zone}>{z.zone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={calcFreight}><Calculator className="w-4 h-4 mr-1"/>Calculate Freight Cost</Button>
            {freightResult && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
                <p className="font-bold text-green-700 text-lg">Estimated Cost: {freightResult.ltl}</p>
                <p className="text-sm text-green-600">Transit Time: {freightResult.transit}</p>
                <p className="text-xs text-muted-foreground">Minimum charge: {freightResult.min}</p>
              </div>
            )}
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">LTL Rate Chart</h3>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>LTL Rate</TableHead>
                <TableHead>Min Charge</TableHead>
                <TableHead>Transit Time</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {FREIGHT_ZONES.map(z => (
                  <TableRow key={z.zone}>
                    <TableCell className="font-medium">{z.zone}</TableCell>
                    <TableCell className="font-semibold text-blue-600">{z.ltl}</TableCell>
                    <TableCell>{z.min}</TableCell>
                    <TableCell><Badge variant="outline">{z.transit}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Carrier Rates */}
        <TabsContent value="rates">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Carrier Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {carrier:"FedEx", status:"Connected", color:"text-purple-700", note:"Ground & Express available"},
                {carrier:"UPS",   status:"Connected", color:"text-yellow-700", note:"Ground & 2-Day available"},
                {carrier:"USPS",  status:"Connected", color:"text-blue-700",   note:"Priority Mail available"},
                {carrier:"DHL",   status:"Connected", color:"text-red-600",    note:"International only"},
              ].map(c => (
                <div key={c.carrier} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className={`font-bold text-lg ${c.color}`}>{c.carrier}</p>
                    <p className="text-sm text-muted-foreground">{c.note}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500"/>
                    <Badge className="bg-green-100 text-green-700">{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
