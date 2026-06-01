import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Shield, Pencil, Trash2, DollarSign, Package, User, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type LogAction = "edit_price"|"edit_inventory"|"delete_product"|"cancel_order"|"login"|"permission_change"|"import"|"export";
type Log = { id:string; user:string; avatar:string; action:LogAction; module:string; target:string; detail:string; ip:string; time:string; };

const ACTION_COLORS: Record<LogAction,string> = {
  edit_price:       "bg-yellow-100 text-yellow-700",
  edit_inventory:   "bg-blue-100 text-blue-700",
  delete_product:   "bg-red-100 text-red-700",
  cancel_order:     "bg-red-100 text-red-700",
  login:            "bg-green-100 text-green-700",
  permission_change:"bg-purple-100 text-purple-700",
  import:           "bg-indigo-100 text-indigo-700",
  export:           "bg-gray-100 text-gray-700",
};
const ACTION_ICONS: Record<LogAction,React.ReactNode> = {
  edit_price:       <DollarSign className="w-3 h-3"/>,
  edit_inventory:   <Package className="w-3 h-3"/>,
  delete_product:   <Trash2 className="w-3 h-3"/>,
  cancel_order:     <XCircle className="w-3 h-3"/>,
  login:            <User className="w-3 h-3"/>,
  permission_change:<Shield className="w-3 h-3"/>,
  import:           <RefreshCw className="w-3 h-3"/>,
  export:           <Download className="w-3 h-3"/>,
};

const LOGS: Log[] = [
  {id:"1", user:"Sarah Chen",   avatar:"SC",action:"edit_price",       module:"Manage Tires",    target:"GE-Michelin-123", detail:"Price changed from $130 to $145",                    ip:"192.168.1.1",  time:"2026-05-30 09:14:22"},
  {id:"2", user:"James Dowell", avatar:"JD",action:"edit_inventory",   module:"Manage Tires",    target:"GE-Goodyear-456", detail:"Stock updated from 48 to 52",                        ip:"192.168.1.2",  time:"2026-05-30 08:55:11"},
  {id:"3", user:"Maria Reyes",  avatar:"MR",action:"import",           module:"Manage Tires",    target:"CSV Import",      detail:"Imported 1,204 tires from fitment CSV",              ip:"192.168.1.3",  time:"2026-05-30 08:30:05"},
  {id:"4", user:"Sarah Chen",   avatar:"SC",action:"permission_change",module:"User Permissions",target:"Tom Keller",      detail:"Role changed from Staff to Viewer",                  ip:"192.168.1.1",  time:"2026-05-29 16:42:00"},
  {id:"5", user:"Tom Keller",   avatar:"TK",action:"cancel_order",     module:"Orders",          target:"ORD-2026-0007",   detail:"Order cancelled — reason: Customer cancelled",       ip:"192.168.1.4",  time:"2026-05-29 15:30:44"},
  {id:"6", user:"James Dowell", avatar:"JD",action:"delete_product",   module:"Manage Tires",    target:"GE-Old-SKU-999",  detail:"Tire deleted from catalog",                         ip:"192.168.1.2",  time:"2026-05-29 14:12:33"},
  {id:"7", user:"Amy Lin",      avatar:"AL",action:"export",           module:"Reports",         target:"Sales Report",    detail:"Monthly sales report exported as CSV",               ip:"192.168.1.5",  time:"2026-05-29 12:00:00"},
  {id:"8", user:"Sarah Chen",   avatar:"SC",action:"login",            module:"System",          target:"Auth",            detail:"Successful admin login",                             ip:"192.168.1.1",  time:"2026-05-29 09:00:01"},
  {id:"9", user:"Nate Ford",    avatar:"NF",action:"edit_price",       module:"Marketplace Pricing",target:"GE-Pirelli-321",detail:"Amazon price changed from $265 to $280",           ip:"192.168.1.8",  time:"2026-05-28 17:45:22"},
  {id:"10",user:"Rachel Wong",  avatar:"RW",action:"login",            module:"System",          target:"Auth",            detail:"First login after account creation",                 ip:"192.168.1.7",  time:"2026-05-28 10:01:00"},
  {id:"11",user:"Maria Reyes",  avatar:"MR",action:"edit_inventory",   module:"Vehicle Fitment", target:"Fitment #4821",   detail:"Added 2021 Toyota Camry SE fitment",                ip:"192.168.1.3",  time:"2026-05-27 14:22:11"},
  {id:"12",user:"James Dowell", avatar:"JD",action:"import",           module:"Vehicle Fitment", target:"CSV Import",      detail:"Imported 320 vehicle fitments",                     ip:"192.168.1.2",  time:"2026-05-27 11:00:00"},
];

export function AuditLogs() {
  const [search, setSearch]       = useState("");
  const [userFilter, setUserFilter]   = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const uniqueUsers   = Array.from(new Set(LOGS.map(l=>l.user)));
  const uniqueModules = Array.from(new Set(LOGS.map(l=>l.module)));

  const filtered = useMemo(()=>LOGS.filter(l=>{
    const q = search.toLowerCase();
    const ms = !q || l.user.toLowerCase().includes(q) || l.target.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q);
    const mu = userFilter==="all"   || l.user===userFilter;
    const ma = actionFilter==="all" || l.action===actionFilter;
    const mm = moduleFilter==="all" || l.module===moduleFilter;
    return ms&&mu&&ma&&mm;
  }),[search,userFilter,actionFilter,moduleFilter]);

  const exportCSV = () => {
    const header = "Time,User,Action,Module,Target,Detail,IP";
    const rows = filtered.map(l=>`${l.time},${l.user},${l.action},${l.module},${l.target},"${l.detail}",${l.ip}`);
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="audit-logs.csv"; a.click();
    toast.success("Audit log exported");
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6"/>Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Track who changed inventory, prices, orders and permissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1"/>Export Logs</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:"Total Events",    value:LOGS.length,                                       color:"text-blue-600"},
          {label:"Price Changes",   value:LOGS.filter(l=>l.action==="edit_price").length,    color:"text-yellow-600"},
          {label:"Deletions",       value:LOGS.filter(l=>l.action==="delete_product").length,color:"text-red-600"},
          {label:"Logins Today",    value:LOGS.filter(l=>l.action==="login").length,         color:"text-green-600"},
        ].map(s=>(
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search logs..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger><SelectValue placeholder="All Users"/></SelectTrigger>
            <SelectContent><SelectItem value="all">All Users</SelectItem>{uniqueUsers.map(u=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="All Actions"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {["edit_price","edit_inventory","delete_product","cancel_order","login","permission_change","import","export"].map(a=><SelectItem key={a} value={a}>{a.replace(/_/g," ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger><SelectValue placeholder="All Modules"/></SelectTrigger>
            <SelectContent><SelectItem value="all">All Modules</SelectItem>{uniqueModules.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {LOGS.length} log entries</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l=>(
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{l.time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {l.avatar}
                      </div>
                      <span className="text-sm font-medium">{l.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[l.action]}`}>
                      {ACTION_ICONS[l.action]}{l.action.replace(/_/g," ")}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.module}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{l.target}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.detail}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
