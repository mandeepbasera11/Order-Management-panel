import {
  LayoutDashboard, ShoppingBag, CreditCard, Building2, Warehouse, Package, Car,
  DollarSign, Store, FlaskConical, Search, BarChart3, ShieldCheck, Archive,
  RefreshCw, Server, Bell, Shield, Truck, Users, Sparkles, Wrench,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Gauge, Calendar,
  Activity, Key, AlertTriangle, GitMerge, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = { name: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard",            icon: LayoutDashboard },
      { name: "Orders",               icon: ShoppingBag     },
      { name: "POS",                  icon: CreditCard      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Manage Tires",         icon: Package         },
      { name: "Vehicle Fitment",      icon: Car             },
      { name: "GE Tire Hickory Inventory", icon: Warehouse  },
      { name: "Inventory Sync",       icon: RefreshCw       },
      { name: "Vendors",              icon: Building2       },
    ],
  },
  {
    label: "Pricing & Marketplace",
    items: [
      { name: "Marketplace Pricing",  icon: DollarSign      },
      { name: "Shopify Products",     icon: Store           },
      { name: "Price Experiment",     icon: FlaskConical    },
      { name: "Pricing Engine",       icon: Gauge           },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Tire Search Wizard",   icon: Search          },
      { name: "Tires Reverse Lookup", icon: Search          },
      { name: "Shipping Dashboard",   icon: Truck           },
      { name: "Appointments",         icon: Calendar        },
      { name: "TPMS Management",      icon: Gauge           },
    ],
  },
  {
    label: "Customers",
    items: [
      { name: "Customer CRM",         icon: Users           },
    ],
  },
  {
    label: "Analytics & AI",
    items: [
      { name: "Executive Dashboard",  icon: LayoutDashboard },
      { name: "Reports",              icon: BarChart3       },
      { name: "Brand Analytics",      icon: BarChart3       },
      { name: "AI Features",          icon: Sparkles        },
    ],
  },
  {
    label: "Notifications",
    items: [
      { name: "Alert Center",         icon: Bell            },
    ],
  },
  {
    label: "Admin & Security",
    items: [
      { name: "User Permissions",     icon: ShieldCheck     },
      { name: "Permission Matrix",    icon: GitMerge        },
      { name: "2FA & Security",       icon: Lock            },
      { name: "Audit Logs",           icon: Shield          },
      { name: "Activity Monitor",     icon: Activity        },
      { name: "Error Logs",           icon: AlertTriangle   },
      { name: "Order Archive",        icon: Archive         },
      { name: "Listing Mirror Sync",  icon: RefreshCw       },
      { name: "FTP Settings",         icon: Server          },
    ],
  },
];

interface SidebarProps {
  active: string;
  onNavigate: (name: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed]     = useState(false);
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
      collapsed ? "w-14" : "w-56"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-primary-foreground"/>
            </div>
            <span className="font-bold text-sm">DmTire Hub</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-muted transition-colors ml-auto shrink-0">
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-muted-foreground"/>
            : <ChevronLeft  className="w-4 h-4 text-muted-foreground"/>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        {NAV_GROUPS.map(group => {
          const isOpen = !closedGroups.has(group.label);
          return (
            <div key={group.label}>
              {!collapsed && (
                <button onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mt-2">
                  {group.label}
                  {isOpen ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                </button>
              )}
              {(isOpen || collapsed) && (
                <ul className="space-y-0.5 mb-1">
                  {group.items.map(item => (
                    <li key={item.name}>
                      <button
                        onClick={() => onNavigate(item.name)}
                        title={collapsed ? item.name : undefined}
                        className={cn(
                          "w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-all",
                          active === item.name
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted font-semibold"
                        )}>
                        <item.icon className={cn("w-4 h-4 shrink-0", !collapsed && "mr-2")}/>
                        {!collapsed && <span className="truncate">{item.name}</span>}
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
