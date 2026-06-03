import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Plus, Gauge, Car, Wrench } from "lucide-react";
import { toast } from "sonner";

type TPMSRecord = {
  id:string; vehicle:string; customer:string; vin:string;
  fl:number; fr:number; rl:number; rr:number;
  recommended:number; sensorStatus:string; lastChecked:string;
};

const INIT_RECORDS: TPMSRecord[] = [
  { id:"1", vehicle:"2021 Toyota RAV4",   customer:"Mike Johnson",  vin:"1HGBH41JXMN109186", fl:32, fr:31, rl:33, rr:32, recommended:32, sensorStatus:"OK",      lastChecked:"2026-05-30" },
  { id:"2", vehicle:"2020 Honda Civic",   customer:"Sarah Williams",vin:"2HGBH41JXMN109187", fl:28, fr:35, rl:30, rr:29, recommended:32, sensorStatus:"Warning", lastChecked:"2026-05-29" },
  { id:"3", vehicle:"2023 Ford F-150",    customer:"Tom Brown",     vin:"3HGBH41JXMN109188", fl:35, fr:35, rl:35, rr:35, recommended:35, sensorStatus:"OK",      lastChecked:"2026-05-30" },
  { id:"4", vehicle:"2022 BMW 3 Series",  customer:"Lisa Davis",    vin:"4HGBH41JXMN109189", fl:36, fr:36, rl:36, rr:36, recommended:38, sensorStatus:"Low",     lastChecked:"2026-05-28" },
  { id:"5", vehicle:"2021 Chevy Equinox", customer:"James Wilson",  vin:"5HGBH41JXMN109190", fl:33, fr:33, rl:33, rr:33, recommended:33, sensorStatus:"OK",      lastChecked:"2026-05-30" },
];

const TPMS_SENSORS = [
  { id:"S001", brand:"Schrader", partNo:"20050", frequency:"315 MHz", compatible:"Toyota, Honda, Subaru",       price:29.99, stock:42 },
  { id:"S002", brand:"Schrader", partNo:"20052", frequency:"433 MHz", compatible:"BMW, Mercedes, Audi, VW",     price:34.99, stock:28 },
  { id:"S003", brand:"Dorman",   partNo:"974-000",frequency:"315 MHz",compatible:"Ford, GM, Chrysler, Dodge",   price:24.99, stock:65 },
  { id:"S004", brand:"Dorman",   partNo:"974-001",frequency:"433 MHz",compatible:"Volvo, Land Rover, Jaguar",   price:39.99, stock:15 },
  { id:"S005", brand:"VDO",      partNo:"S180014880Z",frequency:"433 MHz",compatible:"Universal Programmable",  price:44.99, stock:20 },
];

const getPressureStatus = (actual:number, recommended:number) => {
  const diff = actual - recommended;
  if (diff < -4) return { status:"Low",    color:"text-red-600",    bg:"bg-red-50"    };
  if (diff > 4)  return { status:"High",   color:"text-orange-600", bg:"bg-orange-50" };
  return           { status:"OK",     color:"text-green-600",  bg:"bg-green-50"  };
};

