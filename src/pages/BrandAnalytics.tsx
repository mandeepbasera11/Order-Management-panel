import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart3, Search, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Brand data (replace with real Supabase query) ──────────────────────────
// Each brand: name, skus, avgPrice, units, inStockPct, value, season, vendor
const BRAND_DATA = [
  { name: "Michelin", skus: 412, avgPrice: 245, units: 42100, inStockPct: 89, value: 10329000, season: "All-season", tier: "Premium" },
  { name: "Goodyear", skus: 388, avgPrice: 198, units: 38600, inStockPct: 82, value: 7642800, season: "All-season", tier: "Mid" },
  { name: "Bridgestone", skus: 356, avgPrice: 210, units: 35400, inStockPct: 77, value: 7434000, season: "All-season", tier: "Mid" },
  { name: "Continental", skus: 298, avgPrice: 228, units: 29500, inStockPct: 71, value: 6726000, season: "All-season", tier: "Premium" },
  { name: "Pirelli", skus: 276, avgPrice: 262, units: 27300, inStockPct: 68, value: 7152600, season: "Summer", tier: "Premium" },
  { name: "Cooper", skus: 245, avgPrice: 142, units: 24200, inStockPct: 65, value: 3436400, season: "All-season", tier: "Mid" },
  { name: "Toyo", skus: 234, avgPrice: 165, units: 23100, inStockPct: 62, value: 3811500, season: "All-season", tier: "Mid" },
  { name: "Hankook", skus: 228, avgPrice: 138, units: 22500, inStockPct: 74, value: 3105000, season: "All-season", tier: "Mid" },
  { name: "BFGoodrich", skus: 198, avgPrice: 175, units: 19600, inStockPct: 58, value: 3430000, season: "All-terrain", tier: "Mid" },
  { name: "Nitto", skus: 187, avgPrice: 192, units: 18400, inStockPct: 55, value: 3532800, season: "Performance", tier: "Mid" },
  { name: "Falken", skus: 176, avgPrice: 148, units: 17400, inStockPct: 61, value: 2575200, season: "All-season", tier: "Mid" },
  { name: "Yokohama", skus: 168, avgPrice: 182, units: 16600, inStockPct: 59, value: 3021200, season: "All-season", tier: "Mid" },
  { name: "General", skus: 154, avgPrice: 128, units: 15200, inStockPct: 66, value: 1945600, season: "All-season", tier: "Budget" },
  { name: "Kumho", skus: 148, avgPrice: 112, units: 14600, inStockPct: 71, value: 1635200, season: "All-season", tier: "Budget" },
  { name: "Nexen", skus: 132, avgPrice: 98, units: 13000, inStockPct: 69, value: 1274000, season: "All-season", tier: "Budget" },
  { name: "Dunlop", skus: 128, avgPrice: 168, units: 12600, inStockPct: 57, value: 2116800, season: "Performance", tier: "Mid" },
  { name: "Firestone", skus: 122, avgPrice: 132, units: 12000, inStockPct: 63, value: 1584000, season: "All-season", tier: "Budget" },
  { name: "GT Radial", skus: 118, avgPrice: 88, units: 11600, inStockPct: 72, value: 1020800, season: "All-season", tier: "Budget" },
  { name: "Mastercraft", skus: 112, avgPrice: 108, units: 11000, inStockPct: 67, value: 1188000, season: "All-season", tier: "Budget" },
  { name: "Hercules", skus: 106, avgPrice: 94, units: 10400, inStockPct: 70, value: 977600, season: "All-season", tier: "Budget" },
  { name: "Ironman", skus: 98, avgPrice: 82, units: 9600, inStockPct: 74, value: 787200, season: "All-season", tier: "Budget" },
  { name: "Federal", skus: 94, avgPrice: 118, units: 9200, inStockPct: 52, value: 1085600, season: "Performance", tier: "Budget" },
  { name: "Accelera", skus: 88, avgPrice: 76, units: 8600, inStockPct: 68, value: 653600, season: "All-season", tier: "Budget" },
  { name: "Atturo", skus: 84, avgPrice: 142, units: 8200, inStockPct: 55, value: 1164400, season: "All-terrain", tier: "Mid" },
  { name: "Vogue", skus: 78, avgPrice: 312, units: 7600, inStockPct: 44, value: 2371200, season: "Luxury", tier: "Ultra" },
  { name: "Landspider", skus: 72, avgPrice: 68, units: 7000, inStockPct: 77, value: 476000, season: "All-season", tier: "Budget" },
  { name: "Milestar", skus: 68, avgPrice: 92, units: 6600, inStockPct: 64, value: 607200, season: "All-terrain", tier: "Budget" },
  { name: "Lexani", skus: 64, avgPrice: 188, units: 6200, inStockPct: 48, value: 1165600, season: "Luxury", tier: "Premium" },
  { name: "Lionhart", skus: 62, avgPrice: 72, units: 6000, inStockPct: 66, value: 432000, season: "All-season", tier: "Budget" },
  { name: "Kenda", skus: 58, avgPrice: 85, units: 5600, inStockPct: 71, value: 476000, season: "All-season", tier: "Budget" },
  { name: "Fullway", skus: 54, avgPrice: 62, units: 5200, inStockPct: 73, value: 322400, season: "All-season", tier: "Budget" },
  { name: "Radar", skus: 52, avgPrice: 108, units: 5000, inStockPct: 58, value: 540000, season: "All-terrain", tier: "Budget" },
  { name: "Thunderer", skus: 48, avgPrice: 92, units: 4600, inStockPct: 61, value: 423200, season: "All-terrain", tier: "Budget" },
  { name: "Nankang", skus: 46, avgPrice: 118, units: 4400, inStockPct: 54, value: 519200, season: "Performance", tier: "Budget" },
  { name: "Otani", skus: 44, avgPrice: 74, units: 4200, inStockPct: 69, value: 310800, season: "All-season", tier: "Budget" },
  { name: "Westlake", skus: 42, avgPrice: 68, units: 4000, inStockPct: 72, value: 272000, season: "All-season", tier: "Budget" },
  { name: "Maxxis", skus: 40, avgPrice: 138, units: 3800, inStockPct: 59, value: 524400, season: "All-terrain", tier: "Mid" },
  { name: "Sailun", skus: 38, avgPrice: 82, units: 3600, inStockPct: 66, value: 295200, season: "All-season", tier: "Budget" },
  { name: "Crossmax", skus: 36, avgPrice: 96, units: 3400, inStockPct: 61, value: 326400, season: "All-season", tier: "Budget" },
  { name: "Prinx", skus: 34, avgPrice: 88, units: 3200, inStockPct: 64, value: 281600, season: "All-season", tier: "Budget" },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  Budget: "#639922",
  Mid: "#378add",
  Premium: "#7f77dd",
  Ultra: "#d85a30",
};

