import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users,
  Building2, AlertTriangle, RotateCcw, RefreshCw, Truck, Download,
  Clock, CheckCircle2, XCircle, Activity, BarChart3, Warehouse, Star,
  Zap, ArrowRight, Shield,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = "today" | "week" | "month" | "custom";
type UserRole = "Admin" | "Manager" | "Staff" | "Viewer";

// Props — allows navigating to other pages
interface ExecutiveDashboardProps {
  onNavigate?: (page: string) => void;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const generateDailySales = () =>
  Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const revenue = Math.round(4000 + Math.random() * 14000 + (i > 20 ? 4000 : 0));
    const orders  = Math.round(revenue / 162);
    const profit  = Math.round(revenue * (0.18 + Math.random() * 0.08));
    return { day, revenue, orders, profit };
  });

const generateMonthlyRevenue = () =>
  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((month, i) => ({
    month,
    revenue: Math.round(110000 + i * 8500 + Math.random() * 20000),
    profit:  Math.round(22000  + i * 1800 + Math.random() * 5000),
    orders:  Math.round(310    + i * 28   + Math.random() * 60),
    target:  Math.round(120000 + i * 9000),
  }));

const DAILY_SALES    = generateDailySales();
const MONTHLY_REV    = generateMonthlyRevenue();

const ORDER_STATUS_DATA = [
  { name:"New Order",  value:42,  color:"#3b82f6" },
  { name:"Processing", value:28,  color:"#f59e0b" },
  { name:"Picking",    value:19,  color:"#f97316" },
  { name:"Packed",     value:15,  color:"#8b5cf6" },
  { name:"Shipped",    value:38,  color:"#06b6d4" },
  { name:"Delivered",  value:124, color:"#10b981" },
  { name:"Cancelled",  value:8,   color:"#ef4444" },
  { name:"Returned",   value:6,   color:"#6b7280" },
];

const MARKETPLACE_REVENUE = [
  { channel:"Shopify", revenue:84200, orders:218, color:"#10b981" },
  { channel:"Amazon",  revenue:72400, orders:187, color:"#f97316" },
  { channel:"eBay",    revenue:38600, orders:112, color:"#3b82f6" },
  { channel:"Walmart", revenue:31800, orders:83,  color:"#f59e0b" },
  { channel:"Direct",  revenue:21400, orders:56,  color:"#8b5cf6" },
];

const WAREHOUSE_STOCK = [
  { warehouse:"Hickory Main",   stock:1842, capacity:3000, value:198400, color:"#3b82f6" },
  { warehouse:"Charlotte Hub",  stock:624,  capacity:1500, value:67200,  color:"#10b981" },
  { warehouse:"Atlanta Depot",  stock:312,  capacity:1000, value:33600,  color:"#f59e0b" },
];

const TOP_TIRES = [
  { rank:1, name:"Michelin Defender 225/65R17",        brand:"Michelin",    sold:284, revenue:41180, margin:25.5, trend:"up"   },
  { rank:2, name:"Ironman All Country AT 265/70R17",   brand:"Ironman",     sold:312, revenue:30264, margin:15.2, trend:"up"   },
  { rank:3, name:"Goodyear Assurance 205/55R16",       brand:"Goodyear",    sold:251, revenue:30120, margin:19.8, trend:"down" },
  { rank:4, name:"BFGoodrich KO2 265/70R17",           brand:"BFGoodrich",  sold:198, revenue:41580, margin:24.1, trend:"up"   },
  { rank:5, name:"Hankook Kinergy 215/60R16",          brand:"Hankook",     sold:267, revenue:23496, margin:17.3, trend:"same" },
  { rank:6, name:"Continental CrossContact 235/55R18", brand:"Continental", sold:176, revenue:29040, margin:21.2, trend:"up"   },
  { rank:7, name:"Pirelli P Zero 255/40R19",           brand:"Pirelli",     sold:142, revenue:39760, margin:27.8, trend:"up"   },
  { rank:8, name:"Nexen N5000 Plus 225/50R17",         brand:"Nexen",       sold:198, revenue:14850, margin:13.1, trend:"down" },
];

