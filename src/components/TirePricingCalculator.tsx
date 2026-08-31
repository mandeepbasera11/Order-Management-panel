import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2, Search, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Pick = {
  id: string;
  sku: string;
  item_name: string | null;
  brand: string | null;
  size: string | null;
  price: number | null;
  wholesale_price: number | null;
  tire_weight: string | null;
};

const num = (v: string | number | null | undefined, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};
const money = (n: number) => `$${n.toFixed(2)}`;

export function TirePricingCalculator() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Pick[]>([]);
  const [searching, setSearching] = useState(false);
  const [sel, setSel] = useState<Pick | null>(null);
  const [saving, setSaving] = useState(false);

  // inputs
  const [unitCost, setUnitCost] = useState("0");
  const [freight, setFreight] = useState("18");
  const [handling, setHandling] = useState("6");
  const [feePct, setFeePct] = useState("12");
  const [targetMargin, setTargetMargin] = useState("28");
  const [retail, setRetail] = useState("0");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const search = useCallback(async () => {
    if (!debounced) { setResults([]); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,sku,item_name,brand,size,price,wholesale_price,tire_weight")
      .or(`sku.ilike.%${debounced}%,item_name.ilike.%${debounced}%,size.ilike.%${debounced}%`)
      .order("sku")
      .limit(12);
    setSearching(false);
    if (error) { toast.error(error.message); return; }
    setResults((data ?? []) as unknown as Pick[]);
  }, [debounced]);

  useEffect(() => { search(); }, [search]);

  const choose = (p: Pick) => {
    setSel(p);
    setResults([]);
    setQuery(p.sku);
    const cost = num(p.wholesale_price) || num(p.price) * 0.72;
    setUnitCost(cost.toFixed(2));
    setRetail((num(p.price) || cost * 1.45).toFixed(2));
  };

  const calc = useMemo(() => {
    const cost = num(unitCost);
    const landed = cost + num(freight) + num(handling);
    const price = num(retail);
    const fees = price * (num(feePct) / 100);
    const profit = price - landed - fees;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const markup = landed > 0 ? ((price - landed) / landed) * 100 : 0;
    const tm = Math.min(num(targetMargin), 95) / 100;
    const feeRate = num(feePct) / 100;
    const denom = 1 - tm - feeRate;
    const suggested = denom > 0 ? landed / denom : 0;
    return { cost, landed, price, fees, profit, margin, markup, suggested };
  }, [unitCost, freight, handling, feePct, retail, targetMargin]);

  const applyPrice = async (value: number) => {
    if (!sel) { toast.error("Select a SKU first"); return; }
    if (!(value > 0)) { toast.error("Price must be greater than zero"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").update({ price: value } as never).eq("id", sel.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSel({ ...sel, price: value });
    toast.success(`${sel.sku} priced at ${money(value)}`);
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, suffix?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input id={id} inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} className="h-9 pr-8" />
        {suffix && <span className="absolute right-2.5 top-2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <Card>
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Tire pricing calculator
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pull a SKU's cost, add freight, handling and channel fees, then see live margin, markup and a
          target-margin retail price you can save back to the catalog.
        </p>
      </div>

      <div className="p-4 grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* left: pick + inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pc-search" className="text-xs text-muted-foreground">SKU / item / size</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input id="pc-search" className="pl-8 h-9" placeholder="Search catalog…"
                value={query} onChange={(e) => { setQuery(e.target.value); setSel(null); }} />
              {searching && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {results.length > 0 && (
              <div className="rounded-lg border divide-y max-h-60 overflow-auto">
                {results.map((p) => (
                  <button key={p.id} onClick={() => choose(p)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60 transition">
                    <p className="text-xs font-mono">{p.sku}</p>
                    <p className="text-sm font-medium truncate">{p.item_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.brand, p.size].filter(Boolean).join(" · ") || "—"}
                      {p.wholesale_price ? ` · cost ${money(num(p.wholesale_price))}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {sel && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{sel.item_name || sel.sku}</p>
              <p className="text-xs text-muted-foreground">
                {[sel.brand, sel.size].filter(Boolean).join(" · ") || "—"}
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Badge variant="outline">Catalog {money(num(sel.price))}</Badge>
                <Badge variant="outline">
                  {sel.wholesale_price ? `Wholesale ${money(num(sel.wholesale_price))}` : "No wholesale cost"}
                </Badge>
                {sel.tire_weight && <Badge variant="outline">{sel.tire_weight} lb</Badge>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {field("pc-cost", "Unit cost", unitCost, setUnitCost, "$")}
            {field("pc-freight", "Freight / tire", freight, setFreight, "$")}
            {field("pc-handling", "Handling / tire", handling, setHandling, "$")}
            {field("pc-fee", "Channel fees", feePct, setFeePct, "%")}
            {field("pc-retail", "Retail price", retail, setRetail, "$")}
            {field("pc-target", "Target margin", targetMargin, setTargetMargin, "%")}
          </div>
        </div>

        {/* right: results */}
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Landed cost", value: money(calc.landed), hint: "cost + freight + handling" },
              { label: "Gross profit", value: money(calc.profit), hint: `after ${money(calc.fees)} fees` },
              { label: "Margin", value: `${calc.margin.toFixed(1)}%`, hint: "profit ÷ retail" },
              { label: "Markup", value: `${calc.markup.toFixed(1)}%`, hint: "over landed cost" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className={`text-2xl font-bold mt-1 ${
                  m.label === "Gross profit" && calc.profit < 0 ? "text-destructive" : ""
                }`}>{m.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{m.hint}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap bg-muted/30">
            <div>
              <p className="text-sm font-semibold">
                Price for {num(targetMargin).toFixed(0)}% margin: {calc.suggested > 0 ? money(calc.suggested) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Includes {num(feePct)}% channel fees on the sale price.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRetail(calc.suggested.toFixed(2))}
                disabled={!(calc.suggested > 0)}>
                Use suggested
              </Button>
              <Button onClick={() => applyPrice(calc.price)} disabled={!sel || saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                Save retail price
              </Button>
            </div>
          </div>

          <div className="rounded-xl border">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground px-4 py-2 border-b">
              <span>Scenario</span><span>Retail</span><span>Profit</span><span>Margin</span>
            </div>
            {[0.9, 1, 1.1, 1.2].map((mult) => {
              const p = calc.price * mult;
              const profit = p - calc.landed - p * (num(feePct) / 100);
              const margin = p > 0 ? (profit / p) * 100 : 0;
              return (
                <div key={mult} className="grid grid-cols-4 text-sm px-4 py-2 border-b last:border-0">
                  <span className="text-muted-foreground">
                    {mult === 1 ? "Current" : `${mult > 1 ? "+" : ""}${((mult - 1) * 100).toFixed(0)}%`}
                  </span>
                  <span>{money(p)}</span>
                  <span className={profit < 0 ? "text-destructive" : ""}>{money(profit)}</span>
                  <span>{margin.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
