import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FlaskConical, Plus, Trash2, TrendingUp,
  PlayCircle, StopCircle, CheckCircle2, Search,
} from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type ExperimentStatus = "running" | "completed" | "draft" | "paused";

type Experiment = {
  id: string;
  name: string;
  productId: string;
  productName: string;
  sku: string;
  priceA: number;
  priceB: number;
  basePrice: number;
  status: ExperimentStatus;
  startDate: string;
  endDate?: string;
  conversionsA: number;
  conversionsB: number;
  revenueA: number;
  revenueB: number;
  winner?: "A" | "B" | null;
};

const STATUS_STYLE: Record<ExperimentStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  running:   { label: "Running",   variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  draft:     { label: "Draft",     variant: "outline" },
  paused:    { label: "Paused",    variant: "destructive" },
};

const buildFakeExperiments = (products: Product[]): Experiment[] => {
  if (!products.length) return [];
  const statuses: ExperimentStatus[] = ["running", "running", "completed", "paused", "draft"];
  return products.slice(0, Math.min(products.length, 8)).map((p, i) => {
    const seed = p.sku.charCodeAt(0) % 10;
    const priceA = parseFloat((p.price * 0.95).toFixed(2));
    const priceB = parseFloat((p.price * 1.08).toFixed(2));
    const convA = 40 + seed * 3;
    const convB = 28 + seed * 4;
    const status = statuses[i % statuses.length];
    const winner = status === "completed" ? (convA * priceA > convB * priceB ? "A" : "B") : null;
    return {
      id: `exp-${p.id}`,
      name: `Test ${i + 1}: ${p.name.split(" ").slice(0, 3).join(" ")}`,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      priceA,
      priceB,
      basePrice: p.price,
      status,
      startDate: `2025-0${(i % 9) + 1}-15`,
      endDate: status === "completed" ? `2025-0${(i % 9) + 2}-15` : undefined,
      conversionsA: convA,
      conversionsB: convB,
      revenueA: parseFloat((convA * priceA).toFixed(2)),
      revenueB: parseFloat((convB * priceB).toFixed(2)),
      winner,
    };
  });
};

