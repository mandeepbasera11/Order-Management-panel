import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { Inventory } from "@/components/Inventory";
import { VehicleFitment } from "@/components/VehicleFitment";
import { MarketplacePricing } from "@/components/MarketplacePricing";
import { ShopifyProducts } from "@/components/ShopifyProducts";
import { PriceExperiment } from "@/components/PriceExperiment";
import { UserPermissions } from "@/components/UserPermissions";
import { Placeholder } from "@/components/Placeholder";

const descriptions: Record<string, string> = {
  Orders: "Track and fulfill tire orders across all sales channels.",
  POS: "In-store point-of-sale for walk-in tire customers.",
  Vendors: "Manage tire manufacturers and distributor relationships.",
  "GE Tire Hickory Inventory": "Warehouse-level stock for the Hickory facility.",
  "Marketplace Pricing": "Compare and adjust pricing across marketplaces.",
  "Shopify Products": "Sync and manage your Shopify tire catalog.",
  "Price Experiment": "Run pricing A/B tests on selected tire SKUs.",
  "Tires Reverse Lookup": "Find vehicles compatible with a given tire size.",
  Reports: "Sales, inventory, and margin reports.",
  "User Permissions": "Manage staff roles and access levels.",
  "Order Archive": "Browse historical and completed orders.",
  "Listing Mirror Sync": "Sync listings with Listing Mirror.",
  "FTP Settings": "Configure FTP feeds for vendor inventory imports.",
};

const Index = () => {
  const [active, setActive] = useState("Dashboard");

  const render = () => {
    if (active === "Dashboard") return <Dashboard />;
    if (active === "Manage Tires") return <Inventory />;
    if (active === "Vehicle Fitment") return <VehicleFitment />;
    if (active === "Marketplace Pricing") return <MarketplacePricing />;
    if (active === "Shopify Products") return <ShopifyProducts />;
    if (active === "Price Experiment") return <PriceExperiment />;
    if (active === "User Permissions") return <UserPermissions />;
    return <Placeholder title={active} description={descriptions[active]} />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        {render()}
      </div>
    </div>
  );
};

export default Index;
