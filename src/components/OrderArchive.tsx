import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, Search, Download, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = { id:string; order_no:string; customer:string|null; channel:string|null; status:string; total:number|null; created_at:string };

export function OrderArchive() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_no,customer,channel,status,total,created_at")
      .in("status", ["completed","cancelled","refunded","archived"])
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return !s ? rows : rows.filter(r =>
      [r.order_no, r.customer ?? "", r.channel ?? "", r.status].some(v => v.toLowerCase().includes(s)));
  }, [rows, q]);

  const restore = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "processing" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order restored to processing");
    load();
  };

  const exportCsv = () => {
    const header = "order_no,customer,channel,status,total,created_at\n";
    const body = filtered.map(r => `${r.order_no},${r.customer ?? ""},${r.channel ?? ""},${r.status},${r.total ?? 0},${r.created_at}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "order-archive.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: string) =>
    s==="completed" ? "bg-green-100 text-green-700"
    : s==="cancelled" ? "bg-red-100 text-red-700"
    : s==="refunded" ? "bg-orange-100 text-orange-700"
    : "bg-gray-100 text-gray-700";

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="w-7 h-7 text-primary"/>Order Archive
          </h2>
          <p className="text-muted-foreground mt-1">Completed, cancelled, and refunded orders. Restore back to active queue when needed.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2"/>Export CSV</Button>
      </div>
      <Card className="p-4">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <Input className="pl-9" placeholder="Search archived orders..." value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Channel</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No archived orders</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.order_no}</TableCell>
                <TableCell>{r.customer ?? "—"}</TableCell>
                <TableCell>{r.channel ?? "—"}</TableCell>
                <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">${(r.total ?? 0).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={()=>restore(r.id)}>
                    <RotateCcw className="w-3 h-3 mr-1"/>Restore
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}