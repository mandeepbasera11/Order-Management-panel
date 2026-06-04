import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle2, AlertTriangle, Store } from "lucide-react";
import { toast } from "sonner";

type Channel = {
  id: string; name: string; listings: number; synced: number; errors: number;
  status: "Healthy" | "Syncing" | "Issues"; lastSync: string; enabled: boolean;
};

const INITIAL: Channel[] = [
  { id:"shopify",  name:"Shopify",        listings:842, synced:842, errors:0,  status:"Healthy", lastSync:"3 min ago",  enabled:true  },
  { id:"ebay",     name:"eBay Motors",    listings:612, synced:598, errors:14, status:"Issues",  lastSync:"12 min ago", enabled:true  },
  { id:"amazon",   name:"Amazon",         listings:734, synced:734, errors:0,  status:"Healthy", lastSync:"5 min ago",  enabled:true  },
  { id:"walmart",  name:"Walmart",        listings:421, synced:415, errors:6,  status:"Issues",  lastSync:"22 min ago", enabled:true  },
  { id:"tirerack", name:"TireRack Feed",  listings:512, synced:512, errors:0,  status:"Healthy", lastSync:"1 hour ago", enabled:false },
  { id:"google",   name:"Google Shopping",listings:842, synced:840, errors:2,  status:"Healthy", lastSync:"8 min ago",  enabled:true  },
];

export function ListingMirrorSync() {
  const [channels, setChannels] = useState<Channel[]>(INITIAL);
  const [running, setRunning] = useState(false);

  const toggle = (id: string) =>
    setChannels(cs => cs.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));

  const syncAll = () => {
    setRunning(true);
    setChannels(cs => cs.map(c => c.enabled ? { ...c, status: "Syncing" } : c));
    setTimeout(() => {
      setChannels(cs => cs.map(c => c.enabled
        ? { ...c, status: c.errors > 0 ? "Issues" : "Healthy", lastSync: "just now" }
        : c));
      setRunning(false);
      toast.success("All enabled channels synced");
    }, 1500);
  };

  const totalListings = channels.reduce((s,c)=>s+c.listings,0);
  const totalSynced = channels.reduce((s,c)=>s+c.synced,0);
  const totalErrors = channels.reduce((s,c)=>s+c.errors,0);
  const pct = totalListings ? (totalSynced/totalListings)*100 : 0;

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-primary"/>Listing Mirror Sync
          </h2>
          <p className="text-muted-foreground mt-1">Mirror inventory & pricing across every marketplace channel in one click.</p>
        </div>
        <Button onClick={syncAll} disabled={running}>
          <RefreshCw className={`w-4 h-4 mr-2 ${running?"animate-spin":""}`}/>
          {running ? "Syncing all..." : "Sync all channels"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Total Listings</p><p className="text-2xl font-bold mt-1">{totalListings.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">In Sync</p><p className="text-2xl font-bold mt-1 text-green-600">{totalSynced.toLocaleString()}</p><Progress value={pct} className="mt-2 h-1.5"/></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Errors</p><p className="text-2xl font-bold mt-1 text-red-500">{totalErrors}</p></Card>
      </div>
      <div className="space-y-3">
        {channels.map(c => (
          <Card key={c.id} className={`p-5 ${!c.enabled?"opacity-60":""}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted"><Store className="w-5 h-5 text-primary"/></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge className={
                      c.status==="Healthy" ? "bg-green-100 text-green-700"
                      : c.status==="Syncing" ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                    }>
                      {c.status==="Healthy" ? <CheckCircle2 className="w-3 h-3 mr-1"/>
                       : c.status==="Syncing" ? <RefreshCw className="w-3 h-3 mr-1 animate-spin"/>
                       : <AlertTriangle className="w-3 h-3 mr-1"/>}
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.synced.toLocaleString()} / {c.listings.toLocaleString()} synced • {c.errors} errors • Last: {c.lastSync}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{c.enabled?"Enabled":"Disabled"}</span>
                <Switch checked={c.enabled} onCheckedChange={()=>toggle(c.id)}/>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}