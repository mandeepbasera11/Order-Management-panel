import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Search, RefreshCw, Download, Eye } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  before_value: unknown;
  after_value: unknown;
  metadata: unknown;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  "inventory.stock_changed":  "bg-blue-100 text-blue-700",
  "inventory.price_changed":  "bg-amber-100 text-amber-700",
  "inventory.bulk_updated":   "bg-purple-100 text-purple-700",
  "inventory.created":        "bg-green-100 text-green-700",
  "inventory.deleted":        "bg-red-100 text-red-700",
  "order.cancelled":          "bg-red-100 text-red-700",
  "order.status_changed":     "bg-indigo-100 text-indigo-700",
  "order.created":            "bg-green-100 text-green-700",
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

export function AuditLogs() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [detail, setDetail] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { load(); }, []);

  const actions = useMemo(
    () => Array.from(new Set(rows.map(r => r.action))).sort(),
    [rows],
  );

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (r.actor_email || "").toLowerCase().includes(q)
      || (r.entity_label || "").toLowerCase().includes(q)
      || (r.entity_id || "").toLowerCase().includes(q)
      || r.action.toLowerCase().includes(q);
    const matchAction = actionFilter === "all" || r.action === actionFilter;
    const matchEntity = entityFilter === "all" || r.entity_type === entityFilter;
    return matchSearch && matchAction && matchEntity;
  }), [rows, search, actionFilter, entityFilter]);

  const exportCSV = () => {
    const header = "When,Actor,Action,Entity,Label,Before,After";
    const lines = filtered.map(r => [
      fmt(r.created_at),
      r.actor_email || r.actor_id || "",
      r.action,
      r.entity_type,
      r.entity_label || r.entity_id || "",
      JSON.stringify(r.before_value ?? ""),
      JSON.stringify(r.after_value ?? ""),
    ].map(s => `"${String(s).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "audit-logs.csv"; a.click();
  };

  const summarize = (r: Row): string => {
    const b = r.before_value as Record<string, unknown> | null;
    const a = r.after_value as Record<string, unknown> | null;
    if (!b && !a) return "—";
    const keys = Array.from(new Set([...(b ? Object.keys(b) : []), ...(a ? Object.keys(a) : [])]));
    return keys.slice(0, 3).map(k => `${k}: ${b?.[k] ?? "—"} → ${a?.[k] ?? "—"}`).join(", ")
      + (keys.length > 3 ? ` (+${keys.length - 3})` : "");
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6"/>Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Who changed inventory, edited prices, or cancelled orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1"/>Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}/>Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search actor, entity, action..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="order">Order</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-56"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Loading audit logs...
                </TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No audit entries yet
                </TableCell></TableRow>
              )}
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                  <TableCell className="text-sm font-medium">{r.actor_email || r.actor_id?.slice(0,8) || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${ACTION_COLORS[r.action] || "bg-gray-100 text-gray-700"}`}>
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{r.entity_label || r.entity_id?.slice(0,8) || "—"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.entity_type}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">{summarize(r)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetail(r)}>
                      <Eye className="w-4 h-4"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5"/>{detail.action}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">When</p><p className="font-medium">{fmt(detail.created_at)}</p></div>
                <div><p className="text-muted-foreground">Actor</p><p className="font-medium">{detail.actor_email || "—"}</p></div>
                <div><p className="text-muted-foreground">Entity</p><p className="font-medium capitalize">{detail.entity_type}</p></div>
                <div><p className="text-muted-foreground">Label</p><p className="font-medium">{detail.entity_label || detail.entity_id || "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Before</p>
                  <pre className="bg-muted/40 rounded p-2 text-xs overflow-x-auto max-h-64">
{JSON.stringify(detail.before_value ?? null, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">After</p>
                  <pre className="bg-muted/40 rounded p-2 text-xs overflow-x-auto max-h-64">
{JSON.stringify(detail.after_value ?? null, null, 2)}
                  </pre>
                </div>
              </div>
              {detail.metadata != null && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Metadata</p>
                  <pre className="bg-muted/40 rounded p-2 text-xs overflow-x-auto max-h-40">
{JSON.stringify(detail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}