import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, TrendingUp, Package, MessageSquare, Send, Bot, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const FORECAST_DATA = [
  {month:"Jun",actual:null,forecast:520,lower:460,upper:580},
  {month:"Jul",actual:null,forecast:610,lower:540,upper:680},
  {month:"Aug",actual:null,forecast:720,lower:640,upper:800},
  {month:"Sep",actual:null,forecast:580,lower:510,upper:650},
  {month:"Oct",actual:null,forecast:490,lower:430,upper:550},
  {month:"Nov",actual:null,forecast:680,lower:600,upper:760},
  {month:"Dec",actual:null,forecast:890,lower:790,upper:990},
];

const PURCHASE_SUGGESTIONS = [
  {sku:"GE-Michelin-123",name:"Michelin Defender 225/65R17",currentStock:8,suggestedQty:40,vendor:"National Tire",unitCost:108,totalCost:4320,reason:"Trending up 32% this season"},
  {sku:"GE-BFG-KO2",    name:"BFGoodrich KO2 265/70R17",   currentStock:3,suggestedQty:24,vendor:"Cleve Tire",   unitCost:162,totalCost:3888,reason:"Low stock, high demand period"},
  {sku:"GE-Goodyear-WR",name:"Goodyear Wrangler 265/65R17",currentStock:15,suggestedQty:20,vendor:"National Tire",unitCost:145,totalCost:2900,reason:"Seasonal demand spike forecast"},
  {sku:"GE-Continental-CC",name:"Continental TrueContact 235/55R18",currentStock:6,suggestedQty:30,vendor:"Vans Tire",unitCost:118,totalCost:3540,reason:"Bestseller, stock running low"},
];

type Message = { role:"user"|"assistant"; text:string };

const AI_RESPONSES: Record<string, string> = {
  default: "I can help with order status, product recommendations, return guidance, and more. What do you need?",
  order: "I found your order. It's currently in **Shipping** status. Your FedEx tracking number is 7489234790234. Expected delivery is June 2, 2026.",
  recommend: "Based on your Toyota RAV4 2021, I recommend **Michelin CrossClimate2 225/65R17** ($165/tire) — excellent all-season performance. Also consider **Goodyear Assurance WeatherReady** ($142/tire) as a budget option.",
  return: "To start a return: 1) Go to Orders, 2) Find your order, 3) Click the return icon, 4) Select your reason. An RMA number will be generated automatically. Returns are accepted within 30 days.",
  stock: "Current low stock alerts: Michelin Defender 225/65R17 (8 units), BFGoodrich KO2 265/70R17 (3 units). I recommend reordering these today based on your 30-day forecast.",
  price: "Average margin across your catalog is 21.4%. Your highest-margin category is UHP at 25.3%. I suggest reviewing MM tires which have the lowest margin at 15%.",
};

function getAIResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("order") || lower.includes("track") || lower.includes("status")) return AI_RESPONSES.order;
  if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("tire for")) return AI_RESPONSES.recommend;
  if (lower.includes("return") || lower.includes("refund") || lower.includes("warranty")) return AI_RESPONSES.return;
  if (lower.includes("stock") || lower.includes("inventory") || lower.includes("low")) return AI_RESPONSES.stock;
  if (lower.includes("price") || lower.includes("margin") || lower.includes("profit")) return AI_RESPONSES.price;
  return AI_RESPONSES.default;
}

