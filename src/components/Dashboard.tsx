import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  DollarSign, Package, ShoppingCart, AlertTriangle, Clock, CheckCircle2,
  ShieldAlert, Users, ShoppingBag, Activity, Database, RefreshCw, X,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { SalesChart, CategoryChart } from "./Charts";
import { DateRangePicker } from "./DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ─── Static data (replace with real Supabase queries as needed) ───────────────

const tireStats = [
  {
    title: "Tire Revenue",
    value: "$284,920",
    change: "+18.4% from last month",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Tires in Stock",
    value: "12,847",
    change: "+342 units this week",
    changeType: "positive" as const,
    icon: Package,
  },
  {
    title: "Tires Sold (MTD)",
    value: "3,128",
    change: "+22.6% from last month",
    changeType: "positive" as const,
    icon: ShoppingCart,
  },
  {
    title: "Low Stock SKUs",
    value: "47",
    change: "Needs reorder",
    changeType: "negative" as const,
    icon: AlertTriangle,
  },
];

const orderKPIs = [
  {
    label: "Total Orders Pending",
    value: "0",
    change: "+12% from last month",
    changePositive: true,
    icon: Clock,
    iconColor: "text-gray-400",
  },
  {
    label: "Vendor Selected",
    value: "283",
    change: "+8% from last month",
    changePositive: true,
    icon: CheckCircle2,
    iconColor: "text-gray-400",
  },
  {
    label: "Total Orders",
    value: "659",
    change: "+15% from last month",
    changePositive: true,
    icon: ShoppingBag,
    iconColor: "text-gray-400",
  },
  {
    label: "Total Revenue",
    value: "$156,791.5",
    change: "+20% from last month",
    changePositive: true,
    icon: DollarSign,
    iconColor: "text-gray-400",
  },
];

const errorStats = [
  { label: "Product Errors",   value: 205, note: "from last month" },
  { label: "Vendor Errors",    value: 28,  note: "from last month" },
  { label: "Inventory Errors", value: 143, note: "from last month" },
];

const recentOrders = [
  { id: "291691957", customer: "Randy Thompson",  product: "Cooper Cobra Radial G/T All-Season P245/60R15 100T Tire",                       price: "$189.99", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
  { id: "291656619", customer: "Vansh Sehgal",    product: "Pirelli Scorpion All Season Plus 3 All Season 235/55R19 105V XL SUV/Crossover Tire", price: "$200.24", status: "Inventory Error", statusColor: "bg-red-100 text-red-600"    },
  { id: "291656618", customer: "James Purdom",    product: "Continental ExtremeContact DWS06 PLUS UHP All Season 245/40ZR19 98Y XL Passenger Tire", price: "$242.60", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
  { id: "291655579", customer: "Patricia Lopez",  product: "Pirelli Scorpion STR All Season 245/50R20 102H Light Truck Tire",              price: "$138.99", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
  { id: "291620409", customer: "Canyon Eggar",    product: "Cooper Discoverer Rugged Trek All-Season LT275/70R18 125Q Tire",              price: "$313.00", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
];

const systemStatus = [
  { label: "Database Connection", status: "Online", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Vendor Sync",         status: "Active", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Inventory Sync",      status: "Active", color: "bg-green-100 text-green-700 border-green-200" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 20),
    to: new Date(2024, 1, 9),
  });

  const [orderDate, setOrderDate] = useState<{ from: string; to: string }>({
    from: "2026-05-27",
    to:   "2026-06-03",
  });

  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);

  return (
    <div className="flex-1 space-y-8 p-6 overflow-auto">

      {/* ── Section 1: Order Management Dashboard ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Overview of your order management system</p>
          </div>
          {/* Date badge */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
              onClick={() => setShowOrderDatePicker(v => !v)}
            >
              <Database className="w-3.5 h-3.5 text-muted-foreground"/>
              <span>May 27 – Jun 3, 2026</span>
              <span className="text-muted-foreground">∨</span>
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Order KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {orderKPIs.map(k => (
            <Card key={k.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                  <p className={`text-xs mt-1 flex items-center gap-1 ${k.changePositive ? "text-green-600" : "text-red-500"}`}>
                    <span>{k.changePositive ? "↗" : "↘"}</span>
                    {k.change}
                  </p>
                </div>
                <k.icon className={`w-5 h-5 mt-0.5 ${k.iconColor}`}/>
              </div>
            </Card>
          ))}
        </div>

        {/* Error Status Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base">Error Status Overview</h3>
            <Badge variant="destructive" className="text-xs">376 Errors</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {errorStats.map(e => (
              <Card key={e.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{e.label}</p>
                    <p className="text-3xl font-bold">{e.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{e.note}</p>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-muted-foreground/40 mt-0.5"/>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Orders + Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 p-5">
            <div className="mb-4">
              <h3 className="font-bold text-base bg-yellow-200 inline-block px-1">Recent Orders</h3>
              <p className="text-xs text-yellow-600 mt-0.5">Latest orders requiring attention</p>
            </div>
            <div className="space-y-3">
              {recentOrders.map((o, i) => (
                <div key={o.id}>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-blue-500"/>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{o.id}</p>
                      <p className="text-xs text-muted-foreground">{o.customer}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.product}</p>
                    </div>
                    {/* Price + Status */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{o.price}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${o.statusColor}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                  {i < recentOrders.length - 1 && <Separator className="mt-3"/>}
                </div>
              ))}
            </div>
          </Card>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Active Vendors */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground"/>
                <h4 className="font-semibold text-sm">Active Vendors</h4>
              </div>
              <p className="text-3xl font-bold mb-1">28</p>
              <p className="text-xs text-muted-foreground">23 synced vendors</p>
            </Card>

            {/* Today's Orders */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground"/>
                <h4 className="font-semibold text-sm">Today's Orders</h4>
              </div>
              <p className="text-3xl font-bold mb-1">0</p>
              <p className="text-xs text-muted-foreground">Orders created today</p>
            </Card>

            {/* System Status */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-muted-foreground"/>
                <h4 className="font-semibold text-sm">System Status</h4>
              </div>
              <div className="space-y-2">
                {systemStatus.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.color}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Separator/>

      {/* ── Section 2: Tire Sales Dashboard (existing) ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Tire Sales Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Inventory, sales, and fitment performance across US warehouses.
            </p>
          </div>
          <DateRangePicker value={date} onChange={setDate} />
        </div>

        {/* Tire Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {tireStats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <SalesChart />
          <CategoryChart />
        </div>
      </div>

    </div>
  );
}
