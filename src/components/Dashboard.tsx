import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { SalesChart, CategoryChart } from "./Charts";
import { DateRangePicker } from "./DateRangePicker";

const stats = [
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

export function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 20),
    to: new Date(2024, 1, 9),
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Tire Sales Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Inventory, sales, and fitment performance across US warehouses.
          </p>
        </div>
        <DateRangePicker date={date} setDate={setDate} />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart />
        <CategoryChart />
      </div>
    </div>
  );
}