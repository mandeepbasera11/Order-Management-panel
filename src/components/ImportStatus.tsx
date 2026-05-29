import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCw, CheckCircle2, XCircle, Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ImportRow = {
  id: string;
  filename: string;
  import_type: string;
  status: string;
  total_rows: number;
  success_count: number;
  failed_count: number;
  progress: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString() : "—");
const duration = (a: string, b: string | null) => {
  if (!b) return "—";
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

export function ImportStatus() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("csv_imports")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as ImportRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("csv_imports_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "csv_imports" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const clearCompleted = async () => {
    const { error } = await supabase.from("csv_imports").delete().neq("status", "running");
    if (error) { toast.error(error.message); return; }
    toast.success("Cleared history");
    load();
  };

  const stats = {
    total: rows.length,
    running: rows.filter((r) => r.status === "running").length,
    completed: rows.filter((r) => r.status === "completed").length,
    failed: rows.filter((r) => r.status === "failed").length,
    rowsImported: rows.reduce((a, r) => a + (r.success_count || 0), 0),
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Import Status</h2>
          <p className="text-muted-foreground mt-2">
            Track progress, results, and timestamps for every CSV import.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={clearCompleted} disabled={!rows.length}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear history
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Imports", value: stats.total, icon: FileText, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Running", value: stats.running, icon: Loader2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
          { label: "Rows Imported", value: stats.rowsImported.toLocaleString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Imports</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[180px]">Progress</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No imports yet — run an Import Tires or Import Marketplace from Manage Tires.
                </TableCell></TableRow>
              ) : rows.map((r) => {
                const cfg =
                  r.status === "completed" ? { variant: "default" as const, label: "Completed" } :
                  r.status === "failed"    ? { variant: "destructive" as const, label: "Failed" } :
                                             { variant: "secondary" as const, label: "Running" };
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[220px] truncate" title={r.filename}>{r.filename}</TableCell>
                    <TableCell><Badge variant="outline">{r.import_type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="text-xs">
                        {r.status === "running" && <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />}
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.progress} className="h-2 w-32" />
                        <span className="text-xs text-muted-foreground w-10">{r.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{r.success_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-500 font-medium">{r.failed_count.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmt(r.started_at)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmt(r.completed_at)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{duration(r.started_at, r.completed_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {rows.some((r) => r.status === "failed" && r.error_message) && (
          <div className="p-4 border-t border-border space-y-2">
            <h4 className="text-sm font-semibold">Recent errors</h4>
            {rows.filter((r) => r.status === "failed" && r.error_message).slice(0, 5).map((r) => (
              <div key={r.id} className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">
                <span className="font-mono mr-2">{r.filename}:</span>{r.error_message}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}