import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart, Package, TrendingUp, TrendingDown, AlertTriangle,
  Clock, CheckCircle2, Truck, RotateCcw, ShieldAlert, Activity,
  Database, calender, Globe, Users, Zap, Bell, RefreshCw, ChevronDown,
  Flame, Archive, ArrowRight, Store, CircleDot,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertLevel = "critical" | "warning" | "info";
type SyncStatus = "synced" | "delayed" | "failed";
type SystemStatus = "online" | "active" | "partial" | "offline";
type OrderFilter = "all" | "pending" | "backorders" | "errors" | "highvalue";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const last30Days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 4, 5 + i);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});

const revenueData = last30Days.map((date, i) => ({
  date,
  revenue: Math.round(10000 + Math.sin(i / 3) * 2000 + i * 280 + Math.random() * 800),
}));

const ordersData = last30Days.map((date, i) => ({
  date,
  orders: Math.round(90 + Math.sin(i / 2) * 20 + i * 1.8 + Math.random() * 15),
}));

const operationsKPIs = [
  { label: "Orders today",    value: "145",     change: "+12% vs yesterday", positive: true,  icon: ShoppingCart, color: "#378ADD", bg: "#E6F1FB" },
  { label: "Pending",         value: "23",      change: "Needs action",      positive: false, icon: Clock,        color: "#EF9F27", bg: "#FAEEDA" },
  { label: "Processing",      value: "32",      change: "On track",          positive: true,  icon: RefreshCw,    color: "#7F77DD", bg: "#EEEDFE" },
  { label: "Shipped today",   value: "112",     change: "+8% vs yesterday",  positive: true,  icon: Truck,        color: "#1D9E75", bg: "#E1F5EE" },
  { label: "Backorders",      value: "14",      change: "Attention needed",  positive: false, icon: AlertTriangle,color: "#E24B4A", bg: "#FCEBEB" },
  { label: "Revenue today",   value: "$18,250", change: "+20% vs yesterday", positive: true,  icon: TrendingUp,   color: "#639922", bg: "#EAF3DE" },
];

const inventoryKPIs = [
  { label: "Tires in stock",   value: "12,847", change: "+342 this week",  positive: true,  icon: Package,       color: "#378ADD", bg: "#E6F1FB" },
  { label: "Inventory value",  value: "$1.2M",  change: "Stable",          positive: true,  icon: TrendingUp,    color: "#1D9E75", bg: "#E1F5EE" },
  { label: "Low stock SKUs",   value: "47",     change: "Reorder soon",    positive: false, icon: AlertTriangle, color: "#EF9F27", bg: "#FAEEDA" },
  { label: "Out of stock",     value: "12",     change: "Critical",        positive: false, icon: ShieldAlert,   color: "#E24B4A", bg: "#FCEBEB" },
  { label: "Returns open",     value: "8",      change: "In progress",     positive: null,  icon: RotateCcw,     color: "#7F77DD", bg: "#EEEDFE" },
];

const orderPipeline = [
  { stage: "New orders",  count: 15,  total: 967, color: "#7F77DD" },
  { stage: "Processing",  count: 32,  total: 967, color: "#EF9F27" },
  { stage: "Picking",     count: 10,  total: 967, color: "#378ADD" },
  { stage: "Packed",      count: 12,  total: 967, color: "#7F77DD" },
  { stage: "Shipped",     count: 58,  total: 967, color: "#1D9E75" },
  { stage: "Delivered",   count: 840, total: 967, color: "#639922" },
];

const shippingData = [
  { stage: "In transit",     count: 82,  color: "#378ADD" },
  { stage: "Delivered",      count: 145, color: "#639922" },
  { stage: "Delayed",        count: 5,   color: "#EF9F27" },
  { stage: "Returned",       count: 3,   color: "#7F77DD" },
  { stage: "Failed delivery",count: 1,   color: "#E24B4A" },
];

const inventoryHealth = [
  { label: "Low stock items",    value: "47 SKUs", status: "warning", icon: AlertTriangle, statusLabel: "Reorder"  },
  { label: "Dead inventory",     value: "23 SKUs", status: "neutral", icon: Archive,       statusLabel: "Review"   },
  { label: "Fast-moving items",  value: "38 SKUs", status: "success", icon: Flame,         statusLabel: "Healthy"  },
  { label: "Reorder required",   value: "12 SKUs", status: "danger",  icon: RefreshCw,     statusLabel: "Urgent"   },
];

const warehouses = [
  { name: "Texas warehouse",        pct: 88, color: "#378ADD" },
  { name: "Georgia warehouse",      pct: 74, color: "#7F77DD" },
  { name: "California warehouse",   pct: 61, color: "#1D9E75" },
  { name: "Fulfillment accuracy",   pct: 99, color: "#639922", label: "99.2%" },
];

