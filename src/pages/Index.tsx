import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
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
import { GETireHickory } from "@/components/GETireHickory";
import { TiresReverseLookup } from "@/components/TiresReverseLookup";
import { OrderArchive } from "@/components/OrderArchive";
import { ListingMirrorSync } from "@/components/ListingMirrorSync";
import { Placeholder } from "@/components/Placeholder";

// ─── Route map — every sidebar nav item must have a matching case here ────────
const PAGE_MAP: Record<string, React.ReactNode> = {
  "OperationsDashboard":             <OperationsDashboard />,
  "Executive Dashboard":   <ExecutiveDashboard />,
  "Orders":                <Orders />,
  "POS":                   <POS />,
  "Manage Tires":          <Inventory />,
  "Vehicle Fitment":       <VehicleFitment />,
  "Vendors":               <Vendors />,
  "Inventory Sync":        <InventorySync />,
  "GE Tire Hickory Inventory": <GETireHickory />,
  "Marketplace Pricing":   <MarketplacePricing />,
  "Shopify Products":      <ShopifyProducts />,
  "Price Experiment":      <PriceExperiment />,
  "Pricing Engine":        <PricingEngine />,
  "Tire Search Wizard":    <TireSearchWizard />,
  "Tires Reverse Lookup":  <TiresReverseLookup />,
  "Shipping Dashboard":    <ShippingDashboard />,
  "Appointments":          <AppointmentScheduler />,
  "TPMS Management":       <TPMSManagement />,
  "Customer CRM":          <CustomerCRM />,
  "Executive Dashboard ":  <ExecutiveDashboard />,   // trailing-space guard
  "Reports":               <Reports />,
  "AI Features":           <AIFeatures />,
  "Alert Center":          <AlertCenter />,
  "User Permissions":      <UserPermissions />,
  "Permission Matrix":     <PermissionMatrix />,
  "2FA & Security":        <TwoFactorAuth />,
  "Audit Logs":            <AuditLogs />,
  "Activity Monitor":      <ActivityMonitor />,
  "Error Logs":            <ErrorLogs />,
  "Order Archive":         <OrderArchive />,
  "Listing Mirror Sync":   <ListingMirrorSync />,
  "FTP Settings":          <FTPSettings />,
};

export default function Index() {
  const [active, setActive] = useState("Dashboard");

  // Normalise: trim whitespace, handle any casing drift
  const page = PAGE_MAP[active] ?? PAGE_MAP[active.trim()] ?? (
    <Placeholder title={active} />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={active} onNavigate={setActive} />
      <main className="flex-1 overflow-auto flex flex-col">
        {page}
      </main>
    </div>
  );
}