const TOP_VENDORS = [
  { name:"National Tire Supply",  orders:201, volume:67800, rating:4.8, avgDelivery:"1.8d", returnRate:"0.5%", onTime:"97%" },
  { name:"Cleve Tire Wholesale",  orders:142, volume:48200, rating:4.6, avgDelivery:"2.1d", returnRate:"0.8%", onTime:"94%" },
  { name:"Vans Tire Pros",        orders:98,  volume:31500, rating:4.2, avgDelivery:"3.4d", returnRate:"1.2%", onTime:"88%" },
  { name:"Wholesale Tires Co",    orders:76,  volume:24100, rating:3.8, avgDelivery:"4.2d", returnRate:"2.1%", onTime:"81%" },
];

const LOW_STOCK = [
  { sku:"GE-BFG-KO2",      name:"BFGoodrich KO2 265/70R17",   stock:3,  reorder:20, vendor:"Cleve Tire",   daysLeft:2 },
  { sku:"GE-Michelin-123", name:"Michelin Defender 225/65R17", stock:8,  reorder:15, vendor:"National Tire",daysLeft:4 },
  { sku:"GE-Pirelli-321",  name:"Pirelli P Zero 255/40R19",    stock:11, reorder:12, vendor:"Vans Tire",    daysLeft:5 },
  { sku:"GE-Ironman-777",  name:"Ironman All Weather 215/55R17",stock:5, reorder:18, vendor:"National Tire",daysLeft:3 },
  { sku:"GE-Nexen-444",    name:"Nexen Roadian AT4 265/65R17", stock:7,  reorder:15, vendor:"Cleve Tire",   daysLeft:4 },
];

const PENDING_RETURNS = [
  { rma:"RMA-091234", order:"ORD-2026-0006", customer:"Amy Chen",     reason:"Defective product",  days:3, amount:388 },
  { rma:"RMA-091235", order:"ORD-2026-0011", customer:"Dan Foster",   reason:"Wrong item shipped", days:1, amount:560 },
  { rma:"RMA-091236", order:"ORD-2026-0015", customer:"Eva Martinez", reason:"Damaged in transit", days:5, amount:840 },
];

const FAILED_SYNCS = [
  { channel:"Walmart", sku:"GE-BFG-KO2",     issue:"Price update rejected — below MAP",  time:"2h ago" },
  { channel:"Amazon",  sku:"GE-Michelin-123", issue:"Listing suppressed — review image",  time:"4h ago" },
  { channel:"eBay",    sku:"GE-Pirelli-321",  issue:"Category mapping error",             time:"6h ago" },
];

const SHIPPING_DELAYS = [
  { order:"ORD-2026-0003", carrier:"FedEx", customer:"Tom Brown",  dest:"Miami, FL",   delay:"2 days", tracking:"748923479023" },
  { order:"ORD-2026-0009", carrier:"UPS",   customer:"Dan Foster", dest:"Phoenix, AZ", delay:"1 day",  tracking:"1Z999AA101234" },
];

const OPEN_BACKORDERS = [
  { order:"ORD-2026-0008", sku:"GE-Nexen-333",   name:"Nexen N5000 225/50R17",   customer:"Carol White", qty:4, days:3 },
  { order:"ORD-2026-0014", sku:"GE-Ironman-888", name:"Ironman RB-12 205/65R15", customer:"Greg Hill",   qty:4, days:1 },
];

