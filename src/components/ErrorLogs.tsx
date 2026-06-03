import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, XCircle, Info, Search, Download, RefreshCw, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type ErrorLevel = "critical"|"error"|"warning"|"info";
type ErrorLog = {
  id:string; level:ErrorLevel; code:string; module:string;
  message:string; detail:string; timestamp:string; resolved:boolean; count:number;
};

const LEVEL_COLORS: Record<ErrorLevel,string> = {
  critical: "bg-red-100 text-red-700",
  error:    "bg-orange-100 text-orange-700",
  warning:  "bg-yellow-100 text-yellow-700",
  info:     "bg-blue-100 text-blue-700",
};

const LEVEL_ICONS: Record<ErrorLevel,React.ReactNode> = {
  critical: <XCircle className="w-3.5 h-3.5"/>,
  error:    <AlertTriangle className="w-3.5 h-3.5"/>,
  warning:  <AlertTriangle className="w-3.5 h-3.5"/>,
  info:     <Info className="w-3.5 h-3.5"/>,
};

const INIT_LOGS: ErrorLog[] = [
  { id:"1",  level:"critical", code:"DB-001",  module:"Database",        message:"Connection timeout",              detail:"PostgreSQL connection pool exhausted after 30s. Max connections: 100, Active: 100. Query: SELECT * FROM products WHERE...",                      timestamp:"2026-05-30 09:14:22", resolved:false, count:3  },
  { id:"2",  level:"error",    code:"IMP-002", module:"CSV Import",      message:"Duplicate SKU violation",         detail:"ON CONFLICT constraint failed for SKU 'GE-Ironman-91202-1'. 500 rows skipped during import. File: fitment-data-2026-05-28.csv",             timestamp:"2026-05-30 08:30:05", resolved:false, count:500},
  { id:"3",  level:"error",    code:"SYN-003", module:"Amazon Sync",     message:"API rate limit exceeded",         detail:"Amazon SP-API returned 429 Too Many Requests. Retry-After: 60s. Endpoint: /catalog/2022-04-01/items. SKUs affected: 23",                     timestamp:"2026-05-30 07:45:11", resolved:true,  count:1  },
  { id:"4",  level:"warning",  code:"PRC-004", module:"Pricing Engine",  message:"Margin below minimum threshold",  detail:"SKU GE-Michelin-123 margin calculated at 18.2%, below minimum 20% rule. Auto-price adjustment blocked. Review pricing rule 'Min 20% Margin'.", timestamp:"2026-05-29 16:42:00", resolved:false, count:7  },
  { id:"5",  level:"warning",  code:"SHP-005", module:"Shopify Sync",    message:"Product variant mismatch",        detail:"Shopify variant ID 43829182 does not match local SKU. 12 products skipped. Run reconciliation to fix.",                                       timestamp:"2026-05-29 14:12:33", resolved:false, count:12 },
  { id:"6",  level:"error",    code:"AUTH-006",module:"Authentication",  message:"Failed login attempts",           detail:"5 consecutive failed login attempts for user 'tom@dmtire.com' from IP 192.168.5.99. Account temporarily locked for 15 minutes.",              timestamp:"2026-05-29 13:01:55", resolved:true,  count:5  },
  { id:"7",  level:"info",     code:"BAK-007", module:"Backup",          message:"Scheduled backup completed",      detail:"Daily database backup completed successfully. Size: 2.4GB. Duration: 4m 12s. Stored at: /backups/2026-05-29.dump.gz",                         timestamp:"2026-05-29 02:00:04", resolved:true,  count:1  },
  { id:"8",  level:"warning",  code:"FTP-008", module:"FTP Feed",        message:"FTP connection timeout",          detail:"FTP connection to ge-tire-feed.com timed out after 30s. Retry scheduled in 5 minutes. Last successful sync: 2026-05-28 22:00",                 timestamp:"2026-05-29 01:30:00", resolved:true,  count:2  },
  { id:"9",  level:"critical", code:"STK-009", module:"Inventory",       message:"Negative stock detected",         detail:"SKU GE-BFG-KO2 stock count reached -2 after order ORD-2026-0009. This indicates an oversell condition. Immediate review required.",           timestamp:"2026-05-28 17:45:22", resolved:false, count:1  },
  { id:"10", level:"info",     code:"EML-010", module:"Email",           message:"Order confirmation sent",         detail:"Email notification sent for ORD-2026-0006 to amy@example.com. SMTP: smtp.dmtire.com:587. MessageID: <20260528.17421@dmtire.com>",             timestamp:"2026-05-28 16:20:11", resolved:true,  count:1  },
];

