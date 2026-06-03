import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Activity, Users, Globe, Shield, RefreshCw, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const INIT_SESSIONS = [
  { id:"1", user:"Sarah Chen",  avatar:"SC", role:"Admin",   ip:"192.168.1.1",  browser:"Chrome 124",  location:"Hickory, NC",  started:"09:00", active:true,  page:"Manage Tires"     },
  { id:"2", user:"James Dowell",avatar:"JD", role:"Manager", ip:"192.168.1.2",  browser:"Firefox 125", location:"Charlotte, NC",started:"08:45", active:true,  page:"Orders"           },
  { id:"3", user:"Maria Reyes", avatar:"MR", role:"Staff",   ip:"192.168.1.3",  browser:"Chrome 124",  location:"Hickory, NC",  started:"08:30", active:true,  page:"Vehicle Fitment"  },
  { id:"4", user:"Amy Lin",     avatar:"AL", role:"Viewer",  ip:"192.168.1.5",  browser:"Safari 17",   location:"Remote",       started:"09:10", active:true,  page:"Reports"          },
  { id:"5", user:"Nate Ford",   avatar:"NF", role:"Staff",   ip:"192.168.1.8",  browser:"Edge 124",    location:"Hickory, NC",  started:"07:55", active:false, page:"Dashboard"        },
];

const ACTIVITY_FEED = [
  { id:"1",  user:"Sarah Chen",  avatar:"SC", action:"Updated price",        detail:"Michelin Defender → $145", time:"2 min ago",  type:"edit"   },
  { id:"2",  user:"James Dowell",avatar:"JD", action:"Advanced order status",detail:"ORD-2026-0003 → Picking",  time:"5 min ago",  type:"order"  },
  { id:"3",  user:"Maria Reyes", avatar:"MR", action:"Added vehicle fitment",detail:"2023 Toyota RAV4 XLE",     time:"8 min ago",  type:"add"    },
  { id:"4",  user:"Sarah Chen",  avatar:"SC", action:"Exported CSV",         detail:"Tires catalog export",     time:"15 min ago", type:"export" },
  { id:"5",  user:"Amy Lin",     avatar:"AL", action:"Viewed Reports",       detail:"Monthly Revenue report",   time:"22 min ago", type:"view"   },
  { id:"6",  user:"Nate Ford",   avatar:"NF", action:"Logged in",            detail:"From 192.168.1.8",         time:"1 hr ago",   type:"auth"   },
  { id:"7",  user:"James Dowell",avatar:"JD", action:"Bulk imported tires",  detail:"1,204 SKUs imported",      time:"2 hrs ago",  type:"import" },
  { id:"8",  user:"Sarah Chen",  avatar:"SC", action:"Changed permissions",  detail:"Tom Keller → Viewer",      time:"3 hrs ago",  type:"admin"  },
];

const generateLoad = () => Array.from({length:12},(_,i)=>({
  time:`${String(9+i).padStart(2,"0")}:00`,
  users: Math.floor(2+Math.random()*4),
  pageViews: Math.floor(20+Math.random()*80),
  apiCalls: Math.floor(50+Math.random()*200),
}));

const PERF_DATA = [
  { time:"09:00", cpu:18, memory:42, dbms:12 },
  { time:"09:30", cpu:24, memory:44, dbms:18 },
  { time:"10:00", cpu:35, memory:46, dbms:25 },
  { time:"10:30", cpu:28, memory:45, dbms:20 },
  { time:"11:00", cpu:42, memory:48, dbms:31 },
  { time:"11:30", cpu:38, memory:47, dbms:28 },
  { time:"12:00", cpu:55, memory:52, dbms:40 },
  { time:"12:30", cpu:48, memory:50, dbms:35 },
];

const ACTION_COLORS: Record<string,string> = {
  edit:"bg-yellow-100 text-yellow-700", order:"bg-blue-100 text-blue-700",
  add:"bg-green-100 text-green-700",    export:"bg-gray-100 text-gray-700",
  view:"bg-purple-100 text-purple-700", auth:"bg-indigo-100 text-indigo-700",
  import:"bg-teal-100 text-teal-700",   admin:"bg-red-100 text-red-700",
};

