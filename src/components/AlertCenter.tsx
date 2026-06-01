import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, CheckCircle2, XCircle, Package, Truck, RefreshCw, DollarSign, X, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";

type AlertType = "low_stock"|"delayed_shipment"|"failed_import"|"price_mismatch"|"sync_issue"|"system";
type AlertSeverity = "critical"|"warning"|"info";
type Alert = { id:string; type:AlertType; severity:AlertSeverity; title:string; message:string; time:string; read:boolean; };
type Message = { id:string; from:string; avatar:string; message:string; time:string; order?:string; read:boolean; };

const SEVERITY_COLORS: Record<AlertSeverity,string> = {
  critical:"bg-red-100 text-red-700 border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  info:    "bg-blue-100 text-blue-700 border-blue-200",
};
const TYPE_ICONS: Record<AlertType,React.ReactNode> = {
  low_stock:        <Package className="w-4 h-4"/>,
  delayed_shipment: <Truck className="w-4 h-4"/>,
  failed_import:    <XCircle className="w-4 h-4"/>,
  price_mismatch:   <DollarSign className="w-4 h-4"/>,
  sync_issue:       <RefreshCw className="w-4 h-4"/>,
  system:           <AlertTriangle className="w-4 h-4"/>,
};

const INIT_ALERTS: Alert[] = [
  {id:"1",type:"low_stock",       severity:"critical",title:"Low Stock: Michelin Defender 225/65R17", message:"Only 3 units remaining. Reorder point is 20.",      time:"5 min ago", read:false},
  {id:"2",type:"low_stock",       severity:"critical",title:"Low Stock: BFGoodrich KO2 265/70R17",   message:"Only 1 unit remaining. Immediate reorder needed.",   time:"12 min ago",read:false},
  {id:"3",type:"delayed_shipment",severity:"warning", title:"Shipment Delayed: ORD-2026-0005",        message:"FedEx delay detected. Expected delivery extended 2 days.",time:"1 hr ago",read:false},
  {id:"4",type:"price_mismatch",  severity:"warning", title:"Price Mismatch: eBay vs Shopify",        message:"Pirelli P Zero listed at $280 on eBay, $310 on Shopify.",time:"2 hrs ago",read:false},
  {id:"5",type:"failed_import",   severity:"critical",title:"CSV Import Failed",                      message:"500 rows failed to import due to duplicate SKUs.",   time:"3 hrs ago",read:false},
  {id:"6",type:"sync_issue",      severity:"warning", title:"Amazon Sync Issue",                      message:"23 SKUs failed to sync to Amazon Seller Central.",   time:"4 hrs ago",read:true },
  {id:"7",type:"sync_issue",      severity:"info",    title:"Walmart Feed Updated",                   message:"1,204 products successfully synced to Walmart.",     time:"6 hrs ago",read:true },
  {id:"8",type:"system",          severity:"info",    title:"Scheduled Backup Complete",              message:"Database backup completed successfully.",            time:"1 day ago", read:true },
];

const INIT_MESSAGES: Message[] = [
  {id:"1",from:"James Dowell",avatar:"JD",message:"Can you check ORD-2026-0003? Customer is asking about status.",order:"ORD-2026-0003",time:"10 min ago",read:false},
  {id:"2",from:"Maria Reyes",  avatar:"MR",message:"Bulk import for the new Ironman SKUs is ready. Please review.",                        time:"45 min ago",read:false},
  {id:"3",from:"Tom Keller",   avatar:"TK",message:"Vendor Cleve Tire has a new pricing sheet. Should I update?",                          time:"2 hrs ago", read:false},
  {id:"4",from:"Sarah Chen",   avatar:"SC",message:"Monthly reports are ready for review. Attached in Google Drive.",                      time:"1 day ago", read:true },
  {id:"5",from:"Amy Lin",      avatar:"AL",message:"Low stock on Michelin products noticed. Raised a purchase request.",                   time:"1 day ago", read:true },
];

