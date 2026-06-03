import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Server, RefreshCw, CheckCircle2, XCircle, Play, Clock, Download, Upload } from "lucide-react";
import { toast } from "sonner";

type FTPFeed = { id:string; name:string; host:string; port:number; username:string; path:string; schedule:string; lastRun:string; status:"Connected"|"Error"|"Pending"; enabled:boolean; direction:"import"|"export"; };

const INIT_FEEDS: FTPFeed[] = [
  { id:"1", name:"GE Tire Main Feed",      host:"ftp.getire.com",       port:21,  username:"dmtire_ge",    path:"/feeds/tires/",     schedule:"Every 6 hours", lastRun:"2026-05-30 06:00", status:"Connected", enabled:true,  direction:"import" },
  { id:"2", name:"Ironman Product Feed",   host:"ftp.ironmanusa.com",   port:22,  username:"dmtire_iron",  path:"/catalog/",         schedule:"Daily 2:00 AM", lastRun:"2026-05-30 02:00", status:"Connected", enabled:true,  direction:"import" },
  { id:"3", name:"Walmart Price Export",   host:"ftp.walmart-seller.com",port:21, username:"dmtire_wmt",   path:"/pricing/upload/",  schedule:"Every 12 hours",lastRun:"2026-05-30 00:00", status:"Error",     enabled:true,  direction:"export" },
  { id:"4", name:"Amazon Inventory Sync",  host:"ftp.amazon-seller.com",port:21,  username:"dmtire_amz",   path:"/inventory/",       schedule:"Hourly",        lastRun:"2026-05-30 09:00", status:"Connected", enabled:false, direction:"export" },
];

export function FTPSettings() {
  const [feeds, setFeeds] = useState<FTPFeed[]>(INIT_FEEDS);
  const [form, setForm]   = useState({ name:"", host:"", port:"21", username:"", password:"", path:"/", schedule:"Daily 2:00 AM", direction:"import" as "import"|"export" });
  const [testing, setTesting] = useState<string|null>(null);

  const toggleFeed = (id: string) =>
    setFeeds(f => f.map(x => x.id===id ? {...x, enabled:!x.enabled} : x));

  const testConnection = (id: string) => {
    setTesting(id);
    setTimeout(() => {
      setTesting(null);
      const feed = feeds.find(f => f.id===id);
      if (feed?.status==="Error") {
        toast.error(`Connection failed for ${feed.name}`);
      } else {
        toast.success(`Connection successful for ${feed?.name}`);
      }
    }, 1500);
  };

  const runNow = (id: string) => {
    const feed = feeds.find(f => f.id===id);
    toast.success(`${feed?.name} — sync started manually`);
    setFeeds(f => f.map(x => x.id===id ? {...x, lastRun:new Date().toISOString().slice(0,16).replace("T"," ")} : x));
  };

  const saveNew = () => {
    if (!form.name || !form.host) { toast.error("Name and host required"); return; }
    const feed: FTPFeed = {
      id:Date.now().toString(), name:form.name, host:form.host, port:Number(form.port)||21,
      username:form.username, path:form.path, schedule:form.schedule,
      lastRun:"Never", status:"Pending", enabled:true, direction:form.direction,
    };
    setFeeds(f => [...f, feed]);
    toast.success("FTP feed added");
    setForm({ name:"", host:"", port:"21", username:"", password:"", path:"/", schedule:"Daily 2:00 AM", direction:"import" });
  };

  const connected = feeds.filter(f => f.status==="Connected").length;
  const errors    = feeds.filter(f => f.status==="Error").length;
  const enabled   = feeds.filter(f => f.enabled).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Server className="w-6 h-6"/>FTP Settings</h1>
          <p className="text-sm text-muted-foreground">Configure automated data feed connections</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Connected",    value:connected, color:"text-green-600" },
          { label:"Errors",       value:errors,    color:"text-red-600"   },
          { label:"Active Feeds", value:enabled,   color:"text-blue-600"  },
        ].map(s=>(
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Feed list */}
      <div className="space-y-3">
        {feeds.map(feed => (
          <Card key={feed.id} className={`p-5 ${!feed.enabled?"opacity-60":""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${feed.status==="Connected"?"bg-green-100":"feed.status==='Error'"?"bg-red-100":"bg-gray-100"}`}>
                  {feed.status==="Connected" ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : feed.status==="Error" ? <XCircle className="w-4 h-4 text-red-600"/> : <Clock className="w-4 h-4 text-gray-600"/>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{feed.name}</p>
                    <Badge variant={feed.direction==="import"?"secondary":"outline"} className="text-xs flex items-center gap-1">
                      {feed.direction==="import" ? <Download className="w-3 h-3"/> : <Upload className="w-3 h-3"/>}
                      {feed.direction}
                    </Badge>
                    <Badge className={`text-xs ${feed.status==="Connected"?"bg-green-100 text-green-700":feed.status==="Error"?"bg-red-100 text-red-700":"bg-gray-100 text-gray-600"}`}>
                      {feed.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{feed.host}:{feed.port}{feed.path}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span><Clock className="w-3 h-3 inline mr-0.5"/>{feed.schedule}</span>
                    <span>Last run: {feed.lastRun}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Switch checked={feed.enabled} onCheckedChange={()=>toggleFeed(feed.id)} title="Enable/disable"/>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={()=>testConnection(feed.id)} disabled={testing===feed.id}>
                  {testing===feed.id ? <RefreshCw className="w-3 h-3 mr-1 animate-spin"/> : <RefreshCw className="w-3 h-3 mr-1"/>}
                  Test
                </Button>
                <Button size="sm" className="text-xs h-7" onClick={()=>runNow(feed.id)} disabled={!feed.enabled}>
                  <Play className="w-3 h-3 mr-1"/>Run Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add new feed */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Add New FTP Feed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Feed Name *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Brand X Product Feed"/></div>
          <div className="space-y-1.5"><Label>Direction</Label>
            <Select value={form.direction} onValueChange={v=>setForm({...form,direction:v as any})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="import">Import (Download)</SelectItem><SelectItem value="export">Export (Upload)</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Host *</Label><Input value={form.host} onChange={e=>setForm({...form,host:e.target.value})} placeholder="ftp.example.com"/></div>
          <div className="space-y-1.5"><Label>Port</Label><Input type="number" value={form.port} onChange={e=>setForm({...form,port:e.target.value})}/></div>
          <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          <div className="space-y-1.5"><Label>Remote Path</Label><Input value={form.path} onChange={e=>setForm({...form,path:e.target.value})} placeholder="/feeds/"/></div>
          <div className="space-y-1.5"><Label>Schedule</Label>
            <Select value={form.schedule} onValueChange={v=>setForm({...form,schedule:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {["Hourly","Every 6 hours","Every 12 hours","Daily 2:00 AM","Daily 6:00 AM","Weekly"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4" onClick={saveNew}><Server className="w-4 h-4 mr-1"/>Add FTP Feed</Button>
      </Card>
    </div>
  );
}