export function ActivityMonitor() {
  const [sessions, setSessions] = useState(INIT_SESSIONS);
  const [loadData] = useState(generateLoad());
  const [liveRefresh, setLiveRefresh] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!liveRefresh) return;
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, [liveRefresh]);

  const terminateSession = (id: string) => {
    setSessions(s => s.map(x => x.id===id ? {...x, active:false} : x));
    toast.success("Session terminated");
  };

  const activeSessions  = sessions.filter(s => s.active).length;
  const totalUsers      = sessions.length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-blue-500"/>Activity Monitor</h1>
          <p className="text-sm text-muted-foreground">Live user sessions, activity feed and system performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={liveRefresh} onCheckedChange={setLiveRefresh}/>
            <span className={liveRefresh?"text-green-600 font-medium":"text-muted-foreground"}>
              {liveRefresh?"Live Refresh ON":"Live Refresh OFF"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setTick(t=>t+1); toast.success("Refreshed"); }}>
            <RefreshCw className={`w-4 h-4 mr-1 ${liveRefresh?"animate-spin":""}`}/>Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Active Sessions",  value:activeSessions,                     color:"text-green-600" },
          { label:"Total Users",      value:totalUsers,                          color:"text-blue-600"  },
          { label:"Actions Today",    value:ACTIVITY_FEED.length,               color:"text-purple-600"},
          { label:"System Load",      value:`${PERF_DATA[PERF_DATA.length-1].cpu}%`, color:"text-orange-600"},
        ].map(s=>(
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="performance">System Performance</TabsTrigger>
        </TabsList>

        {/* Live Sessions */}
        <TabsContent value="sessions">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Active User Sessions</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <span className="text-xs text-green-600 font-medium">{activeSessions} online now</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Page</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map(s=>(
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.avatar}</div>
                          {s.active && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"/>}
                        </div>
                        <span className="text-sm font-medium">{s.user}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.role}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{s.ip}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.browser}</TableCell>
                    <TableCell className="text-xs">{s.location}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{s.page}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.started}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.active?"text-green-600":"text-gray-400"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.active?"bg-green-500":"bg-gray-400"}`}/>
                        {s.active?"Online":"Offline"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.active && (
                        <Button size="sm" variant="destructive" className="text-xs h-7"
                          onClick={()=>terminateSession(s.id)}>
                          <XCircle className="w-3 h-3 mr-1"/>End
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Activity Feed */}
        <TabsContent value="activity" className="space-y-2">
          {ACTIVITY_FEED.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {a.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{a.user}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[a.type]}`}>{a.action}</span>
                    <span className="text-sm text-muted-foreground">{a.detail}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label:"CPU Usage",    value:`${PERF_DATA[PERF_DATA.length-1].cpu}%`,    color:"text-orange-600", status:PERF_DATA[PERF_DATA.length-1].cpu>70?"Warning":"Normal" },
              { label:"Memory Usage", value:`${PERF_DATA[PERF_DATA.length-1].memory}%`, color:"text-blue-600",   status:"Normal" },
              { label:"DB Queries/s", value:`${PERF_DATA[PERF_DATA.length-1].dbms}`,    color:"text-purple-600", status:"Normal" },
            ].map(m=>(
              <Card key={m.label} className="p-4">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                <Badge className={m.status==="Normal"?"bg-green-100 text-green-700":"bg-yellow-100 text-yellow-700"} variant="secondary">{m.status}</Badge>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">System Performance — Last 4 Hours</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={PERF_DATA}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                <XAxis dataKey="time" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}} tickFormatter={v=>`${v}%`}/>
                <Tooltip/>
                <Line type="monotone" dataKey="cpu"    stroke="#f97316" strokeWidth={2} name="CPU %"/>
                <Line type="monotone" dataKey="memory" stroke="#3b82f6" strokeWidth={2} name="Memory %"/>
                <Line type="monotone" dataKey="dbms"   stroke="#8b5cf6" strokeWidth={2} name="DB Queries/s"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