export function AIFeatures() {
  const [messages, setMessages] = useState<Message[]>([
    { role:"assistant", text:"Hi! I'm your AI assistant for DmTire Hub. I can help with order lookups, product recommendations, inventory insights, return guidance, and more. How can I help you today?" }
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role:"user", text:userMsg }]);
    setInput(""); setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role:"assistant", text:getAIResponse(userMsg) }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500"/> AI Features
          </h1>
          <p className="text-sm text-muted-foreground">Demand forecasting, purchase suggestions and AI assistant</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 ml-2">Powered by AI</Badge>
      </div>

      <Tabs defaultValue="forecast">
        <TabsList>
          <TabsTrigger value="forecast"><TrendingUp className="w-4 h-4 mr-1"/>Demand Forecast</TabsTrigger>
          <TabsTrigger value="purchase"><ShoppingCart className="w-4 h-4 mr-1"/>Purchase Suggestions</TabsTrigger>
          <TabsTrigger value="assistant"><Bot className="w-4 h-4 mr-1"/>AI Assistant</TabsTrigger>
        </TabsList>

        {/* Demand Forecast */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              {label:"Forecasted Jun Sales",value:"520 units",sub:"↑ 12% vs last Jun",color:"text-green-600"},
              {label:"Peak Month (AI)",      value:"December",   sub:"890 units expected", color:"text-blue-600"},
              {label:"Seasonal Alert",       value:"All-Season", sub:"Demand spike in Oct",color:"text-orange-600"},
            ].map(k => (
              <Card key={k.label} className="p-5">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <h3 className="font-semibold mb-1">6-Month Sales Forecast</h3>
            <p className="text-xs text-muted-foreground mb-4">AI-predicted unit sales with confidence range</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="forecast" fill="#8b5cf6" name="Forecast" radius={[4,4,0,0]}/>
                <Bar dataKey="upper"    fill="#ddd6fe" name="Upper Bound" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5"/>
              <div className="text-sm">
                <p className="font-semibold text-purple-800">AI Insights</p>
                <ul className="mt-2 space-y-1 text-purple-700">
                  <li>• December demand expected to surge 89% — stock up by October</li>
                  <li>• All-terrain tires will peak in Aug–Sep (off-road season)</li>
                  <li>• Winter tires should be ordered by mid-September</li>
                  <li>• BFGoodrich KO2 trending 32% above last year — increase reorder</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Purchase Suggestions */}
        <TabsContent value="purchase" className="space-y-4">
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <Package className="w-5 h-5"/>
              <span className="font-semibold">AI has identified {PURCHASE_SUGGESTIONS.length} items that need reordering</span>
            </div>
          </Card>
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">AI Purchase Recommendations</h3>
              <Button size="sm" onClick={() => toast.success("Purchase orders created for all suggestions!")}>
                <ShoppingCart className="w-4 h-4 mr-1"/>Order All ({PURCHASE_SUGGESTIONS.length})
              </Button>
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Tire</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Suggested Qty</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Est. Cost</TableHead>
                <TableHead>AI Reason</TableHead>
                <TableHead>Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {PURCHASE_SUGGESTIONS.map(s => (
                  <TableRow key={s.sku}>
                    <TableCell>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${s.currentStock < 5 ? "text-red-600":"text-orange-600"}`}>{s.currentStock}</span>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">{s.suggestedQty} units</TableCell>
                    <TableCell><Badge variant="outline">{s.vendor}</Badge></TableCell>
                    <TableCell className="font-semibold">${s.totalCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <Sparkles className="w-3 h-3"/>{s.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => toast.success(`PO created for ${s.name}`)}>
                        Create PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* AI Assistant */}
        <TabsContent value="assistant">
          <Card className="flex flex-col h-[560px]">
            <div className="p-4 border-b flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600"/>
              </div>
              <div>
                <p className="font-semibold text-sm">DmTire AI Assistant</p>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full"/><span className="text-xs text-muted-foreground">Online</span></div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role==="user"?"justify-end":""}`}>
                  {m.role==="assistant" && (
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-purple-600"/>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role==="user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin"/>
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-muted-foreground">Thinking...</div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {["Order status","Recommend tires","Check inventory","Return guidance","Price insights"].map(p => (
                <Button key={p} variant="outline" size="sm" className="text-xs h-7 rounded-full"
                  onClick={() => { setInput(p); }}>
                  {p}
                </Button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
              <Input placeholder="Ask anything about orders, tires, inventory..." value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&sendMessage()}/>
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4"/>
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
