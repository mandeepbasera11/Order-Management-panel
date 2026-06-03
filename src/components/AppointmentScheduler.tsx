import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Plus, User, Car, CheckCircle2, XCircle, Pencil, Wrench } from "lucide-react";
import { toast } from "sonner";

type ApptStatus = "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
type Appt = {
  id:string; customer:string; phone:string; email:string;
  vehicle:string; service:string; tires:string;
  date:string; time:string; bay:string; tech:string;
  status:ApptStatus; notes:string; duration:number;
};

const STATUS_COLORS: Record<ApptStatus,string> = {
  Scheduled:   "bg-blue-100 text-blue-700",
  Confirmed:   "bg-green-100 text-green-700",
  "In Progress":"bg-yellow-100 text-yellow-700",
  Completed:   "bg-gray-100 text-gray-600",
  Cancelled:   "bg-red-100 text-red-700",
};

const TIMES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
const BAYS   = ["Bay 1","Bay 2","Bay 3","Bay 4"];
const TECHS  = ["Mike T.","Carlos R.","Jamal W.","Steve K."];
const SERVICES = ["Tire Installation (4 tires)","Tire Installation (2 tires)","Tire Rotation","Tire Balancing","Flat Repair","TPMS Service","Full Tire Service Package"];

const INIT_APPTS: Appt[] = [
  { id:"1", customer:"Mike Johnson",  phone:"(555)111-2222", email:"mike@example.com",  vehicle:"2021 Toyota RAV4",   service:"Tire Installation (4 tires)", tires:"Michelin Defender 225/65R17", date:"2026-06-01", time:"09:00", bay:"Bay 1", tech:"Mike T.",   status:"Confirmed",    notes:"",            duration:90  },
  { id:"2", customer:"Sarah Williams",phone:"(555)222-3333", email:"sarah@example.com", vehicle:"2020 Honda Civic",   service:"Tire Rotation",              tires:"Current tires",              date:"2026-06-01", time:"10:30", bay:"Bay 2", tech:"Carlos R.", status:"Scheduled",    notes:"Quick job",   duration:30  },
  { id:"3", customer:"Tom Brown",     phone:"(555)333-4444", email:"tom@example.com",   vehicle:"2023 Ford F-150",    service:"Tire Installation (4 tires)", tires:"BFGoodrich KO2 265/70R17",   date:"2026-06-01", time:"13:00", bay:"Bay 1", tech:"Jamal W.",  status:"In Progress",  notes:"Fleet order", duration:90  },
  { id:"4", customer:"Lisa Davis",    phone:"(555)444-5555", email:"lisa@example.com",  vehicle:"2022 BMW 3 Series",  service:"Tire Balancing",             tires:"Pirelli P Zero 255/40R19",   date:"2026-06-02", time:"09:30", bay:"Bay 3", tech:"Steve K.",  status:"Scheduled",    notes:"",            duration:45  },
  { id:"5", customer:"James Wilson",  phone:"(555)555-6666", email:"james@example.com", vehicle:"2021 Chevy Equinox", service:"Tire Installation (4 tires)", tires:"Continental 235/55R18",     date:"2026-06-02", time:"11:00", bay:"Bay 2", tech:"Mike T.",   status:"Confirmed",    notes:"",            duration:90  },
  { id:"6", customer:"Amy Chen",      phone:"(555)666-7777", email:"amy@example.com",   vehicle:"2023 Tesla Model Y", service:"TPMS Service",               tires:"Current tires",              date:"2026-06-03", time:"14:00", bay:"Bay 4", tech:"Carlos R.", status:"Scheduled",    notes:"EV vehicle",  duration:60  },
];

const emptyForm = { customer:"", phone:"", email:"", vehicle:"", service:"", tires:"", date:"", time:"09:00", bay:"Bay 1", tech:"Mike T.", notes:"", duration:90 };

