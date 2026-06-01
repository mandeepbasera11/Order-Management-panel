import {
  LayoutDashboard, ShoppingBag, CreditCard, Building2, Warehouse, Package, Car,
  DollarSign, Store, FlaskConical, Search, BarChart3, ShieldCheck, Archive,
  RefreshCw, Server, ChevronLeft, ChevronRight, Bell, Shield, Truck,
  Users, Sparkles, Wrench, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = { name: string; icon: React.ElementType; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard",               icon: LayoutDashboard },
      { name: "Orders",                  icon: ShoppingBag },
      { name: "POS",                     icon: CreditCard },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Manage Tires",            icon: Package },
      { name: "Vehicle Fitment",         icon: Car },
      { name: "GE Tire Hickory Inventory", icon: Warehouse },
      { name: "Vendors",                 icon: Building2 },
    ],
  },
  {
    label: "Pricing & Marketplace",
    items: [
      { name: "Marketplace Pricing",     icon: DollarSign },
      { name: "Shopify Products",        icon: Store },
      { name: "Price Experiment",        icon: FlaskConical },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Tire Search Wizard",      icon: Search },
      { name: "Tires Reverse Lookup",    icon: Search },
      { name: "Shipping Dashboard",      icon: Truck },
    ],
  },
  {
    label: "Customers & CRM",
    items: [
      { name: "Customer CRM",            icon: Users },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Reports",                 icon: BarChart3 },
      { name: "AI Features",             icon: Sparkles },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Alert Center",            icon: Bell },
      { name: "User Permissions",        icon: ShieldCheck },
      { name: "Audit Logs",              icon: Shield },
      { name: "Import Status", icon: Upload },
      { name: "Error Logs", icon: Bug },
      { name: "Order Archive",           icon: Archive },
      { name: "Listing Mirror Sync",     icon: RefreshCw },
      { name: "FTP Settings",            icon: Server },
    ],
  },
];

interface SidebarProps {
  active: string;
  onNavigate: (name: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setClosedGroups(s => {
      const n = new Set(s);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });
  };

  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out shrink-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground"/>
            </div>
            <span className="ml-2 text-lg font-semibold text-foreground">DmTire Hub</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground"/> : <ChevronLeft className="w-4 h-4 text-muted-foreground"/>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_GROUPS.map(group => {
          const isOpen = !closedGroups.has(group.label);
          return (
            <div key={group.label}>
              {/* Group header */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  {group.label}
                  {isOpen ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                </button>
              )}

              {/* Items */}
              {(isOpen || collapsed) && (
                <ul className="space-y-0.5 mb-2">
                  {group.items.map(item => (
                    <li key={item.name}>
                      <button
                        onClick={() => onNavigate(item.name)}
                        title={collapsed ? item.name : undefined}
                        className={cn(
                          "w-full flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                          active === item.name
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}>
                        <item.icon className={cn("shrink-0 w-4 h-4", collapsed ? "" : "mr-2.5")}/>
                        {!collapsed && (
                          <span className="truncate text-xs">{item.name}</span>
                        )}
                        {!collapsed && item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
