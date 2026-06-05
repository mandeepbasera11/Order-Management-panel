import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  DollarSign, Package, ShoppingCart, AlertTriangle, Clock, CheckCircle2,
  ShieldAlert, Users, ShoppingBag, Activity, TrendingUp, Zap, BarChart3,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { SalesChart, CategoryChart } from "./Charts";
import { DateRangePicker } from "./DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// ─── Data ─────────────────────────────────────────────────────────────────────

const orderKPIs = [
  {
    label: "Tires in Stock",
    value: "12,847",
    change: "+342 units this week",
    changeType: "positive" as const,
    icon: Package,
    gradient: "from-blue-400 to-indigo-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
     label: "Tires Sold (MTD)",
    value: "3,128",
    change: "+22.6% from last month",
    changeType: "positive" as const,
    icon: ShoppingCart,
    gradient: "from-cyan-400 to-sky-600",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
     label: "Low Stock SKUs",
    value: "47",
    change: "Needs reorder",
    changeType: "negative" as const,
    icon: AlertTriangle,
    gradient: "from-rose-400 to-red-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
{
    label: "Avg. Sale Price",
    value: "$142.30",
    change: "+4.1% vs last month",
    changeType: "positive" as const,
    icon: DollarSign,
    gradient: "from-emerald-400 to-teal-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    label: "Total Orders Pending",
    value: "0",
    change: "+12% from last month",
    positive: true,
    icon: Clock,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    valueCl: "text-violet-900",
  },
  {
    label: "Vendor Selected",
    value: "283",
    change: "+8% from last month",
    positive: true,
    icon: CheckCircle2,
    gradient: "from-sky-500 to-blue-600",
    lightBg: "bg-sky-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    valueCl: "text-sky-900",
  },
  {
    label: "Total Orders",
    value: "659",
    change: "+15% from last month",
    positive: true,
    icon: ShoppingBag,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    valueCl: "text-emerald-900",
  },
  {
    label: "Total Revenue",
    value: "$156,791.5",
    change: "+20% from last month",
    positive: true,
    icon: DollarSign,
    gradient: "from-orange-500 to-amber-500",
    lightBg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    valueCl: "text-orange-900",
  },
];

const errorStats = [
  {
    label: "Product Errors",
    value: 205,
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    valueColor: "text-rose-700",
    iconColor: "text-rose-400",
    barColor: "bg-rose-400",
    pct: 55,
  },
  {
    label: "Vendor Errors",
    value: 28,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    valueColor: "text-amber-700",
    iconColor: "text-amber-400",
    barColor: "bg-amber-400",
    pct: 8,
  },
  {
    label: "Inventory Errors",
    value: 143,
    gradient: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    valueColor: "text-purple-700",
    iconColor: "text-purple-400",
    barColor: "bg-purple-400",
    pct: 38,
  },
];

const recentOrders = [
  { id: "291691957", customer: "Randy Thompson",  product: "Cooper Cobra Radial G/T All-Season P245/60R15 100T Tire",                               price: "$189.99", status: "Vendor Selected",  pill: "bg-blue-100 text-blue-700 border border-blue-200",    dot: "bg-blue-400"  },
  { id: "291656619", customer: "Vansh Sehgal",    product: "Pirelli Scorpion All Season Plus 3 All Season 235/55R19 105V XL SUV/Crossover Tire",   price: "$200.24", status: "Inventory Error",  pill: "bg-rose-100 text-rose-700 border border-rose-200",    dot: "bg-rose-400"  },
  { id: "291656618", customer: "James Purdom",    product: "Continental ExtremeContact DWS06 PLUS UHP All Season 245/40ZR19 98Y XL Passenger Tire",price: "$242.60", status: "Vendor Selected",  pill: "bg-blue-100 text-blue-700 border border-blue-200",    dot: "bg-blue-400"  },
  { id: "291655579", customer: "Patricia Lopez",  product: "Pirelli Scorpion STR All Season 245/50R20 102H Light Truck Tire",                       price: "$138.99", status: "Vendor Selected",  pill: "bg-blue-100 text-blue-700 border border-blue-200",    dot: "bg-blue-400"  },
  { id: "291620409", customer: "Canyon Eggar",    product: "Cooper Discoverer Rugged Trek All-Season LT275/70R18 125Q Tire",                        price: "$313.00", status: "Vendor Selected",  pill: "bg-blue-100 text-blue-700 border border-blue-200",    dot: "bg-blue-400"  },
];

const avatarColors = [
  "from-violet-400 to-purple-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
];

const systemStatus = [
  { label: "Database Connection", status: "Online", dot: "bg-emerald-400", pill: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  { label: "Vendor Sync",         status: "Active", dot: "bg-sky-400",     pill: "bg-sky-100 text-sky-700 border border-sky-200"             },
  { label: "Inventory Sync",      status: "Active", dot: "bg-teal-400",    pill: "bg-teal-100 text-teal-700 border border-teal-200"          },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 20),
    to: new Date(2024, 1, 9),
  });

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 min-h-screen">
      <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 via-blue-700 to-violet-700 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Inventory, sales, and fitment performance across US, Canada warehouses.
            </p>
          </div>
          <DateRangePicker value={date} onChange={setDate} />
        </div>

        {/* ── Order KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {orderKPIs.map(k => (
            <div
              key={k.label}
              className={`relative overflow-hidden rounded-2xl p-5 shadow-md ${k.lightBg} border border-white`}
            >
              {/* Decorative blob */}
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${k.gradient} opacity-10`}/>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{k.label}</p>
                  <p className={`text-3xl font-extrabold tracking-tight ${k.valueCl}`}>{k.value}</p>
                  <p className="text-xs mt-2 text-emerald-600 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3"/> {k.change}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.iconBg} shadow-sm`}>
                  <k.icon className={`w-5 h-5 ${k.iconColor}`}/>
                </div>
              </div>
              {/* Bottom accent bar */}
              <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${k.gradient} opacity-60 rounded-b-2xl`}/>
            </div>
          ))}
        </div>

        {/* ── Error Status Overview ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-500"/>
              </div>
              <h3 className="font-bold text-lg text-slate-800">Error Status Overview</h3>
            </div>
            <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              376 Errors
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {errorStats.map(e => (
              <div
                key={e.label}
                className={`relative overflow-hidden rounded-2xl p-5 border ${e.bg} ${e.border} shadow-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{e.label}</p>
                    <p className={`text-4xl font-extrabold ${e.valueColor}`}>{e.value}</p>
                    <p className="text-xs text-slate-400 mt-1">from last month</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/60`}>
                    <ShieldAlert className={`w-5 h-5 ${e.iconColor}`}/>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${e.barColor}`}
                      style={{ width: `${e.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{e.pct}% of total errors</p>
                </div>
                <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${e.gradient} opacity-10`}/>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tire Stats ── */}
       
        {/* ── Charts ── */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <SalesChart />
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <CategoryChart />
          </div>
        </div>

        {/* ── Recent Orders + Side Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent Orders */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {/* Card header with gradient */}
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-5 py-4">
              <h3 className="font-extrabold text-white text-base tracking-tight">Recent Orders</h3>
              <p className="text-amber-100 text-xs mt-0.5">Latest orders requiring attention</p>
            </div>
            <div className="divide-y divide-slate-50 px-5">
              {recentOrders.map((o, i) => (
                <div key={o.id} className="flex items-center gap-3 py-3.5">
                  {/* Gradient avatar */}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center shrink-0 shadow-sm`}>
                    <ShoppingBag className="w-4 h-4 text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{o.id}</p>
                    <p className="text-xs font-medium text-slate-500">{o.customer}</p>
                    <p className="text-xs text-slate-400 truncate">{o.product}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-slate-800">{o.price}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${o.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`}/>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">

            {/* Active Vendors */}
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-200"/>
                <h4 className="font-bold text-sm text-white">Active Vendors</h4>
              </div>
              <div className="bg-purple-50 border border-purple-100 px-5 py-4">
                <p className="text-4xl font-extrabold text-purple-800">28</p>
                <p className="text-xs text-purple-400 mt-1 font-medium">23 synced vendors</p>
                <div className="mt-3 flex gap-1">
                  {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 8 ? "bg-purple-400" : "bg-purple-100"}`}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Orders */}
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-200"/>
                <h4 className="font-bold text-sm text-white">Today's Orders</h4>
              </div>
              <div className="bg-sky-50 border border-sky-100 px-5 py-4">
                <p className="text-4xl font-extrabold text-sky-800">0</p>
                <p className="text-xs text-sky-400 mt-1 font-medium">Orders created today</p>
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-sky-100 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-sky-400 rounded-full"/>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-200"/>
                <h4 className="font-bold text-sm text-white">System Status</h4>
                <span className="ml-auto">
                  <Zap className="w-3.5 h-3.5 text-yellow-300"/>
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 px-5 py-4 space-y-3">
                {systemStatus.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`}/>
                      <span className="text-xs font-medium text-slate-600">{s.label}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${s.pill}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
