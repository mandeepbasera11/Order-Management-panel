import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Building2,
  Warehouse,
  Package,
  Car,
  DollarSign,
  Store,
  FlaskConical,
  Search,
  BarChart3,
  ShieldCheck,
  Archive,
  RefreshCw,
  Server,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Orders", icon: ShoppingBag },
  { name: "POS", icon: CreditCard },
  { name: "Vendors", icon: Building2 },
  { name: "GE Tire Hickory Inventory", icon: Warehouse },
  { name: "Manage Tires", icon: Package },
  { name: "Vehicle Fitment", icon: Car },
  { name: "Marketplace Pricing", icon: DollarSign },
  { name: "Shopify Products", icon: Store },
  { name: "Price Experiment", icon: FlaskConical },
  { name: "Import Status", icon: History },
  { name: "Tires Reverse Lookup", icon: Search },
  { name: "Reports", icon: BarChart3 },
  { name: "User Permissions", icon: ShieldCheck },
  { name: "Order Archive", icon: Archive },
  { name: "Listing Mirror Sync", icon: RefreshCw },
  { name: "FTP Settings", icon: Server },
];

interface SidebarProps {
  active: string;
  onNavigate: (name: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAuth();
  const items = navigation.filter((n) => n.name !== "User Permissions" || isAdmin);

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo and Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="ml-2 text-lg font-semibold text-foreground">DmTire Hub</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => onNavigate(item.name)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  active === item.name
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5 mr-3")} />
                {!collapsed && item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}