const marketplaces: { name: string; lastSync: string; status: SyncStatus }[] = [
  { name: "Shopify",  lastSync: "2m ago",  status: "synced"  },
  { name: "Amazon",   lastSync: "5m ago",  status: "synced"  },
  { name: "eBay",     lastSync: "18m ago", status: "delayed" },
  { name: "Walmart",  lastSync: "1m ago",  status: "synced"  },
];

const vendorStats = [
  { label: "Active vendors",      value: "28",  statusLabel: "23 synced",   status: "success" },
  { label: "Vendor errors",       value: "28",  statusLabel: "Needs review",status: "danger"  },
  { label: "Pending responses",   value: "6",   statusLabel: "Awaiting",    status: "warning" },
  { label: "Sync failures",       value: "3",   statusLabel: "Fix required",status: "danger"  },
];

const alerts: { text: string; level: AlertLevel }[] = [
  { text: "47 low stock products — reorder required immediately",          level: "critical" },
  { text: "14 backordered orders — customers waiting",                     level: "critical" },
  { text: "5 delayed shipments — carrier issue detected",                  level: "critical" },
  { text: "3 failed marketplace syncs — eBay, Walmart",                    level: "warning"  },
  { text: "2 inventory mismatches detected across warehouses",             level: "warning"  },
  { text: "1 vendor API failure — Atlantic Tire connection timeout",       level: "info"     },
];

const recentOrders = [
  { id: "291691957", customer: "Randy Thompson", product: "Cooper Cobra Radial P245/60R15",          vendor: "Atlantic Tire",   status: "Vendor selected",  shipment: "In transit",  total: "$189.99", statusType: "info",    shipType: "success" },
  { id: "291656619", customer: "Vansh Sehgal",   product: "Pirelli Scorpion 235/55R19",              vendor: "GE Tire Hickory", status: "Inventory error",  shipment: "Pending",     total: "$200.24", statusType: "danger",  shipType: "neutral" },
  { id: "291656618", customer: "James Purdom",   product: "Continental DWS06 245/40ZR19",            vendor: "Hesselbein",      status: "Vendor selected",  shipment: "Shipped",     total: "$242.60", statusType: "info",    shipType: "success" },
  { id: "291655579", customer: "Patricia Lopez", product: "Pirelli Scorpion STR 245/50R20",          vendor: "Gateway Ohio",    status: "Vendor selected",  shipment: "In transit",  total: "$138.99", statusType: "info",    shipType: "success" },
  { id: "291620409", customer: "Canyon Eggar",   product: "Cooper Discoverer LT275/70R18",           vendor: "Kerle Tire",      status: "Vendor selected",  shipment: "Delayed",     total: "$313.00", statusType: "info",    shipType: "warning" },
];

const errorCenter = [
  { label: "Product errors",    count: 205, pct: 55, color: "#E24B4A", icon: ShieldAlert },
  { label: "Inventory errors",  count: 143, pct: 38, color: "#7F77DD", icon: Package     },
  { label: "Vendor errors",     count: 28,  pct: 8,  color: "#EF9F27", icon: Users       },
  { label: "Shipping errors",   count: 5,   pct: 2,  color: "#EF9F27", icon: Truck       },
  { label: "Marketplace errors",count: 3,   pct: 1,  color: "#378ADD", icon: Globe       },
];

const systemHealth: { label: string; status: SystemStatus; icon: React.ElementType }[] = [
  { label: "Database",          status: "online",   icon: Database  },
  { label: "Vendor APIs",       status: "active",   icon: Users     },
  { label: "Inventory sync",    status: "active",   icon: Package   },
  { label: "Marketplace APIs",  status: "partial",  icon: Globe     },
  { label: "Shipping APIs",     status: "active",   icon: Truck     },
];

// ─── Helper components ────────────────────────────────────────────────────────

const statusPillClasses: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger:  "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

function Pill({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusPillClasses[status] ?? statusPillClasses.neutral}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
      <div className="h-px flex-1 bg-slate-100" />
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{children}</p>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, badge, badgeStatus = "info" }: {
  icon: React.ElementType; title: string; badge?: string; badgeStatus?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        {title}
      </h3>
      {badge && <Pill status={badgeStatus}>{badge}</Pill>}
    </div>
  );
}

const syncColors: Record<SyncStatus, string> = {
  synced:  "success",
  delayed: "warning",
  failed:  "danger",
};

const syncLabels: Record<SyncStatus, string> = {
  synced:  "Synced",
  delayed: "Delayed",
  failed:  "Failed",
};

const systemColors: Record<SystemStatus, string> = {
  online:  "bg-emerald-400",
  active:  "bg-emerald-400",
  partial: "bg-amber-400",
  offline: "bg-red-400",
};

