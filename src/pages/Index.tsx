import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PageLayout } from "@/components/PageLayout";
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
import { BrandAnalytics } from "@/pages/BrandAnalytics";
import { Placeholder } from "@/components/Placeholder";
import {
  LayoutDashboard, TrendingUp, ShoppingBag, CreditCard, Package, Car,
  Warehouse, RefreshCw, Building2, DollarSign, Store, FlaskConical, Gauge,
  Search, Truck, Calendar, Users, BarChart3, Sparkles, Bell, ShieldCheck,
  GitMerge, Lock, Shield, Activity, AlertTriangle, Archive, Server,
} from "lucide-react";

// Pages that render their own full layout (no PageLayout header wrapper)
const SELF_STYLED = new Set([
  "Dashboard", "Executive Dashboard", "POS", "VENDORS"
]);

type ColorTheme = "blue"|"purple"|"green"|"orange"|"pink"|"teal"|"red"|"indigo"|"cyan"|"violet";

type PageConfig = {
  component: (onNavigate: (page: string) => void) => React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  theme: ColorTheme;
};

const sz = "w-5 h-5";

const PAGE_CONFIG: Record<string, PageConfig> = {
  "Dashboard":            { component: (nav) => <OperationsDashboard />,          icon:<LayoutDashboard className={sz}/>, theme:"blue",   subtitle:"Real-time operations, inventory and fulfillment monitoring" },
  "Executive Dashboard":  { component: (nav) => <ExecutiveDashboard onNavigate={nav}/>, icon:<TrendingUp className={sz}/>, theme:"violet", subtitle:"Executive KPIs, charts and activity" },
  "Orders":               { component: () => <Orders />,                           icon:<ShoppingBag className={sz}/>,    theme:"blue",   subtitle:"Order workflow, returns and backorders" },
  "POS":                  { component: () => <POS />,                              icon:<CreditCard className={sz}/>,     theme:"green",  subtitle:"In-store point of sale" },
  "Manage Tires":         { component: () => <Inventory />,                        icon:<Package className={sz}/>,        theme:"indigo", subtitle:"Search, filter and manage your tire catalog" },
  "Vehicle Fitment":      { component: () => <VehicleFitment />,                   icon:<Car className={sz}/>,            theme:"teal",   subtitle:"Vehicle-tire compatibility database" },
  "GE Tire Hickory Inventory": { component: () => <Placeholder title="GE Tire Hickory Inventory" description="Live GE Tire Hickory warehouse inventory feed."/>, icon:<Warehouse className={sz}/>, theme:"green", subtitle:"Live warehouse feed" },
  "Inventory Sync":       { component: () => <InventorySync />,                    icon:<RefreshCw className={sz}/>,      theme:"cyan",   subtitle:"Real-time sync across all channels" },
  "Vendors":              { component: () => <Vendors />,                          icon:<Building2 className={sz}/>,      theme:"orange", subtitle:"Supplier profiles, ratings and contacts" },
  "Marketplace Pricing":  { component: () => <MarketplacePricing />,               icon:<DollarSign className={sz}/>,     theme:"orange", subtitle:"Compare and manage marketplace prices" },
  "Shopify Products":     { component: () => <ShopifyProducts />,                  icon:<Store className={sz}/>,          theme:"green",  subtitle:"Shopify product listings and sync status" },
  "Price Experiment":     { component: () => <PriceExperiment />,                  icon:<FlaskConical className={sz}/>,   theme:"purple", subtitle:"A/B price testing and experiment tracking" },
  "Pricing Engine":       { component: () => <PricingEngine />,                    icon:<Gauge className={sz}/>,          theme:"orange", subtitle:"Competitor monitoring and dynamic pricing rules" },
  "Tire Search Wizard":   { component: () => <TireSearchWizard />,                 icon:<Search className={sz}/>,         theme:"cyan",   subtitle:"Find tires by size, vehicle or compatibility" },
  "Tires Reverse Lookup": { component: () => <Placeholder title="Tires Reverse Lookup" description="Look up vehicles compatible with a tire size."/>, icon:<Search className={sz}/>, theme:"teal", subtitle:"Vehicle compatibility lookup" },
  "Shipping Dashboard":   { component: () => <ShippingDashboard />,                icon:<Truck className={sz}/>,          theme:"blue",   subtitle:"Live tracking, freight calculator and carriers" },
  "Appointments":         { component: () => <AppointmentScheduler />,             icon:<Calendar className={sz}/>,       theme:"teal",   subtitle:"Tire installation scheduling and bay management" },
  "TPMS Management":      { component: () => <TPMSManagement />,                   icon:<Gauge className={sz}/>,          theme:"green",  subtitle:"Tire pressure monitoring and sensor inventory" },
  "Customer CRM":         { component: () => <CustomerCRM />,                      icon:<Users className={sz}/>,          theme:"pink",   subtitle:"Customer profiles, vehicles, notes and history" },
  "Reports":              { component: () => <Reports />,                          icon:<BarChart3 className={sz}/>,      theme:"violet", subtitle:"Sales, inventory, vendor and profitability analytics" },
  "Brand Analytics":      { component: () => <BrandAnalytics />,                   icon:<BarChart3 className={sz}/>,      theme:"violet", subtitle:"Per-brand SKU, pricing and stock analytics" },
  "AI Features":          { component: () => <AIFeatures />,                       icon:<Sparkles className={sz}/>,       theme:"purple", subtitle:"Demand forecasting, AI suggestions and chat assistant" },
  "Alert Center":         { component: () => <AlertCenter />,                      icon:<Bell className={sz}/>,           theme:"orange", subtitle:"Smart alerts and internal team messaging" },
  "User Permissions":     { component: () => <UserPermissions />,                  icon:<ShieldCheck className={sz}/>,    theme:"red",    subtitle:"Staff roles, permissions and access control" },
  "Permission Matrix":    { component: () => <PermissionMatrix />,                 icon:<GitMerge className={sz}/>,       theme:"red",    subtitle:"View / Create / Edit / Delete / Export per module" },
  "2FA & Security":       { component: () => <TwoFactorAuth />,                    icon:<Lock className={sz}/>,           theme:"red",    subtitle:"Two-factor authentication and security policies" },
  "Audit Logs":           { component: () => <AuditLogs />,                        icon:<Shield className={sz}/>,         theme:"indigo", subtitle:"Who changed what — full activity history" },
  "Activity Monitor":     { component: () => <ActivityMonitor />,                  icon:<Activity className={sz}/>,       theme:"blue",   subtitle:"Live user sessions, feed and system performance" },
  "Error Logs":           { component: () => <ErrorLogs />,                        icon:<AlertTriangle className={sz}/>,  theme:"red",    subtitle:"System errors, debugging and resolution tracking" },
  "Order Archive":        { component: () => <Placeholder title="Order Archive" description="Archived and completed orders history."/>, icon:<Archive className={sz}/>, theme:"indigo", subtitle:"Completed orders history" },
  "Listing Mirror Sync":  { component: () => <Placeholder title="Listing Mirror Sync" description="Mirror listings across all platforms."/>, icon:<RefreshCw className={sz}/>, theme:"teal", subtitle:"Mirror listings across platforms" },
  "FTP Settings":         { component: () => <FTPSettings />,                      icon:<Server className={sz}/>,         theme:"indigo", subtitle:"Configure automated FTP data feed connections" },
};

export default function Index() {
  const [active, setActive] = useState("Dashboard");

  const navigate = (page: string) => setActive(page);

  const key    = (active ?? "Dashboard").trim();
  const config = PAGE_CONFIG[key] ?? PAGE_CONFIG["Dashboard"];

  // Self-styled pages — no colorful header wrapper
  if (SELF_STYLED.has(key)) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar active={active} onNavigate={navigate}/>
        <main className="flex-1 overflow-auto flex flex-col">
          {config.component(navigate)}
        </main>
      </div>
    );
  }

  // All other pages — wrapped in colorful PageLayout header
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={active} onNavigate={navigate}/>
      <main className="flex-1 overflow-auto flex flex-col">
        <PageLayout
          title={key}
          subtitle={config.subtitle}
          icon={config.icon}
          theme={config.theme}
        >
          {config.component(navigate)}
        </PageLayout>
      </main>
    </div>
  );
}