// ── Activity feed — with navigation targets ───────────────────────────────────
const ACTIVITY_FEED = [
  { id:"1",  icon:"🛒", user:"James D.",  action:"New order received",          detail:"ORD-2026-0021 — $680",            time:"2 min ago",  navPage:"Orders"       },
  { id:"2",  icon:"📦", user:"Maria R.",  action:"Stock updated",               detail:"Michelin Defender: 24 → 20 units", time:"8 min ago",  navPage:"Manage Tires" },
  { id:"3",  icon:"✅", user:"System",    action:"Order shipped",               detail:"ORD-2026-0005 via FedEx",          time:"14 min ago", navPage:"Orders"       },
  { id:"4",  icon:"🔄", user:"System",    action:"Shopify sync complete",       detail:"1,204 products updated",           time:"30 min ago", navPage:"Inventory Sync"},
  { id:"5",  icon:"👤", user:"Sarah C.",  action:"Changed pricing rule",        detail:"Min margin raised to 22%",         time:"45 min ago", navPage:"Pricing Engine"},
  { id:"6",  icon:"⚠️", user:"System",    action:"Low stock alert",             detail:"BFGoodrich KO2 — 3 units left",   time:"1 hr ago",   navPage:"Manage Tires" },
  { id:"7",  icon:"↩️", user:"Tom B.",    action:"Return request submitted",    detail:"RMA-091236 — $840",               time:"2 hrs ago",  navPage:"Orders"       },
  { id:"8",  icon:"🔐", user:"Sarah C.",  action:"User permission changed",     detail:"Tom K. → Viewer role",            time:"3 hrs ago",  navPage:"Audit Logs"   },
  { id:"9",  icon:"🚚", user:"System",    action:"Shipment exception detected", detail:"ORD-2026-0003 — FedEx delay",     time:"4 hrs ago",  navPage:"Shipping Dashboard"},
  { id:"10", icon:"📥", user:"Maria R.",  action:"CSV import completed",        detail:"1,204 tires imported",            time:"5 hrs ago",  navPage:"Audit Logs"   },
];

const KPI_BY_PERIOD: Record<Period, Record<string, number>> = {
  today: { ordersToday:18, ordersWeek:94, ordersMonth:516, revenueToday:2840, revenueMonth:188000, grossProfit:47000, netProfit:31200, inventoryValue:299200, openBackorders:2, activeCustomers:5,   activeVendors:4 },
  week:  { ordersToday:94, ordersWeek:94, ordersMonth:516, revenueToday:18600,revenueMonth:188000, grossProfit:47000, netProfit:31200, inventoryValue:299200, openBackorders:2, activeCustomers:38,  activeVendors:4 },
  month: { ordersToday:516,ordersWeek:516,ordersMonth:516, revenueToday:188000,revenueMonth:188000,grossProfit:47000, netProfit:31200, inventoryValue:299200, openBackorders:2, activeCustomers:142, activeVendors:4 },
  custom:{ ordersToday:214,ordersWeek:214,ordersMonth:214, revenueToday:76400,revenueMonth:76400,  grossProfit:19100, netProfit:12700, inventoryValue:299200, openBackorders:2, activeCustomers:84,  activeVendors:4 },
};

const PERIOD_LABELS: Record<Period,string> = { today:"Today", week:"This Week", month:"This Month", custom:"Custom Range" };

const CHART_STYLE = {
  cartesian:{ strokeDasharray:"3 3", stroke:"hsl(var(--border))", opacity:0.4 },
  tooltip:{ contentStyle:{ backgroundColor:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:"12px" }},
  axis:{ fontSize:11, fill:"hsl(var(--muted-foreground))" },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, Icon, color, trend, trendValue, restricted }: {
  label:string; value:string|number; sub:string; Icon:React.ElementType;
  color:string; trend?:"up"|"down"|"neutral"; trendValue?:string; restricted?:boolean;
}) {
  if (restricted) return (
    <Card className="p-5 opacity-50 cursor-not-allowed">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`w-4 h-4 ${color}`}/>
      </div>
      <p className="text-2xl font-bold mt-2 text-muted-foreground">🔒 Hidden</p>
      <p className="text-xs text-muted-foreground mt-1">Requires Admin access</p>
    </Card>
  );
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <Icon className={`w-4 h-4 ${color}`}/>
      </div>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {trend==="up"   && <TrendingUp   className="w-3.5 h-3.5 text-green-500"/>}
        {trend==="down" && <TrendingDown className="w-3.5 h-3.5 text-red-500"/>}
        <p className={`text-xs ${trend==="up"?"text-green-600":trend==="down"?"text-red-500":"text-muted-foreground"}`}>
          {trendValue && <span className="font-medium">{trendValue} </span>}{sub}
        </p>
      </div>
    </Card>
  );
}