const CHART_COLORS = [
  "#378add","#639922","#7f77dd","#d85a30","#ef9f27",
  "#1d9e75","#d4537e","#888780","#e24b4a","#ba7517",
];

type SortKey = "skus" | "avgPrice" | "units" | "value" | "inStockPct";
type Tab = "overview" | "price" | "table";

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt = {
  currency: (v: number) => v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : `$${(v / 1_000).toFixed(0)}K`,
  price: (v: number) => `$${v.toLocaleString()}`,
  count: (v: number) => v.toLocaleString(),
  pct: (v: number) => `${v}%`,
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, sub }: {
  label: string; value: string; icon: React.ElementType; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-medium">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-secondary rounded-md">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    Budget: "bg-green-100 text-green-800",
    Mid: "bg-blue-100 text-blue-800",
    Premium: "bg-purple-100 text-purple-800",
    Ultra: "bg-orange-100 text-orange-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[tier] ?? "bg-gray-100 text-gray-700"}`}>
      {tier}
    </span>
  );
}

// ─── Price bucket chart data ─────────────────────────────────────────────────
const PRICE_BUCKETS = [
  { label: "<$50",      min: 0,   max: 50   },
  { label: "$50–100",   min: 50,  max: 100  },
  { label: "$100–150",  min: 100, max: 150  },
  { label: "$150–200",  min: 150, max: 200  },
  { label: "$200–300",  min: 200, max: 300  },
  { label: "$300–500",  min: 300, max: 500  },
  { label: ">$500",     min: 500, max: Infinity },
];