export function AppointmentScheduler() {
  const [appts, setAppts] = useState<Appt[]>(INIT_APPTS);
  const [open, setOpen]   = useState(false);
  const [editAppt, setEditAppt] = useState<Appt|null>(null);
  const [form, setForm]   = useState(emptyForm);
  const [dateFilter, setDateFilter] = useState("2026-06-01");
  const [statusFilter, setStatusFilter] = useState("all");

  const todayAppts  = appts.filter(a => a.date === dateFilter);
  const filtered    = todayAppts.filter(a => statusFilter==="all" || a.status===statusFilter);
  const scheduled   = appts.filter(a => a.status==="Scheduled"||a.status==="Confirmed").length;
  const inProgress  = appts.filter(a => a.status==="In Progress").length;
  const completed   = appts.filter(a => a.status==="Completed").length;

  const save = () => {
    if (!form.customer || !form.date || !form.time) { toast.error("Fill required fields"); return; }
    if (editAppt) {
      setAppts(a => a.map(x => x.id===editAppt.id ? {...editAppt,...form,id:editAppt.id,status:editAppt.status} : x));
      toast.success("Appointment updated");
    } else {
      const appt: Appt = { id:Date.now().toString(), ...form, status:"Scheduled" };
      setAppts(a => [...a, appt]);
      toast.success(`Appointment booked for ${form.customer}`);
    }
    setOpen(false); setEditAppt(null); setForm(emptyForm);
  };

  const updateStatus = (id:string, status:ApptStatus) => {
    setAppts(a => a.map(x => x.id===id ? {...x,status} : x));
    toast.success(`Status updated to ${status}`);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tire Installation Appointments</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage tire installation appointments</p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setEditAppt(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1"/>Book Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total Booked",  value:appts.length, color:"text-blue-600" },
          { label:"Upcoming",      value:scheduled,     color:"text-green-600" },
          { label:"In Progress",   value:inProgress,    color:"text-yellow-600" },
          { label:"Completed",     value:completed,     color:"text-gray-600" },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Appointment List</TabsTrigger>
          <TabsTrigger value="calendar">Bay Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="w-44"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(["Scheduled","Confirmed","In Progress","Completed","Cancelled"] as ApptStatus[]).map(s=>
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Bay</TableHead>
                    <TableHead>Tech</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length===0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No appointments for this date</TableCell></TableRow>
                  ) : filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{a.customer}</p>
                        <p className="text-xs text-muted-foreground">{a.phone}</p>
                      </TableCell>
                      <TableCell className="text-sm">{a.vehicle}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{a.service}</p>
                        <p className="text-xs text-muted-foreground">{a.tires}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm"><Clock className="w-3.5 h-3.5 text-muted-foreground"/>{a.time}</div>
                        <div className="text-xs text-muted-foreground">{a.duration} min</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{a.bay}</Badge></TableCell>
                      <TableCell className="text-sm">{a.tech}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {a.status==="Scheduled"  && <Button size="sm" variant="outline" className="text-xs h-7" onClick={()=>updateStatus(a.id,"Confirmed")}>Confirm</Button>}
                          {a.status==="Confirmed"  && <Button size="sm" className="text-xs h-7" onClick={()=>updateStatus(a.id,"In Progress")}>Start</Button>}
                          {a.status==="In Progress"&& <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={()=>updateStatus(a.id,"Completed")}>Complete</Button>}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>{setEditAppt(a);setForm({customer:a.customer,phone:a.phone,email:a.email,vehicle:a.vehicle,service:a.service,tires:a.tires,date:a.date,time:a.time,bay:a.bay,tech:a.tech,notes:a.notes,duration:a.duration});setOpen(true);}}>
                            <Pencil className="w-3.5 h-3.5"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Bay Schedule View */}
        <TabsContent value="calendar">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Bay Schedule — {dateFilter}</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-2 min-w-[700px]">
                {/* Header */}
                <div className="text-xs font-semibold text-muted-foreground p-2">Time</div>
                {BAYS.map(b => (
                  <div key={b} className="text-xs font-semibold text-center p-2 bg-muted rounded">{b}</div>
                ))}
                {/* Time slots */}
                {TIMES.map(time => (
                  <>
                    <div key={`t-${time}`} className="text-xs text-muted-foreground p-2 font-mono">{time}</div>
                    {BAYS.map(bay => {
                      const appt = appts.find(a => a.date===dateFilter && a.time===time && a.bay===bay);
                      return (
                        <div key={`${bay}-${time}`} className={`p-1.5 rounded text-xs min-h-[40px] border ${appt ? STATUS_COLORS[appt.status]+' border-current' : 'border-border bg-muted/20'}`}>
                          {appt && (
                            <div>
                              <p className="font-semibold truncate">{appt.customer.split(" ")[0]}</p>
                              <p className="truncate opacity-75">{appt.service.split(" ")[0]}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Book / Edit Dialog */}
      <Dialog open={open} onOpenChange={o=>!o&&setOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar className="w-5 h-5"/>{editAppt?"Edit Appointment":"Book Appointment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Customer Name *</Label>
                <Input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} placeholder="Full name"/>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(555) 000-0000"/>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com"/>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Vehicle</Label>
                <Input value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})} placeholder="e.g. 2021 Toyota RAV4"/>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Service</Label>
                <Select value={form.service} onValueChange={v=>setForm({...form,service:v})}>
                  <SelectTrigger><SelectValue placeholder="Select service"/></SelectTrigger>
                  <SelectContent>{SERVICES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Tires (if purchasing)</Label>
                <Input value={form.tires} onChange={e=>setForm({...form,tires:e.target.value})} placeholder="e.g. Michelin Defender 225/65R17"/>
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <Label>Time *</Label>
                <Select value={form.time} onValueChange={v=>setForm({...form,time:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{TIMES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bay</Label>
                <Select value={form.bay} onValueChange={v=>setForm({...form,bay:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{BAYS.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Technician</Label>
                <Select value={form.tech} onValueChange={v=>setForm({...form,tech:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{TECHS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any special notes..."/>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>{setOpen(false);setEditAppt(null);}}>Cancel</Button>
            <Button onClick={save}>{editAppt?"Save Changes":"Book Appointment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