export function AlertCenter() {
  const [alerts, setAlerts]     = useState<Alert[]>(INIT_ALERTS);
  const [messages, setMessages] = useState<Message[]>(INIT_MESSAGES);
  const [newMsg, setNewMsg]     = useState("");
  const [tab, setTab]           = useState("alerts");

  const unreadAlerts   = alerts.filter(a=>!a.read).length;
  const unreadMessages = messages.filter(m=>!m.read).length;
  const critical       = alerts.filter(a=>a.severity==="critical"&&!a.read).length;

  const markRead = (id:string)   => setAlerts(a=>a.map(x=>x.id===id?{...x,read:true}:x));
  const dismiss  = (id:string)   => setAlerts(a=>a.filter(x=>x.id!==id));
  const markAllRead = ()         => setAlerts(a=>a.map(x=>({...x,read:true})));
  const markMsgRead = (id:string)=> setMessages(m=>m.map(x=>x.id===id?{...x,read:true}:x));

  const sendMsg = () => {
    if (!newMsg.trim()) return;
    setMessages(m=>[{id:Date.now().toString(),from:"You",avatar:"SC",message:newMsg,time:"Just now",read:true},...m]);
    setNewMsg(""); toast.success("Message sent");
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6"/>
            Notifications & Alerts
            {unreadAlerts+unreadMessages > 0 && <Badge variant="destructive">{unreadAlerts+unreadMessages}</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Smart alert center and internal messaging</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>
      </div>

      {/* Quick stats */}
      {critical > 0 && (
        <Card className="p-4 border-red-300 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5"/>
            <span className="font-semibold">{critical} critical alert{critical>1?"s":""} require your attention</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:"Unread Alerts",   value:unreadAlerts,   color:"text-red-600"},
          {label:"Critical",        value:critical,        color:"text-red-700"},
          {label:"Unread Messages", value:unreadMessages,  color:"text-blue-600"},
          {label:"Total Alerts",    value:alerts.length,   color:"text-gray-600"},
        ].map(s=>(
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="alerts">
            Alerts {unreadAlerts>0&&<Badge variant="destructive" className="ml-1 text-xs">{unreadAlerts}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="messages">
            Messages {unreadMessages>0&&<Badge variant="destructive" className="ml-1 text-xs">{unreadMessages}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3">
          {alerts.length===0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500 opacity-50"/>
              <p className="text-muted-foreground">All clear! No alerts.</p>
            </Card>
          ) : alerts.map(a=>(
            <Card key={a.id} className={`p-4 transition-all ${a.read?"opacity-60":"border-l-4"} ${
              a.severity==="critical"?"border-l-red-500":a.severity==="warning"?"border-l-yellow-500":"border-l-blue-500"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full mt-0.5 ${SEVERITY_COLORS[a.severity]}`}>
                    {TYPE_ICONS[a.type]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold ${a.read?"text-muted-foreground":""}`}>{a.title}</p>
                      {!a.read && <div className="w-2 h-2 bg-blue-500 rounded-full"/>}
                      <Badge className={`text-xs ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!a.read && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={()=>markRead(a.id)}>Mark Read</Button>}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>dismiss(a.id)}><X className="w-3.5 h-3.5"/></Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {/* Compose */}
          <Card className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Send a message to your team..." value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
              <Button onClick={sendMsg}><MessageSquare className="w-4 h-4 mr-1"/>Send</Button>
            </div>
          </Card>
          {/* Message list */}
          <div className="space-y-3">
            {messages.map(m=>(
              <Card key={m.id} className={`p-4 transition-all ${!m.read?"border-l-4 border-l-blue-500":"opacity-70"}`}
                onClick={()=>markMsgRead(m.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {m.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{m.from}</p>
                      {m.order && <Badge variant="outline" className="text-xs">{m.order}</Badge>}
                      {!m.read && <div className="w-2 h-2 bg-blue-500 rounded-full"/>}
                      <p className="text-xs text-muted-foreground ml-auto">{m.time}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
