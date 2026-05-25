import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DollarSign, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { SalesChart, CategoryChart } from "./Charts";
import { DateRangePicker } from "./DateRangePicker";

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Sales",
    value: "+2,350",
    change: "+180.1% from last month",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Active Customers",
    value: "+12,234",
    change: "+19% from last month",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Orders",
    value: "+573",
    change: "+201 from last month",
    changeType: "positive" as const,
    icon: ShoppingCart,
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Tire sales overview across the USA.
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