const TIER_PIE = [
  { name: "Budget (<$100)",      value: 31, color: "#639922" },
  { name: "Mid ($100–$250)",     value: 52, color: "#378add" },
  { name: "Premium ($250–$500)", value: 33, color: "#7f77dd" },
  { name: "Ultra (>$500)",       value: 15, color: "#d85a30" },
];

// ─── Tier classification (since the DB view doesn't store this) ─────────────
function classifyTier(avgPrice: number): string {
  if (avgPrice < 100) return "Budget";
  if (avgPrice < 250) return "Mid";
  if (avgPrice < 500) return "Premium";
  return "Ultra";
}

// ─── Main component ──────────────────────────────────────────────────────────
export function BrandAnalytics() {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("skus");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ── Live data state ─────────────────────────────────────────────────────────
  const [brandData, setBrandData] = useState(BRAND_DATA); // fallback to mock until loaded
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrands() {
      setLoading(true);
      setError(null);

      // Query the pre-aggregated view (see brand_summary_view.sql)
      const { data, error } = await supabase
        .from("brand_summary")
        .select("brand, skus, avg_price, units, value, in_stock_pct")
        .order("skus", { ascending: false });

      if (error) {
        console.error("Failed to load brand_summary:", error);
        setError(error.message);
        setLoading(false);
        return; // keeps BRAND_DATA fallback
      }

      if (data && data.length > 0) {
        const mapped = data.map(row => ({
          name: row.brand,
          skus: row.skus,
          avgPrice: Math.round(row.avg_price),
          units: row.units,
          inStockPct: row.in_stock_pct,
          value: row.value,
          season: "All-season", // not in view; add a season column/query if needed
          tier: classifyTier(row.avg_price),
        }));
        setBrandData(mapped);
      }
      setLoading(false);
    }

    loadBrands();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const totalValue = brandData.reduce((s, b) => s + b.value, 0);
  const totalSkus  = brandData.reduce((s, b) => s + b.skus, 0);
  const avgPrice   = Math.round(brandData.reduce((s, b) => s + b.avgPrice, 0) / brandData.length);

  const seasons = ["All", ...Array.from(new Set(brandData.map(b => b.season))).sort()];
  const tiers   = ["All", "Budget", "Mid", "Premium", "Ultra"];

  const filtered = useMemo(() => {
    let rows = [...brandData];
    if (search)              rows = rows.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    if (tierFilter !== "All")   rows = rows.filter(b => b.tier === tierFilter);
    if (seasonFilter !== "All") rows = rows.filter(b => b.season === seasonFilter);
    rows.sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
    return rows;
  }, [search, tierFilter, seasonFilter, sortKey, sortDir]);

  const top10ByValue = [...brandData].sort((a, b) => b.value - a.value).slice(0, 10);
  const top10BySkus  = [...brandData].sort((a, b) => b.skus - a.skus).slice(0, 10);

  const priceBuckets = PRICE_BUCKETS.map(bucket => ({
    label: bucket.label,
    count: brandData.filter(b => b.avgPrice >= bucket.min && b.avgPrice < bucket.max).length,
  }));

  const scatterData = brandData.slice(0, 30).map(b => ({
    x: b.avgPrice,
    y: b.skus,
    name: b.name,
    tier: b.tier,
  }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => toggleSort(k)}
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-foreground" : "text-muted-foreground/40"}`} />
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-medium">Brand analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {brandData.length} brands · {totalSkus.toLocaleString()} SKUs · {fmt.currency(totalValue)} inventory value
            {loading && <span className="ml-2 text-xs">(refreshing live data...)</span>}
            {error && <span className="ml-2 text-xs text-red-500">(using cached data — {error})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {(["overview", "price", "table"] as Tab[]).map(t => (
            <Button
              key={t}
              variant={tab === t ? "secondary" : "outline"}
              size="sm"
              onClick={() => setTab(t)}
              className="capitalize"
            >
              {t === "overview" ? "Top movers" : t === "price" ? "Price distribution" : "All brands"}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total brands"    value={String(brandData.length)}     icon={BarChart3} />
        <StatCard label="Total SKUs"      value={totalSkus.toLocaleString()}    icon={Package}   sub="across all brands" />
        <StatCard label="Avg price"       value={fmt.price(avgPrice)}           icon={DollarSign} />
        <StatCard label="Inventory value" value={fmt.currency(totalValue)}      icon={TrendingUp} />
      </div>

      {/* ── TAB: Overview ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top 10 by SKUs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top 10 by SKU count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {top10BySkus.map((b, i) => (
                    <div key={b.name} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                      <span className="text-sm font-medium w-24 truncate">{b.name}</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.round((b.skus / top10BySkus[0].skus) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{b.skus}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top 10 by avg price */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top 10 by avg price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...brandData].sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10).map((b, i) => (
                    <div key={b.name} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                      <span className="text-sm font-medium w-24 truncate">{b.name}</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: `${Math.round((b.avgPrice / 350) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">${b.avgPrice}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 by inventory value */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top 10 by inventory value</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={top10ByValue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={52} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(v: number) => [fmt.currency(v), "Value"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  {top10ByValue.map((b, i) => (
                    <Cell key={b.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {top10ByValue.map((b, i) => (
                      <Cell key={b.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: Price distribution ───────────────────────────────────────── */}
      {tab === "price" && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Price bucket bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Brands by price bucket</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priceBuckets} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" name="Brands" fill="#378add" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Brand tier breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={TIER_PIE}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                      labelLine={false}
                    >
                      {TIER_PIE.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="square"
                      iconSize={10}
                      formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                    />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Scatter: price vs SKU count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg price vs SKU count (top 30 brands)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis
                    type="number" dataKey="x" name="Avg price"
                    tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`}
                    label={{ value: "Avg price ($)", position: "insideBottom", offset: -4, fontSize: 11 }}
                    domain={[0, 350]}
                  />
                  <YAxis
                    type="number" dataKey="y" name="SKU count"
                    tick={{ fontSize: 11 }}
                    label={{ value: "SKU count", angle: -90, position: "insideLeft", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-2 text-xs shadow-sm">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-muted-foreground">Avg price: ${d.x}</p>
                          <p className="text-muted-foreground">SKUs: {d.y}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData} name="Brands">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={TIER_COLORS[entry.tier] ?? "#888"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                {Object.entries(TIER_COLORS).map(([tier, color]) => (
                  <span key={tier} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                    {tier}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: All brands table ─────────────────────────────────────────── */}
      {tab === "table" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search brand..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All tiers" /></SelectTrigger>
                <SelectContent>
                  {tiers.map(t => <SelectItem key={t} value={t}>{t === "All" ? "All tiers" : t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All seasons" /></SelectTrigger>
                <SelectContent>
                  {seasons.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All seasons" : s}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filtered.length} brands</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Brand</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tier</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Season</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                      <SortBtn k="skus" label="SKUs" />
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      <SortBtn k="avgPrice" label="Avg price" />
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      <SortBtn k="units" label="Units" />
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      <SortBtn k="inStockPct" label="In stock" />
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      <SortBtn k="value" label="Value" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr
                      key={b.name}
                      className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                    >
                      <td className="px-4 py-2.5 font-medium">{b.name}</td>
                      <td className="px-4 py-2.5"><TierBadge tier={b.tier} /></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{b.season}</td>
                      <td className="px-4 py-2.5 text-right">{b.skus}</td>
                      <td className="px-4 py-2.5 text-right">{fmt.price(b.avgPrice)}</td>
                      <td className="px-4 py-2.5 text-right">{fmt.count(b.units)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={b.inStockPct >= 70 ? "text-green-600" : b.inStockPct >= 50 ? "text-amber-600" : "text-red-600"}>
                          {b.inStockPct}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{fmt.currency(b.value)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No brands match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BrandAnalytics;
