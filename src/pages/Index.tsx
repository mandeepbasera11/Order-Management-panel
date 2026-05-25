import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { Inventory } from "@/components/Inventory";

const Index = () => {
  const [active, setActive] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        {active === "Inventory" ? <Inventory /> : <Dashboard />}
      </div>
    </div>
  );
};

export default Index;