export function TPMSManagement() {
  const [records, setRecords] = useState<TPMSRecord[]>(INIT_RECORDS);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState({ vehicle:"", customer:"", vin:"", fl:"", fr:"", rl:"", rr:"", recommended:"32" });

  const save = () => {
    if (!form.vehicle || !form.customer) { toast.error("Vehicle and customer required"); return; }
    const rec: TPMSRecord = {
      id: Date.now().toString(), vehicle:form.vehicle, customer:form.customer, vin:form.vin,
      fl:Number(form.fl)||32, fr:Number(form.fr)||32, rl:Number(form.rl)||32, rr:Number(form.rr)||32,
      recommended:Number(form.recommended)||32, sensorStatus:"OK", lastChecked:new Date().toISOString().slice(0,10),
    };
    setRecords(r => [rec,...r]);
    toast.success("TPMS record added");
    setAddOpen(false); setForm({ vehicle:"", customer:"", vin:"", fl:"", fr:"", rl:"", rr:"", recommended:"32" });
  };

  const warnings = records.filter(r => r.sensorStatus !== "OK").length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">TPMS Management</h1>
          <p className="text-sm text-muted-foreground">Tire pressure monitoring — sensor tracking and pressure checks</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1"/>Add Vehicle Check</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Vehicles Checked", value:records.length, color:"text-blue-600" },
          { label:"All OK",           value:records.filter(r=>r.sensorStatus==="OK").length, color:"text-green-600" },
          { label:"Warnings",         value:warnings, color:"text-red-600" },
          { label:"Sensors in Stock", value:TPMS_SENSORS.reduce((s,x)=>s+x.stock,0), color:"text-purple-600" },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {warnings > 0 && (
        <Card className="p-4 border-red-300 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5"/>
            <span className="font-semibold">{warnings} vehicle(s) have TPMS warnings — action required</span>
          </div>
        </Card>
      )}

      {/* Pressure Records */}
      <Card>
        <div className="p-4 border-b"><h3 className="font-semibold">Tire Pressure Records</h3></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">FL (PSI)</TableHead>
                <TableHead className="text-center">FR (PSI)</TableHead>
                <TableHead className="text-center">RL (PSI)</TableHead>
                <TableHead className="text-center">RR (PSI)</TableHead>
                <TableHead className="text-center">Recommended</TableHead>
                <TableHead>Sensor Status</TableHead>
                <TableHead>Last Checked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => {
                const positions = [r.fl, r.fr, r.rl, r.rr];
                const anyIssue = positions.some(p => Math.abs(p - r.recommended) > 4);
                return (
                  <TableRow key={r.id} className={anyIssue?"bg-red-50":""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground"/>
                        <span className="font-medium text-sm">{r.vehicle}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.customer}</TableCell>
                    {[r.fl, r.fr, r.rl, r.rr].map((p, i) => {
                      const ps = getPressureStatus(p, r.recommended);
                      return (
                        <TableCell key={i} className={`text-center`}>
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-sm ${ps.bg} ${ps.color}`}>{p}</span>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold">{r.recommended}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.sensorStatus==="OK"?"bg-green-100 text-green-700":r.sensorStatus==="Warning"?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700"}`}>
                        {r.sensorStatus==="OK"?<CheckCircle2 className="w-3 h-3"/>:<AlertTriangle className="w-3 h-3"/>}
                        {r.sensorStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.lastChecked}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Sensor Inventory */}
      <Card>
        <div className="p-4 border-b"><h3 className="font-semibold flex items-center gap-2"><Gauge className="w-4 h-4"/>TPMS Sensor Inventory</h3></div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sensor ID</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Part #</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Compatible With</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TPMS_SENSORS.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.id}</TableCell>
                <TableCell className="font-medium">{s.brand}</TableCell>
                <TableCell className="font-mono text-xs">{s.partNo}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{s.frequency}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.compatible}</TableCell>
                <TableCell className="text-right font-semibold">${s.price}</TableCell>
                <TableCell className="text-right">
                  <span className={s.stock < 20 ? "text-red-600 font-bold" : "font-medium"}>{s.stock}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Gauge className="w-5 h-5"/>Add TPMS Check</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <Input placeholder="e.g. 2021 Toyota RAV4" value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input placeholder="Customer name" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <Label>VIN (optional)</Label>
              <Input placeholder="17-character VIN" value={form.vin} onChange={e=>setForm({...form,vin:e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <Label>Recommended PSI</Label>
              <Input type="number" value={form.recommended} onChange={e=>setForm({...form,recommended:e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Front Left (PSI)</Label><Input type="number" value={form.fl} onChange={e=>setForm({...form,fl:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Front Right (PSI)</Label><Input type="number" value={form.fr} onChange={e=>setForm({...form,fr:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Rear Left (PSI)</Label><Input type="number" value={form.rl} onChange={e=>setForm({...form,rl:e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Rear Right (PSI)</Label><Input type="number" value={form.rr} onChange={e=>setForm({...form,rr:e.target.value})}/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setAddOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