const systemPills: Record<SystemStatus, string> = {
  online:  "success",
  active:  "success",
  partial: "warning",
  offline: "danger",
};

const systemLabels: Record<SystemStatus, string> = {
  online:  "Online",
  active:  "Active",
  partial: "Partial",
  offline: "Offline",
};

const alertBg: Record<AlertLevel, string> = {
  critical: "bg-red-50 border-l-2 border-red-400",
  warning:  "bg-amber-50 border-l-2 border-amber-400",
  info:     "bg-blue-50 border-l-2 border-blue-300",
};

const alertDot: Record<AlertLevel, string> = {
  critical: "bg-red-500",
  warning:  "bg-amber-500",
  info:     "bg-blue-400",
};

const alertLabel: Record<AlertLevel, string> = {
  critical: "danger",
  warning:  "warning",
  info:     "info",
};

const alertLabelText: Record<AlertLevel, string> = {
  critical: "Critical",
  warning:  "Warning",
  info:     "Info",
};

const filterLabels: Record<OrderFilter, string> = {
  all:       "All",
  pending:   "Pending",
  backorders:"Backorders",
  errors:    "Errors",
  highvalue: "High value",
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, prefix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-slate-800">{prefix}{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function OperationsDashboard() {
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all")       return recentOrders;
    if (orderFilter === "pending")   return recentOrders.filter(o => o.shipment === "Pending");
    if (orderFilter === "backorders")return recentOrders.filter(o => o.status.toLowerCase().includes("backorder"));
    if (orderFilter === "errors")    return recentOrders.filter(o => o.statusType === "danger");
    if (orderFilter === "highvalue") return recentOrders.filter(o => parseFloat(o.total.replace("$","")) > 200);
    return recentOrders;
  }, [orderFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/20 font-sans">
      <div className="max-w-screen-2xl mx-auto p-5 space-y-1">

        {/* ── Header ── */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Real-time operations, inventory &amp; fulfillment monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Bell className="w-3.5 h-3.5" />
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">6</span>
            </button>
            <button className="flex items-center gap-2 text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Today — Jun 4, 2026
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ── Row 1: Operations KPIs ── */}
        <SectionLabel>Critical operations KPIs</SectionLabel>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {operationsKPIs.map(k => (
            <div
              key={k.label}
              className="relative bg-white border border-slate-100 rounded-xl p-4 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: k.color }} />
              <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-10" style={{ background: k.color }} />
              <div className="flex items-start justify-between mb-2 pl-2">
                <p className="text-xs text-slate-500 leading-tight">{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800 pl-2 mb-1">{k.value}</p>
              <div className={`flex items-center gap-1 text-xs pl-2 ${k.positive === true ? "text-emerald-600" : k.positive === false ? "text-red-500" : "text-slate-400"}`}>
                {k.positive === true  && <TrendingUp className="w-3 h-3" />}
                {k.positive === false && <TrendingDown className="w-3 h-3" />}
                {k.change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Inventory KPIs ── */}
        <SectionLabel>Inventory &amp; warehouse KPIs</SectionLabel>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {inventoryKPIs.map(k => (
            <div
              key={k.label}
              className="relative bg-white border border-slate-100 rounded-xl p-4 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: k.color }} />
              <div className="flex items-start justify-between mb-2 pl-2">
                <p className="text-xs text-slate-500 leading-tight">{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800 pl-2 mb-1">{k.value}</p>
              <div className={`flex items-center gap-1 text-xs pl-2 ${k.positive === true ? "text-emerald-600" : k.positive === false ? "text-red-500" : "text-slate-400"}`}>
                {k.positive === true  && <TrendingUp className="w-3 h-3" />}
                {k.positive === false && <TrendingDown className="w-3 h-3" />}
                {k.change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 3: Pipeline + Shipping ── */}
        <SectionLabel>Order pipeline &amp; shipping</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardShell>
            <CardHeader icon={CheckCircle2} title="Order pipeline" badge="967 total" badgeStatus="info" />
            <div className="px-4 py-3 space-y-2">
              {orderPipeline.map(p => (
                <div key={p.stage} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-xs text-slate-500 w-24 shrink-0">{p.stage}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max((p.count / p.total) * 100, 1)}%`, background: p.color }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{p.count}</span>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell>
            <CardHeader icon={Truck} title="Shipping dashboard" badge="236 active" badgeStatus="success" />
            <div className="px-4 py-3 space-y-2">
              {shippingData.map(s => (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-slate-500 w-28 shrink-0">{s.stage}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((s.count / 145) * 100, 1)}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </CardShell>
        </div>

        {/* ── Row 4: Charts ── */}
        <SectionLabel>Sales analytics — last 30 days</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardShell>
            <CardHeader icon={TrendingUp} title="Revenue trend" />
            <div className="px-4 pt-2 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-0.5 rounded-full inline-block bg-blue-500" />Revenue
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={36} />
                  <Tooltip content={<ChartTooltip prefix="$" />} />
                  <Line type="monotone" dataKey="revenue" stroke="#378ADD" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#378ADD" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardShell>

          <CardShell>
            <CardHeader icon={ShoppingCart} title="Orders trend" />
            <div className="px-4 pt-2 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-violet-400" />Orders
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ordersData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="orders" fill="#7F77DD" radius={[2, 2, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardShell>
        </div>

        {/* ── Row 5: Inventory Health + Warehouse ── */}
        <SectionLabel>Inventory health &amp; warehouse performance</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardShell>
            <CardHeader icon={Package} title="Inventory health" />
            <div className="divide-y divide-slate-50">
              {inventoryHealth.map(item => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-3.5 h-3.5 ${item.status === "danger" ? "text-red-400" : item.status === "warning" ? "text-amber-400" : item.status === "success" ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className="text-xs text-slate-600">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{item.value}</span>
                    <Pill status={item.status}>{item.statusLabel}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell>
            <CardHeader icon={Activity} title="Warehouse performance" />
            <div className="divide-y divide-slate-50">
              {warehouses.map(w => (
                <div key={w.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs text-slate-600 w-40 shrink-0">{w.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${w.pct}%`, background: w.color }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-12 text-right">{w.label ?? `${w.pct}%`}</span>
                  <Pill status="success">Active</Pill>
                </div>
              ))}
            </div>
          </CardShell>
        </div>

        {/* ── Row 6: Marketplace + Vendor ── */}
        <SectionLabel>Marketplace health &amp; vendor performance</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardShell>
            <CardHeader icon={Globe} title="Marketplace health" />
            <div className="divide-y divide-slate-50">
              {marketplaces.map(m => (
                <div key={m.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-700 font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Last sync: {m.lastSync}</span>
                    <Pill status={syncColors[m.status]}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.status === "synced" ? "bg-emerald-500" : m.status === "delayed" ? "bg-amber-500" : "bg-red-500"}`} />
                      {syncLabels[m.status]}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell>
            <CardHeader icon={Users} title="Vendor performance" />
            <div className="divide-y divide-slate-50">
              {vendorStats.map(v => (
                <div key={v.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-600">{v.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{v.value}</span>
                    <Pill status={v.status}>{v.statusLabel}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </CardShell>
        </div>

        {/* ── Row 7: Alert Center ── */}
        <SectionLabel>Alert center</SectionLabel>
        <CardShell>
          <CardHeader icon={Bell} title="Alert center" badge={`${alerts.length} active`} badgeStatus="danger" />
          <div className="divide-y divide-slate-50">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${alertBg[a.level]}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${alertDot[a.level]}`} />
                <span className="text-xs text-slate-700 flex-1">{a.text}</span>
                <Pill status={alertLabel[a.level]}>{alertLabelText[a.level]}</Pill>
                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </CardShell>

        {/* ── Row 8: Recent Orders ── */}
        <SectionLabel>Recent orders</SectionLabel>
        <CardShell>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />Recent orders
            </h3>
            <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {/* Filter bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 flex-wrap">
            {(Object.keys(filterLabels) as OrderFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${orderFilter === f ? "bg-blue-50 text-blue-700 border-blue-200 font-medium" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Order ID","Customer","Product","Vendor","Status","Shipment","Total"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-xs">No orders match this filter</td></tr>
                ) : filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">{o.id}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{o.customer}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{o.product}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{o.vendor}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><Pill status={o.statusType}>{o.status}</Pill></td>
                    <td className="px-4 py-3 whitespace-nowrap"><Pill status={o.shipType}>{o.shipment}</Pill></td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{o.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardShell>

        {/* ── Row 9: Error Center + System Health ── */}
        <SectionLabel>Error center &amp; system health</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
          <CardShell>
            <CardHeader icon={ShieldAlert} title="Error center" badge="376 total" badgeStatus="danger" />
            <div className="divide-y divide-slate-50">
              {errorCenter.map(e => (
                <div key={e.label} className="flex items-center gap-3 px-4 py-3">
                  <e.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-600 w-36">{e.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(e.pct, 1)}%`, background: e.color }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{e.count}</span>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell>
            <CardHeader icon={Zap} title="System health" badge="All systems go" badgeStatus="success" />
            <div className="divide-y divide-slate-50">
              {systemHealth.map(s => (
                <div key={s.label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <s.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600">{s.label}</span>
                  </div>
                  <Pill status={systemPills[s.status]}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemColors[s.status]}`} />
                    {systemLabels[s.status]}
                  </Pill>
                </div>
              ))}
            </div>
          </CardShell>
        </div>

      </div>
    </div>
  );
}