function SectionHeader({ title, sub }: { title:string; sub?:string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ExecutiveDashboard({ onNavigate }: ExecutiveDashboardProps) {
  const [period, setPeriod]       = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("2026-05-01");
  const [customTo,   setCustomTo]   = useState("2026-05-31");
  const [role]                    = useState<"Admin"|"Manager"|"Staff"|"Viewer">("Admin");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const kpi       = KPI_BY_PERIOD[period];
  const isManager = role === "Admin" || role === "Manager";

  const dailyData   = useMemo(()=>period==="today"?DAILY_SALES.slice(-1):period==="week"?DAILY_SALES.slice(-7):DAILY_SALES,[period]);
  const monthlyData = useMemo(()=>period==="today"||period==="week"?MONTHLY_REV.slice(-3):MONTHLY_REV,[period]);

  const refresh = useCallback(()=>{
    setRefreshing(true);
    setTimeout(()=>{ setRefreshing(false); setLastRefresh(new Date()); toast.success("Dashboard data refreshed"); },1200);
  },[]);

  const exportCSV = useCallback(()=>{
    const sections = [
      ["=== EXECUTIVE DASHBOARD EXPORT ==="],
      [`Period: ${PERIOD_LABELS[period]}`],
      [`Exported: ${new Date().toLocaleString()}`],
      [`Exported by: Sarah Chen (Admin)`],
      [""],["--- KPIs ---"],["Metric,Value"],
      [`Total Orders,${kpi.ordersMonth}`],[`Revenue,$${kpi.revenueMonth}`],
      [`Gross Profit,$${kpi.grossProfit}`],[`Net Profit,$${kpi.netProfit}`],
      [`Inventory Value,$${kpi.inventoryValue}`],
      [""],["--- TOP SELLING TIRES ---"],["Rank,Name,Brand,Units Sold,Revenue,Margin"],
      ...TOP_TIRES.map(t=>`${t.rank},${t.name},${t.brand},${t.sold},$${t.revenue},${t.margin}%`),
      [""],["--- TOP VENDORS ---"],["Name,Orders,Volume,Rating"],
      ...TOP_VENDORS.map(v=>`${v.name},${v.orders},$${v.volume},${v.rating}`),
      [""],["--- LOW STOCK ALERT ---"],["SKU,Name,Stock,Reorder Point,Days Left"],
      ...LOW_STOCK.map(l=>`${l.sku},${l.name},${l.stock},${l.reorder},${l.daysLeft}`),
    ];
    const blob = new Blob([sections.flat().join("\n")],{type:"text/csv"});
    const a = document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=`executive-dashboard-${period}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Dashboard exported to CSV — audit logged");
  },[period,kpi]);

  const fmt$ = (n:number) => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;

  // Navigate to another page — uses prop callback or falls back to toast
  const goTo = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      toast.info(`Navigate to: ${page}`);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600"/>Executive Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Last updated: {lastRefresh.toLocaleTimeString()}
              {refreshing && <span className="ml-2 text-blue-500 animate-pulse">● Refreshing...</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(["today","week","month"] as Period[]).map(p=>(
                <Button key={p} size="sm"
                  className={`h-7 text-xs px-3 transition-all ${period===p?"bg-background shadow-sm text-foreground":"text-muted-foreground hover:text-foreground bg-transparent hover:bg-background/50"}`}
                  onClick={()=>setPeriod(p)}>{PERIOD_LABELS[p]}</Button>
              ))}
              <Button size="sm"
                className={`h-7 text-xs px-3 transition-all ${period==="custom"?"bg-background shadow-sm text-foreground":"text-muted-foreground hover:text-foreground bg-transparent hover:bg-background/50"}`}
                onClick={()=>setPeriod("custom")}>Custom</Button>
            </div>
            {period==="custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <Input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} className="h-8 text-xs w-36"/>
                <span className="text-muted-foreground text-xs">to</span>
                <Input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} className="h-8 text-xs w-36"/>
              </div>
            )}
            <Badge className={`text-xs ${role==="Admin"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>{role}</Badge>
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing?"animate-spin":""}`}/>Refresh
            </Button>
            {isManager && (
              <Button size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1"/>Export CSV</Button>
            )}
          </div>
        </div>

        {/* KPI Row 1 — Orders */}
        <div>
          <SectionHeader title="Orders" sub={`Metrics for ${PERIOD_LABELS[period].toLowerCase()}`}/>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Orders Today"    value={kpi.ordersToday}  sub="vs yesterday"      Icon={ShoppingCart} color="text-blue-600"   trend="up"   trendValue="+12%"/>
            <KpiCard label="Orders (Week)"   value={kpi.ordersWeek}   sub="this week"         Icon={ShoppingCart} color="text-indigo-600" trend="up"   trendValue="+8%"/>
            <KpiCard label="Orders (Month)"  value={kpi.ordersMonth}  sub="this month"        Icon={ShoppingCart} color="text-violet-600" trend="up"   trendValue="+15%"/>
            <KpiCard label="Open Backorders" value={kpi.openBackorders} sub="need attention"  Icon={AlertTriangle} color="text-red-600"  trend="neutral"/>
            <KpiCard label="Active Customers"value={kpi.activeCustomers} sub="placed orders"  Icon={Users}        color="text-cyan-600"   trend="up"   trendValue="+6%"/>
            <KpiCard label="Active Vendors"  value={kpi.activeVendors} sub="supplying stock"  Icon={Building2}    color="text-teal-600"   trend="neutral"/>
          </div>
        </div>

        {/* KPI Row 2 — Revenue */}
        <div>
          <SectionHeader title="Revenue & Profitability"/>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard label="Revenue Today"  value={fmt$(kpi.revenueToday)}  sub="vs yesterday"    Icon={DollarSign} color="text-green-600"   trend="up" trendValue="+9%"/>
            <KpiCard label="Revenue (Month)"value={fmt$(kpi.revenueMonth)}  sub="this month"      Icon={DollarSign} color="text-emerald-600" trend="up" trendValue="+12%"/>
            <KpiCard label="Gross Profit"   value={fmt$(kpi.grossProfit)}   sub={`${Math.round(kpi.grossProfit/kpi.revenueMonth*100)}% margin`} Icon={TrendingUp} color="text-lime-600" trend="up" trendValue="+3%"/>
            <KpiCard label="Net Profit"     value={fmt$(kpi.netProfit)}     sub="after all costs" Icon={Zap}        color="text-amber-600"   trend="up" trendValue="+5%" restricted={!isManager}/>
            <KpiCard label="Inventory Value"value={fmt$(kpi.inventoryValue)} sub="all warehouses" Icon={Warehouse}  color="text-purple-600"  trend="neutral"/>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <SectionHeader title="Daily Sales Trend" sub={`Last ${dailyData.length} days`}/>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_STYLE.cartesian}/>
                <XAxis dataKey="day" tick={CHART_STYLE.axis} tickLine={false} interval={Math.floor(dailyData.length/6)}/>
                <YAxis tick={CHART_STYLE.axis} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                <Tooltip {...CHART_STYLE.tooltip} formatter={(v:number,n:string)=>[`$${v.toLocaleString()}`,n]}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" name="Revenue" dot={false} activeDot={{r:4}}/>
                <Area type="monotone" dataKey="profit"  stroke="#10b981" strokeWidth={2} fill="url(#profGrad)" name="Profit" dot={false} activeDot={{r:4}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <SectionHeader title="Monthly Revenue vs Target" sub={`${monthlyData.length}-month view`}/>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid {...CHART_STYLE.cartesian}/>
                <XAxis dataKey="month" tick={CHART_STYLE.axis} tickLine={false}/>
                <YAxis tick={CHART_STYLE.axis} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                <Tooltip {...CHART_STYLE.tooltip} formatter={(v:number,n:string)=>[`$${v.toLocaleString()}`,n]}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[3,3,0,0]}/>
                <Bar dataKey="target"  fill="#e2e8f0" name="Target"  radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <SectionHeader title="Order Status" sub="Current distribution"/>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ORDER_STATUS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {ORDER_STATUS_DATA.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip formatter={(v:number,n:string)=>[`${v} orders`,n]}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {ORDER_STATUS_DATA.map(s=>(
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:s.color}}/>
                  <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                  <span className="text-xs font-bold ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <SectionHeader title="Revenue by Marketplace"/>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MARKETPLACE_REVENUE} layout="vertical" margin={{left:8}}>
                <CartesianGrid {...CHART_STYLE.cartesian} horizontal={false}/>
                <XAxis type="number" tick={CHART_STYLE.axis} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                <YAxis type="category" dataKey="channel" tick={CHART_STYLE.axis} tickLine={false} width={50}/>
                <Tooltip {...CHART_STYLE.tooltip} formatter={(v:number)=>[`$${v.toLocaleString()}`,"Revenue"]}/>
                <Bar dataKey="revenue" radius={[0,4,4,0]}>
                  {MARKETPLACE_REVENUE.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <SectionHeader title="Warehouse Stock"/>
            <div className="space-y-4 mt-2">
              {WAREHOUSE_STOCK.map(wh=>(
                <div key={wh.warehouse} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-xs">{wh.warehouse}</span>
                    <span className="text-muted-foreground text-xs">{wh.stock.toLocaleString()} / {wh.capacity.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 rounded-full transition-all" style={{width:`${(wh.stock/wh.capacity)*100}%`,backgroundColor:wh.color}}/>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round((wh.stock/wh.capacity)*100)}% used</span>
                    <span className="font-medium">${wh.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-3"/>
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="text-green-600">${WAREHOUSE_STOCK.reduce((s,w)=>s+w.value,0).toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Top Selling Tires</h3>
                <p className="text-xs text-muted-foreground">Ranked by units sold — {PERIOD_LABELS[period]}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{TOP_TIRES.length} products</Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Tire</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-center w-16">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TOP_TIRES.map(t=>(
                    <TableRow key={t.rank} className="hover:bg-muted/20">
                      <TableCell>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${t.rank<=3?"bg-yellow-100 text-yellow-700":"bg-muted text-muted-foreground"}`}>{t.rank}</span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm leading-tight">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.brand}</p>
                      </TableCell>
                      <TableCell className="text-right font-bold">{t.sold}</TableCell>
                      <TableCell className="text-right font-semibold text-green-700">${t.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`text-xs ${t.margin>=20?"bg-green-100 text-green-700":"bg-orange-100 text-orange-700"}`}>{t.margin}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {t.trend==="up"   && <TrendingUp   className="w-4 h-4 text-green-500 mx-auto"/>}
                        {t.trend==="down" && <TrendingDown className="w-4 h-4 text-red-400 mx-auto"/>}
                        {t.trend==="same" && <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
          <Card>
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-sm">Top Vendors</h3>
              <p className="text-xs text-muted-foreground">By purchase volume</p>
            </div>
            <div className="divide-y divide-border">
              {TOP_VENDORS.map((v,i)=>(
                <div key={v.name} className="p-3 hover:bg-muted/20">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{v.name}</p>
                      <div className="grid grid-cols-2 gap-x-3 mt-1 text-xs text-muted-foreground">
                        <span>Orders: <strong className="text-foreground">{v.orders}</strong></span>
                        <span>Vol: <strong className="text-foreground">${(v.volume/1000).toFixed(0)}K</strong></span>
                        <span>Delivery: <strong className="text-foreground">{v.avgDelivery}</strong></span>
                        <span>Returns: <strong className="text-foreground">{v.returnRate}</strong></span>
                        <span>On-time: <strong className="text-green-600">{v.onTime}</strong></span>
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/><strong className="text-foreground">{v.rating}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Low Stock Table */}
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500"/>Low Stock Products</h3>
              <p className="text-xs text-muted-foreground">Items below reorder point — immediate action required</p>
            </div>
            <Button size="sm" className="text-xs h-7" onClick={()=>toast.success("Purchase orders created!")}>
              <Package className="w-3.5 h-3.5 mr-1"/>Create All POs
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead><TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Days Left</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LOW_STOCK.map(l=>(
                  <TableRow key={l.sku} className="bg-red-50/40 hover:bg-red-50/70">
                    <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                    <TableCell className="font-medium text-sm">{l.name}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">{l.stock}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{l.reorder}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{l.vendor}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Badge className={`text-xs ${l.daysLeft<=2?"bg-red-100 text-red-700":"bg-yellow-100 text-yellow-700"}`}>{l.daysLeft}d left</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={()=>toast.success(`PO created — ${l.name}`)}>Create PO</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Returns */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4 text-orange-500"/>Pending Returns</h3>
              <Badge variant="destructive" className="text-xs">{PENDING_RETURNS.length}</Badge>
            </div>
            <div className="divide-y divide-border">
              {PENDING_RETURNS.map(r=>(
                <div key={r.rma} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-xs font-bold text-orange-600">{r.rma}</p>
                      <p className="text-xs text-muted-foreground">{r.customer}</p>
                      <p className="text-xs text-muted-foreground">{r.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">${r.amount}</p>
                      <p className="text-xs text-muted-foreground">{r.days}d ago</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs text-orange-600 hover:text-orange-700" onClick={()=>goTo("Orders")}>
                View All Returns <ArrowRight className="w-3 h-3 ml-1"/>
              </Button>
            </div>
          </Card>

          {/* Failed Syncs */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500"/>Failed Syncs</h3>
              <Badge variant="destructive" className="text-xs">{FAILED_SYNCS.length}</Badge>
            </div>
            <div className="divide-y divide-border">
              {FAILED_SYNCS.map((s,i)=>(
                <div key={i} className="p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{s.channel}</Badge>
                    <div>
                      <p className="font-mono text-xs">{s.sku}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.issue}</p>
                      <p className="text-xs text-muted-foreground">{s.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs text-red-600 hover:text-red-700" onClick={()=>goTo("Inventory Sync")}>
                Fix Sync Issues <ArrowRight className="w-3 h-3 ml-1"/>
              </Button>
            </div>
          </Card>

          {/* Shipping Delays */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-yellow-500"/>Shipping Delays</h3>
              <Badge variant="secondary" className="text-xs">{SHIPPING_DELAYS.length}</Badge>
            </div>
            <div className="divide-y divide-border">
              {SHIPPING_DELAYS.map(s=>(
                <div key={s.order} className="p-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold">{s.order}</p>
                      <p className="text-xs text-muted-foreground">{s.customer}</p>
                      <p className="text-xs text-muted-foreground">{s.dest}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="text-xs bg-yellow-100 text-yellow-700">{s.delay}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{s.carrier}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs text-yellow-600 hover:text-yellow-700" onClick={()=>goTo("Shipping Dashboard")}>
                View Shipments <ArrowRight className="w-3 h-3 ml-1"/>
              </Button>
            </div>
          </Card>

          {/* Open Backorders */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500"/>Open Backorders</h3>
              <Badge variant="destructive" className="text-xs">{OPEN_BACKORDERS.length}</Badge>
            </div>
            <div className="divide-y divide-border">
              {OPEN_BACKORDERS.map(b=>(
                <div key={b.order} className="p-3">
                  <p className="font-mono text-xs font-bold">{b.order}</p>
                  <p className="text-xs font-medium mt-0.5 truncate">{b.name}</p>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{b.customer}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge className="text-xs bg-red-100 text-red-700">×{b.qty}</Badge>
                      <Badge variant="outline" className="text-xs">{b.days}d</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs text-red-600 hover:text-red-700" onClick={()=>goTo("Orders")}>
                Manage Backorders <ArrowRight className="w-3 h-3 ml-1"/>
              </Button>
            </div>
          </Card>
        </div>

        {/* ── ACTIVITY FEED ── */}
        <Card>
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500"/>Activity Feed
              </h3>
              <p className="text-xs text-muted-foreground">Recent orders, inventory changes and user actions</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {ACTIVITY_FEED.map(a=>(
              <div key={a.id}
                className="flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={()=>goTo(a.navPage)}>
                <span className="text-lg shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{a.user}</span>
                    <span className="text-sm text-foreground">{a.action}</span>
                    <span className="text-sm text-muted-foreground">— {a.detail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
              </div>
            ))}
          </div>

          {/* ── VIEW FULL AUDIT LOG BUTTON (the red-circled one) ── */}
          <div className="p-4 border-t border-border flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium flex items-center gap-2 px-6 py-2 rounded-lg transition-all"
              onClick={() => goTo("Audit Logs")}
            >
              <Shield className="w-4 h-4"/>
              View Full Audit Log
              <ArrowRight className="w-4 h-4"/>
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
