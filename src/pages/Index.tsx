import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PageLayout } from "@/components/PageLayout";

// ── Core pages ────────────────────────────────────────────────────────────────
import { OperationsDashboard } from "@/components/OperationsDashboard";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { Inventory } from "@/components/Inventory";
import { VehicleFitment } from "@/components/VehicleFitment";
import { MarketplacePricing } from "@/components/MarketplacePricing";
import { ShopifyProducts } from "@/components/ShopifyProducts";
import { PriceExperiment } from "@/components/PriceExperiment";
import { UserPermissions } from "@/components/UserPermissions";
import { Orders } from "@/components/Orders";
import { Reports } from "@/components/Reports";
import { AlertCenter } from "@/components/AlertCenter";
import { AuditLogs } from "@/components/AuditLogs";
import { TireSearchWizard } from "@/components/TireSearchWizard";
import { ShippingDashboard } from "@/components/ShippingDashboard";
import { CustomerCRM } from "@/components/CustomerCRM";
import { AIFeatures } from "@/components/AIFeatures";
import { InventorySync } from "@/components/InventorySync";
import { PricingEngine } from "@/components/PricingEngine";
import { AppointmentScheduler } from "@/components/AppointmentScheduler";
import { TPMSManagement } from "@/components/TPMSManagement";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { ErrorLogs } from "@/components/ErrorLogs";
import { ActivityMonitor } from "@/components/ActivityMonitor";
import { PermissionMatrix } from "@/components/PermissionMatrix";
import { POS } from "@/components/POS";
import { Vendors } from "@/components/Vendors";
import { FTPSettings } from "@/components/FTPSettings";

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  LayoutDashboard, TrendingUp, ShoppingBag, CreditCard, Package, Car,
  Warehouse, RefreshCw, Building2, DollarSign, Store, FlaskConical, Gauge,
  Search, Truck, Calendar, Users, BarChart3, Sparkles, Bell, ShieldCheck,
  GitMerge, Lock, Shield, Activity, AlertTriangle, Archive, Server,
} from "lucide-react";

// ── Coming-soon fallback ──────────────────────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        This module is coming soon. The workspace is wired into navigation and will be built out shortly.
      </p>
    </div>
  );
}

// ── Pages that render their OWN full-height layout (no PageLayout header) ─────
// OperationsDashboard and ExecutiveDashboard manage their own bg/header
const SELF_STYLED = new Set([
  "Dashboard", "Executive Dashboard", "POS",
]);

// ── Full page map with titles, subtitles, icons and color themes ──────────────
type Theme = "blue"|"purple"|"green"|"orange"|"pink"|"teal"|"red"|"indigo"|"cyan"|"violet";

type PageDef = {
  component: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  theme: Theme;
};

const sz = "w-5 h-5";

