import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
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

function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-sm">
        {description || "This feature is coming soon."}
      </p>
    </div>
  );
}

const descriptions: Record<string, string> = {
  "POS":                      "Point of Sale system for in-store tire purchases.",
  "Vendors":                  "Vendor management and purchase order tracking.",
  "GE Tire Hickory Inventory":"Live GE Tire Hickory warehouse inventory feed.",
  "Tires Reverse Lookup":     "Look up which vehicles are compatible with a tire.",
  "Order Archive":            "Archived and completed orders history.",
  "Listing Mirror Sync":      "Mirror listings across all marketplace platforms.",
  "FTP Settings":             "Configure FTP data feed connections.",
};

export default function Index() {
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    switch (active) {
      case "Dashboard":            return <Dashboard />;
      case "Orders":               return <Orders />;
      case "Manage Tires":         return <Inventory />;
      case "Vehicle Fitment":      return <VehicleFitment />;
      case "Marketplace Pricing":  return <MarketplacePricing />;
      case "Shopify Products":     return <ShopifyProducts />;
      case "Price Experiment":     return <PriceExperiment />;
      case "User Permissions":     return <UserPermissions />;
      case "Reports":              return <Reports />;
      case "Alert Center":         return <AlertCenter />;
      case "Audit Logs":           return <AuditLogs />;
      case "Tire Search Wizard":   return <TireSearchWizard />;
      case "Shipping Dashboard":   return <ShippingDashboard />;
      case "Customer CRM":         return <CustomerCRM />;
      case "AI Features":          return <AIFeatures />;
      default:                     return <Placeholder title={active} description={descriptions[active]} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={active} onNavigate={setActive} />
      <main className="flex-1 overflow-auto flex flex-col">
        {renderPage()}
      </main>
    </div>
  );
}
