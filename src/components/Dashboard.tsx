import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  DollarSign, Package, ShoppingCart, AlertTriangle, Clock, CheckCircle2,
  ShieldAlert, Users, ShoppingBag, Activity, Database, X,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { SalesChart, CategoryChart } from "./Charts";
import { DateRangePicker } from "./DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ─── Data ─────────────────────────────────────────────────────────────────────

const orderKPIs = [
  { label: "Total Orders Pending", value: "0",          change: "+12% from last month", positive: true,  icon: Clock        },
  { label: "Vendor Selected",      value: "283",        change: "+8% from last month",  positive: true,  icon: CheckCircle2 },
  { label: "Total Orders",         value: "659",        change: "+15% from last month", positive: true,  icon: ShoppingBag  },
  { label: "Total Revenue",        value: "$156,791.5", change: "+20% from last month", positive: true,  icon: DollarSign   },
];

const tireStats = [
  { title: "Tire Revenue",    value: "$284,920", change: "+18.4% from last month", changeType: "positive" as const, icon: DollarSign   },
  { title: "Tires in Stock",  value: "12,847",   change: "+342 units this week",   changeType: "positive" as const, icon: Package      },
  { title: "Tires Sold (MTD)",value: "3,128",    change: "+22.6% from last month", changeType: "positive" as const, icon: ShoppingCart },
  { title: "Low Stock SKUs",  value: "47",       change: "Needs reorder",          changeType: "negative" as const, icon: AlertTriangle },
];

const errorStats = [
  { label: "Product Errors",   value: 205 },
  { label: "Vendor Errors",    value: 28  },
  { label: "Inventory Errors", value: 143 },
];

const recentOrders = [
  { id: "291691957", customer: "Randy Thompson",  product: "Cooper Cobra Radial G/T All-Season P245/60R15 100T Tire",                              price: "$189.99", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
  { id: "291656619", customer: "Vansh Sehgal",    product: "Pirelli Scorpion All Season Plus 3 All Season 235/55R19 105V XL SUV/Crossover Tire",  price: "$200.24", status: "Inventory Error",  statusColor: "bg-red-100 text-red-600"    },
  { id: "291656618", customer: "James Purdom",    product: "Continental ExtremeContact DWS06 PLUS UHP All Season 245/40ZR19 98Y XL Passenger Tire",price: "$242.60", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
  { id: "291655579", customer: "Patricia Lopez",  product: "Pirelli Scorpion STR All Season 245/50R20 102H Light Truck Tire",                      price: "$138.99", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
  { id: "291620409", customer: "Canyon Eggar",    product: "Cooper Discoverer Rugged Trek All-Season LT275/70R18 125Q Tire",                       price: "$313.00", status: "Vendor Selected",  statusColor: "bg-blue-100 text-blue-700"  },
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

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">

      {/* ── Single header with single date picker ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Inventory, sales, and fitment performance across US warehouses.
          </p>
        </div>
        <DateRangePicker value={date} onChange={setDate} />
      </div>

      {/* ── IMAGE 2: Order KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {orderKPIs.map(k => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                <p className={`text-xs mt-1.5 flex items-center gap-0.5 ${k.positive ? "text-green-600" : "text-red-500"}`}>
                  <span>{k.positive ? "↗" : "↘"}</span> {k.change}
                </p>
              </div>
              <k.icon className="w-5 h-5 text-muted-foreground/40 mt-0.5 shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      {/* ── IMAGE 1: Tire stat cards + Error Status ── */}
      <>
        {/* Error Status Overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base">Error Status Overview</h3>
            <Badge variant="destructive" className="text-xs px-2">376 Errors</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {errorStats.map(e => (
              <Card key={e.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{e.label}</p>
                    <p className="text-3xl font-bold">{e.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">from last month</p>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-muted-foreground/30 mt-0.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Tire KPI cards */}
        <div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tireStats.map(stat => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>
      </>

      {/* ── IMAGE 3: Charts ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart />
        <CategoryChart />
      </div>

      {/* ── IMAGE 4: Recent Orders + side panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders */}
        <Card className="lg:col-span-2 p-5">
          <div className="mb-4">
            <h3 className="font-bold text-base bg-yellow-200 inline-block px-1 rounded-sm">Recent Orders</h3>
            <p className="text-xs text-yellow-600 mt-0.5">Latest orders requiring attention</p>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.customer}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.product}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{o.price}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${o.statusColor}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">

          {/* Active Vendors */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Active Vendors</h4>
            </div>
            <p className="text-3xl font-bold">28</p>
            <p className="text-xs text-muted-foreground mt-1">23 synced vendors</p>
          </Card>

          {/* Today's Orders */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Today's Orders</h4>
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Orders created today</p>
          </Card>

          {/* System Status */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">System Status</h4>
            </div>
            <div className="space-y-2.5">
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
  );
}