export function ErrorLogs() {
  const [logs, setLogs]         = useState<ErrorLog[]>(INIT_LOGS);
  const [search, setSearch]     = useState("");
  const [levelFilter, setLevelFilter]   = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [selected, setSelected] = useState<ErrorLog|null>(null);

  const modules = Array.from(new Set(INIT_LOGS.map(l => l.module)));

  const filtered = useMemo(() => logs.filter(l => {
    const q = search.toLowerCase();
    const ms = !q || l.message.toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || l.module.toLowerCase().includes(q);
    const ml = levelFilter==="all"   || l.level===levelFilter;
    const mm = moduleFilter==="all"  || l.module===moduleFilter;
    const mr = resolvedFilter==="all"|| (resolvedFilter==="open"?!l.resolved:l.resolved);
    return ms && ml && mm && mr;
  }), [logs, search, levelFilter, moduleFilter, resolvedFilter]);

  const resolve = (id: string) => {
    setLogs(l => l.map(x => x.id===id ? {...x, resolved:true} : x));
    toast.success("Error marked as resolved");
    if (selected?.id===id) setSelected(s => s?{...s,resolved:true}:null);
  };

  const clearResolved = () => {
    setLogs(l => l.filter(x => !x.resolved));
    toast.success("Cleared all resolved logs");
  };

  const exportLogs = () => {
    const header = "Timestamp,Level,Code,Module,Message,Count,Resolved";
    const rows = filtered.map(l => `${l.timestamp},${l.level},${l.code},${l.module},"${l.message}",${l.count},${l.resolved}`);
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="error-logs.csv"; a.click();
    toast.success("Logs exported");
  };

  const critical = logs.filter(l => l.level==="critical" && !l.resolved).length;
  const errors   = logs.filter(l => l.level==="error"    && !l.resolved).length;
  const warnings = logs.filter(l => l.level==="warning"  && !l.resolved).length;
  const open     = logs.filter(l => !l.resolved).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500"/>Error Logs</h1>
          <p className="text-sm text-muted-foreground">System error tracking, debugging and resolution management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearResolved}><Trash2 className="w-4 h-4 mr-1"/>Clear Resolved</Button>
          <Button variant="outline" size="sm" onClick={exportLogs}><Download className="w-4 h-4 mr-1"/>Export</Button>
          <Button size="sm" onClick={() => { setLogs(INIT_LOGS); toast.success("Logs refreshed"); }}><RefreshCw className="w-4 h-4 mr-1"/>Refresh</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Critical",  value:critical, color:"text-red-700",    bg:"bg-red-50 border-red-200"    },
          { label:"Errors",    value:errors,   color:"text-orange-700", bg:"bg-orange-50 border-orange-200"},
          { label:"Warnings",  value:warnings, color:"text-yellow-700", bg:"bg-yellow-50 border-yellow-200"},
          { label:"Open Total",value:open,     color:"text-blue-700",   bg:"bg-blue-50 border-blue-200"  },
        ].map(s => (
          <Card key={s.label} className={`p-4 text-center border ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-xs font-medium mt-1 ${s.color}`}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search code, message, module..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger><SelectValue placeholder="All Levels"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {(["critical","error","warning","info"] as ErrorLevel[]).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger><SelectValue placeholder="All Modules"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
            <SelectTrigger><SelectValue placeholder="All Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open Only</SelectItem>
              <SelectItem value="resolved">Resolved Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {logs.length} entries — click a row for full details</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-center">Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id} className={`cursor-pointer hover:bg-muted/30 ${!l.resolved&&l.level==="critical"?"bg-red-50/50":""}`}
                  onClick={() => setSelected(l)}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{l.timestamp}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[l.level]}`}>
                      {LEVEL_ICONS[l.level]}{l.level}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold">{l.code}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.module}</Badge></TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{l.message}</TableCell>
                  <TableCell className="text-center">
                    {l.count > 1 && <Badge variant="secondary" className="text-xs">×{l.count}</Badge>}
                    {l.count === 1 && <span className="text-muted-foreground text-xs">1</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${l.resolved?"bg-green-100 text-green-700":"bg-gray-100 text-gray-700"}`}>
                      {l.resolved?"Resolved":"Open"}
                    </span>
                  </TableCell>
                  <TableCell onClick={e=>e.stopPropagation()}>
                    {!l.resolved && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => resolve(l.id)}>Resolve</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={o=>!o&&setSelected(null)}>
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[selected.level]}`}>
                    {LEVEL_ICONS[selected.level]}{selected.level}
                  </span>
                  {selected.code} — {selected.message}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground">Module</p><Badge variant="outline">{selected.module}</Badge></div>
                  <div><p className="text-muted-foreground">Occurrences</p><p className="font-bold">{selected.count}×</p></div>
                  <div><p className="text-muted-foreground">Timestamp</p><p className="font-mono text-xs">{selected.timestamp}</p></div>
                  <div><p className="text-muted-foreground">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selected.resolved?"bg-green-100 text-green-700":"bg-gray-100 text-gray-700"}`}>
                      {selected.resolved?"Resolved":"Open"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Full Error Detail</p>
                  <div className="bg-muted rounded-lg p-3 font-mono text-xs whitespace-pre-wrap break-all">{selected.detail}</div>
                </div>
              </div>
              {!selected.resolved && (
                <Button className="w-full" onClick={() => resolve(selected.id)}>Mark as Resolved</Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