const ALL_PAGES: Record<string, PageDef> = {
  // ── Main ──
  "Dashboard": {
    component: <OperationsDashboard />,
    icon: <LayoutDashboard className={sz}/>, theme:"blue",
    subtitle:"Real-time operations, inventory & fulfillment monitoring",
  },
  "Executive Dashboard": {
    component: <ExecutiveDashboard />,
    icon: <TrendingUp className={sz}/>, theme:"violet",
    subtitle:"Executive KPIs, revenue charts and activity feed",
  },
  "Orders": {
    component: <Orders />,
    icon: <ShoppingBag className={sz}/>, theme:"blue",
    subtitle:"Order workflow, returns and backorder management",
  },
  "POS": {
    component: <POS />,
    icon: <CreditCard className={sz}/>, theme:"green",
    subtitle:"In-store point of sale terminal",
  },

  // ── Inventory ──
  "Manage Tires": {
    component: <Inventory />,
    icon: <Package className={sz}/>, theme:"indigo",
    subtitle:"Search, filter and manage your full tire catalog",
  },
  "Vehicle Fitment": {
    component: <VehicleFitment />,
    icon: <Car className={sz}/>, theme:"teal",
    subtitle:"Vehicle-tire compatibility database",
  },
  "GE Tire Hickory Inventory": {
    component: <ComingSoon title="GE Tire Hickory Inventory" />,
    icon: <Warehouse className={sz}/>, theme:"green",
    subtitle:"Live GE Tire Hickory warehouse inventory feed",
  },
  "Inventory Sync": {
    component: <InventorySync />,
    icon: <RefreshCw className={sz}/>, theme:"cyan",
    subtitle:"Real-time sync across Shopify, Amazon, eBay and Walmart",
  },
  "Vendors": {
    component: <Vendors />,
    icon: <Building2 className={sz}/>, theme:"orange",
    subtitle:"Supplier profiles, ratings and purchase contacts",
  },

  // ── Pricing & Marketplace ──
  "Marketplace Pricing": {
    component: <MarketplacePricing />,
    icon: <DollarSign className={sz}/>, theme:"orange",
    subtitle:"Compare and manage prices across all marketplaces",
  },
  "Shopify Products": {
    component: <ShopifyProducts />,
    icon: <Store className={sz}/>, theme:"green",
    subtitle:"Shopify product listings and sync status",
  },
  "Price Experiment": {
    component: <PriceExperiment />,
    icon: <FlaskConical className={sz}/>, theme:"purple",
    subtitle:"A/B price testing and experiment tracking",
  },
  "Pricing Engine": {
    component: <PricingEngine />,
    icon: <Gauge className={sz}/>, theme:"orange",
    subtitle:"Competitor monitoring, dynamic rules and margin protection",
  },

  // ── Tools ──
  "Tire Search Wizard": {
    component: <TireSearchWizard />,
    icon: <Search className={sz}/>, theme:"cyan",
    subtitle:"Find tires by size, vehicle or compatibility check",
  },
  "Tires Reverse Lookup": {
    component: <ComingSoon title="Tires Reverse Lookup" />,
    icon: <Search className={sz}/>, theme:"teal",
    subtitle:"Look up which vehicles are compatible with a tire size",
  },
  "Shipping Dashboard": {
    component: <ShippingDashboard />,
    icon: <Truck className={sz}/>, theme:"blue",
    subtitle:"Live tracking, freight calculator and carrier integrations",
  },
  "Appointments": {
    component: <AppointmentScheduler />,
    icon: <Calendar className={sz}/>, theme:"teal",
    subtitle:"Tire installation scheduling and bay management",
  },
  "TPMS Management": {
    component: <TPMSManagement />,
    icon: <Gauge className={sz}/>, theme:"green",
    subtitle:"Tire pressure monitoring and sensor inventory",
  },

  // ── Customers ──
  "Customer CRM": {
    component: <CustomerCRM />,
    icon: <Users className={sz}/>, theme:"pink",
    subtitle:"Customer profiles, vehicles, notes and purchase history",
  },

  // ── Analytics & AI ──
  "Reports": {
    component: <Reports />,
    icon: <BarChart3 className={sz}/>, theme:"violet",
    subtitle:"Sales, inventory, vendor and profitability analytics",
  },
  "AI Features": {
    component: <AIFeatures />,
    icon: <Sparkles className={sz}/>, theme:"purple",
    subtitle:"Demand forecasting, AI suggestions and chat assistant",
  },

  // ── Notifications ──
  "Alert Center": {
    component: <AlertCenter />,
    icon: <Bell className={sz}/>, theme:"orange",
    subtitle:"Smart alerts and internal team messaging",
  },

  // ── Admin & Security ──
  "User Permissions": {
    component: <UserPermissions />,
    icon: <ShieldCheck className={sz}/>, theme:"red",
    subtitle:"Staff roles, permissions and access control",
  },
  "Permission Matrix": {
    component: <PermissionMatrix />,
    icon: <GitMerge className={sz}/>, theme:"red",
    subtitle:"View / Create / Edit / Delete / Export per module × role",
  },
  "2FA & Security": {
    component: <TwoFactorAuth />,
    icon: <Lock className={sz}/>, theme:"red",
    subtitle:"Two-factor authentication and security policies",
  },
  "Audit Logs": {
    component: <AuditLogs />,
    icon: <Shield className={sz}/>, theme:"indigo",
    subtitle:"Who changed what — full activity history",
  },
  "Activity Monitor": {
    component: <ActivityMonitor />,
    icon: <Activity className={sz}/>, theme:"blue",
    subtitle:"Live user sessions, feed and system performance",
  },
  "Error Logs": {
    component: <ErrorLogs />,
    icon: <AlertTriangle className={sz}/>, theme:"red",
    subtitle:"System errors, debugging and resolution tracking",
  },
  "Order Archive": {
    component: <ComingSoon title="Order Archive" />,
    icon: <Archive className={sz}/>, theme:"indigo",
    subtitle:"Archived and completed orders history",
  },
  "Listing Mirror Sync": {
    component: <ComingSoon title="Listing Mirror Sync" />,
    icon: <RefreshCw className={sz}/>, theme:"teal",
    subtitle:"Mirror listings across all marketplace platforms",
  },
  "FTP Settings": {
    component: <FTPSettings />,
    icon: <Server className={sz}/>, theme:"indigo",
    subtitle:"Configure automated FTP data feed connections",
  },
};

// ─── Root Component ───────────────────────────────────────────────────────────
export default function Index() {
  const [active, setActive] = useState("Dashboard");

  // Normalise key — trim whitespace + fix common Lovable casing quirks
  const raw = active ?? "Dashboard";
  const key = raw.trim();

  // Always fall back to Dashboard — never show "coming soon" for Dashboard
  const config = ALL_PAGES[key]
    ?? ALL_PAGES[key.charAt(0).toUpperCase() + key.slice(1)]
    ?? ALL_PAGES["Dashboard"];

  // Self-styled pages manage their own full layout (no colorful header wrapper)
  if (SELF_STYLED.has(key)) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar active={active} onNavigate={setActive} />
        <main className="flex-1 overflow-auto flex flex-col">
          {config.component}
        </main>
      </div>
    );
  }

  // All other pages get a colorful PageLayout header
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={active} onNavigate={setActive} />
      <main className="flex-1 overflow-auto flex flex-col">
        <PageLayout
          title={key}
          subtitle={config.subtitle}
          icon={config.icon}
          theme={config.theme}
        >
          {config.component}
        </PageLayout>
      </main>
    </div>
  );
}