export function PriceExperiment() {
  const [products, setProducts] = useState<Product[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailExp, setDetailExp] = useState<Experiment | null>(null);
  const [form, setForm] = useState({ productId: "", name: "", priceA: "", priceB: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) toast.error(error.message);
    else {
      setProducts(data ?? []);
      setExperiments(buildFakeExperiments(data ?? []));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return experiments.filter((e) => {
      const matchSearch = !q || e.name.toLowerCase().includes(q) || e.sku.toLowerCase().includes(q) || e.productName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [experiments, search, statusFilter]);

  const stats = useMemo(() => ({
    running:   experiments.filter((e) => e.status === "running").length,
    completed: experiments.filter((e) => e.status === "completed").length,
    avgUplift: experiments.length
      ? (experiments.reduce((sum, e) => {
          const best = Math.max(e.revenueA, e.revenueB);
          const base = e.conversionsA * e.basePrice;
          return sum + ((best - base) / (base || 1)) * 100;
        }, 0) / experiments.length).toFixed(1)
      : "0",
  }), [experiments]);

  const addExperiment = () => {
    if (!form.productId || !form.name || !form.priceA || !form.priceB) {
      toast.error("All fields are required");
      return;
    }
    const product = products.find((p) => p.id === form.productId);
    if (!product) return;
    const newExp: Experiment = {
      id: `exp-new-${Date.now()}`,
      name: form.name,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      priceA: Number(form.priceA),
      priceB: Number(form.priceB),
      basePrice: product.price,
      status: "draft",
      startDate: new Date().toISOString().split("T")[0],
      conversionsA: 0,
      conversionsB: 0,
      revenueA: 0,
      revenueB: 0,
      winner: null,
    };
    setExperiments((prev) => [newExp, ...prev]);
    toast.success("Experiment created (draft)");
    setAddOpen(false);
    setForm({ productId: "", name: "", priceA: "", priceB: "" });
  };

  const changeStatus = (id: string, status: ExperimentStatus) => {
    setExperiments((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    const labels: Record<ExperimentStatus, string> = { running: "started", paused: "paused", completed: "completed", draft: "set to draft" };
    toast.success(`Experiment ${labels[status]}`);
  };

  const deleteExperiment = (id: string) => {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    toast.success("Experiment deleted");
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Price Experiment</h2>
          <p className="text-muted-foreground mt-2">
            Run A/B pricing tests on selected tire SKUs to find the best price point.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Experiment
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Running Now",        value: stats.running,          icon: PlayCircle,   color: "text-green-600",  bg: "bg-green-50" },
          { label: "Completed",          value: stats.completed,        icon: CheckCircle2, color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Total Experiments",  value: experiments.length,     icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Avg Uplift",         value: `${stats.avgUplift}%`,  icon: TrendingUp,   color: "text-orange-600", bg: "bg-orange-50" },
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

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search experiments or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExperimentStatus | "all")}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Experiments ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Experiment</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-right">Price A</TableHead>
                <TableHead className="text-right">Price B</TableHead>
                <TableHead className="text-right">Conv. A</TableHead>
                <TableHead className="text-right">Conv. B</TableHead>
                <TableHead className="text-right">Rev. A</TableHead>
                <TableHead className="text-right">Rev. B</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={12} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-10 text-muted-foreground">No experiments found</TableCell></TableRow>
              ) : filtered.map((exp) => {
                const cfg = STATUS_STYLE[exp.status];
                const aWins = exp.revenueA >= exp.revenueB;
                return (
                  <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setDetailExp(exp)}>
                    <TableCell>
                      <div className="font-medium text-sm">{exp.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">{exp.productName}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{exp.sku}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-right">${exp.basePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${exp.priceA.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${exp.priceB.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{exp.conversionsA}</TableCell>
                    <TableCell className="text-right">{exp.conversionsB}</TableCell>
                    <TableCell className={`text-right font-medium ${aWins ? "text-green-600" : "text-muted-foreground"}`}>
                      ${exp.revenueA.toFixed(0)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${!aWins ? "text-green-600" : "text-muted-foreground"}`}>
                      ${exp.revenueB.toFixed(0)}
                    </TableCell>
                    <TableCell>
                      {exp.winner ? (
                        <Badge className={exp.winner === "A" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}>
                          Price {exp.winner} 🏆
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {exp.status === "draft" && (
                          <Button size="icon" variant="outline" className="h-8 w-8"
                            onClick={() => changeStatus(exp.id, "running")}>
                            <PlayCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {exp.status === "running" && (
                          <Button size="icon" variant="outline" className="h-8 w-8"
                            onClick={() => changeStatus(exp.id, "paused")}>
                            <StopCircle className="w-4 h-4 text-yellow-600" />
                          </Button>
                        )}
                        {exp.status === "paused" && (
                          <Button size="icon" variant="outline" className="h-8 w-8"
                            onClick={() => changeStatus(exp.id, "running")}>
                            <PlayCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {(exp.status === "running" || exp.status === "paused") && (
                          <Button size="icon" variant="outline" className="h-8 w-8"
                            onClick={() => changeStatus(exp.id, "completed")}>
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        <Button size="icon" variant="destructive" className="h-8 w-8"
                          onClick={() => deleteExperiment(exp.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Experiment Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Price Experiment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Experiment Name</Label>
              <Input placeholder="e.g. Michelin Summer Pricing Test"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Select Product (SKU)</Label>
              <Select value={form.productId} onValueChange={(v) => {
                const p = products.find((x) => x.id === v);
                setForm((f) => ({ ...f, productId: v, priceA: p ? String((p.price * 0.95).toFixed(2)) : "", priceB: p ? String((p.price * 1.10).toFixed(2)) : "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Choose a tire SKU" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku} — {p.name.slice(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.productId && (
                <p className="text-xs text-muted-foreground">
                  Base price: ${products.find((p) => p.id === form.productId)?.price.toFixed(2)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Price A (Control)</Label>
                <Input type="number" step="0.01" placeholder="e.g. 95.00"
                  value={form.priceA} onChange={(e) => setForm((f) => ({ ...f, priceA: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Usually lower / current price</p>
              </div>
              <div className="space-y-1">
                <Label>Price B (Test)</Label>
                <Input type="number" step="0.01" placeholder="e.g. 110.00"
                  value={form.priceB} onChange={(e) => setForm((f) => ({ ...f, priceB: e.target.value }))} />
                <p className="text-xs text-muted-foreground">The new price to test</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addExperiment}>Create Experiment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailExp} onOpenChange={(o) => !o && setDetailExp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailExp?.name}</DialogTitle>
          </DialogHeader>
          {detailExp && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Product:</span> <span className="font-medium">{detailExp.productName}</span></p>
                <p><span className="text-muted-foreground">SKU:</span> <span className="font-mono">{detailExp.sku}</span></p>
                <p><span className="text-muted-foreground">Base price:</span> <span className="font-medium">${detailExp.basePrice.toFixed(2)}</span></p>
                <p><span className="text-muted-foreground">Started:</span> {detailExp.startDate}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(["A", "B"] as const).map((variant) => {
                  const price = variant === "A" ? detailExp.priceA : detailExp.priceB;
                  const conv  = variant === "A" ? detailExp.conversionsA : detailExp.conversionsB;
                  const rev   = variant === "A" ? detailExp.revenueA : detailExp.revenueB;
                  const total = detailExp.conversionsA + detailExp.conversionsB;
                  const pct   = total ? (conv / total) * 100 : 0;
                  const isWinner = detailExp.winner === variant;
                  return (
                    <div key={variant} className={`rounded-xl border p-4 space-y-2 ${isWinner ? "border-green-400 bg-green-50" : "border-border bg-card"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Price {variant}</span>
                        {isWinner && <Badge className="bg-green-600">Winner 🏆</Badge>}
                      </div>
                      <p className="text-2xl font-bold">${price.toFixed(2)}</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{conv} conversions ({pct.toFixed(1)}%)</p>
                        <p className="font-medium text-foreground">${rev.toFixed(2)} revenue</p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${isWinner ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                {detailExp.winner
                  ? `Price ${detailExp.winner} generated ${((Math.max(detailExp.revenueA, detailExp.revenueB) / Math.min(detailExp.revenueA, detailExp.revenueB) - 1) * 100).toFixed(1)}% more revenue`
                  : "Experiment still running — no winner declared yet"}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailExp(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
