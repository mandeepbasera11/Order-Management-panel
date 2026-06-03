import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign, Plus, Bell, Pencil, Trash2, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const COMPETITOR_DATA = [
  { sku:"GE-Michelin-123", name:"Michelin Defender 225/65R17", ourPrice:145, amazon:139, walmart:142, ebay:136, costPrice:108, margin:25.5 },
  { sku:"GE-Goodyear-456", name:"Goodyear Assurance 205/55R16", ourPrice:120, amazon:118, walmart:125, ebay:112, costPrice:89, margin:25.8 },
  { sku:"GE-BFG-KO2",     name:"BFGoodrich KO2 265/70R17",    ourPrice:210, amazon:198, walmart:205, ebay:195, costPrice:162, margin:22.9 },
  { sku:"GE-Pirelli-321", name:"Pirelli P Zero 255/40R19",    ourPrice:280, amazon:275, walmart:285, ebay:268, costPrice:210, margin:25.0 },
  { sku:"GE-Continental", name:"Continental CrossContact 235/55R18",ourPrice:165,amazon:160,walmart:168,ebay:155,costPrice:120,margin:27.3},
];

const PRICE_HISTORY = [
  { date:"May 1",  amazon:142, walmart:145, ebay:138, ours:145 },
  { date:"May 8",  amazon:139, walmart:143, ebay:135, ours:145 },
  { date:"May 15", amazon:136, walmart:140, ebay:132, ours:142 },
  { date:"May 22", amazon:138, walmart:142, ebay:134, ours:142 },
  { date:"May 29", amazon:139, walmart:142, ebay:136, ours:145 },
  { date:"Jun 1",  amazon:137, walmart:140, ebay:133, ours:145 },
];

type PricingRule = { id:string; name:string; type:"margin"|"competitor"|"fixed"; value:string; category:string; active:boolean; minMargin:number };
const INIT_RULES: PricingRule[] = [
  { id:"1", name:"Minimum 20% Margin",    type:"margin",     value:"20",  category:"All",  active:true,  minMargin:20 },
  { id:"2", name:"Beat Amazon by $2",     type:"competitor", value:"2",   category:"MM",   active:true,  minMargin:15 },
  { id:"3", name:"UHP Premium Pricing",   type:"fixed",      value:"15",  category:"UHP",  active:false, minMargin:22 },
  { id:"4", name:"LT Competitive Price",  type:"competitor", value:"1",   category:"LT",   active:true,  minMargin:18 },
];

type Alert = { sku:string; name:string; type:string; message:string; severity:"critical"|"warning" };
const PRICE_ALERTS: Alert[] = [
  { sku:"GE-BFG-KO2",  name:"BFGoodrich KO2 265/70R17",   type:"competitor", message:"Amazon dropped price by $12 — we are $15 above", severity:"warning" },
  { sku:"GE-Michelin-123",name:"Michelin Defender 225/65R17",type:"margin",   message:"Margin fell below 20% after recent cost increase", severity:"critical" },
];

export function PricingEngine() {
  const [rules, setRules]   = useState<PricingRule[]>(INIT_RULES);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [newRule, setNewRule]   = useState<Partial<PricingRule>>({ type:"margin", category:"All", active:true, minMargin:20 });
  const [selected, setSelected] = useState(COMPETITOR_DATA[0]);

  const toggleRule = (id: string) =>
    setRules(r => r.map(x => x.id===id ? {...x, active:!x.active} : x));

  const deleteRule = (id: string) => {
    setRules(r => r.filter(x => x.id!==id));
    toast.success("Rule deleted");
  };

  const saveRule = () => {
    if (!newRule.name) { toast.error("Enter a rule name"); return; }
    const rule: PricingRule = {
      id: Date.now().toString(), name: newRule.name!, type: newRule.type as any,
      value: newRule.value||"0", category: newRule.category||"All",
      active: true, minMargin: newRule.minMargin||15,
    };
    setRules(r => [...r, rule]);
    toast.success("Pricing rule created");
    setRuleOpen(false); setNewRule({ type:"margin", category:"All", active:true, minMargin:20 });
  };

  const applyDynamic = () => {
    toast.success("Dynamic pricing engine applied — 47 prices updated across all channels");
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pricing & Profitability</h1>
          <p className="text-sm text-muted-foreground">Competitor monitoring, dynamic pricing rules and margin protection</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Competitor prices refreshed")}><RefreshCw className="w-4 h-4 mr-1"/>Refresh Prices</Button>
          <Button size="sm" onClick={applyDynamic}><DollarSign className="w-4 h-4 mr-1"/>Apply Dynamic Pricing</Button>
        </div>
      </div>

      {/* Alerts */}
      {PRICE_ALERTS.map(a => (
        <Card key={a.sku} className={`p-4 ${a.severity==="critical"?"border-red-300 bg-red-50":"border-yellow-300 bg-yellow-50"}`}>
          <div className={`flex items-center gap-2 ${a.severity==="critical"?"text-red-700":"text-yellow-700"}`}>
            <AlertTriangle className="w-4 h-4"/>
            <span className="font-semibold text-sm">{a.name} — {a.message}</span>
            <Badge variant={a.severity==="critical"?"destructive":"secondary"} className="ml-auto text-xs">{a.type}</Badge>
          </div>
        </Card>
      ))}

      <Tabs defaultValue="competitor">
        <TabsList>
          <TabsTrigger value="competitor">Competitor Monitoring</TabsTrigger>
          <TabsTrigger value="rules">Dynamic Pricing Rules</TabsTrigger>
          <TabsTrigger value="margin">Margin Analysis</TabsTrigger>
        </TabsList>

        {/* Competitor Monitoring */}
        <TabsContent value="competitor" className="space-y-4">
          <Card>
            <div className="p-4 border-b"><h3 className="font-semibold">Live Competitor Price Comparison</h3></div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Our Price</TableHead>
                    <TableHead className="text-right">Amazon</TableHead>
                    <TableHead className="text-right">Walmart</TableHead>
                    <TableHead className="text-right">eBay</TableHead>
                    <TableHead className="text-right">Our Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPETITOR_DATA.map(p => {
                    const lowest = Math.min(p.amazon, p.walmart, p.ebay);
                    const position = p.ourPrice <= lowest ? "Lowest" : p.ourPrice <= lowest + 5 ? "Competitive" : "High";
                    return (
                      <TableRow key={p.sku} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(p)}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-right font-bold">${p.ourPrice}</TableCell>
                        <TableCell className="text-right">
                          <span className={p.amazon < p.ourPrice ? "text-red-500 font-bold" : ""}>${p.amazon}</span>
                          {p.amazon < p.ourPrice && <TrendingDown className="w-3 h-3 inline ml-1 text-red-500"/>}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={p.walmart < p.ourPrice ? "text-red-500 font-bold" : ""}>${p.walmart}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={p.ebay < p.ourPrice ? "text-red-500 font-bold" : ""}>${p.ebay}</span>
                          {p.ebay < p.ourPrice && <TrendingDown className="w-3 h-3 inline ml-1 text-red-500"/>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={position==="Lowest"?"bg-green-100 text-green-700":position==="Competitive"?"bg-blue-100 text-blue-700":"bg-red-100 text-red-700"}>
                            {position}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Price History — {selected.name}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                <XAxis dataKey="date" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}`} domain={['auto','auto']}/>
                <Tooltip formatter={(v:number)=>`$${v}`}/>
                <Legend/>
                <Line type="monotone" dataKey="ours"    stroke="#3b82f6" strokeWidth={2.5} name="Our Price" dot/>
                <Line type="monotone" dataKey="amazon"  stroke="#f97316" strokeWidth={1.5} name="Amazon" strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="walmart" stroke="#eab308" strokeWidth={1.5} name="Walmart" strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="ebay"    stroke="#6b7280" strokeWidth={1.5} name="eBay" strokeDasharray="4 2"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Pricing Rules */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{rules.filter(r=>r.active).length} active rules running</p>
            <Button size="sm" onClick={() => setRuleOpen(true)}><Plus className="w-4 h-4 mr-1"/>Add Rule</Button>
          </div>
          <div className="space-y-3">
            {rules.map(r => (
              <Card key={r.id} className={`p-4 ${!r.active?"opacity-50":""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={r.active} onCheckedChange={() => toggleRule(r.id)}/>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{r.type}</Badge>
                        <Badge variant="outline" className="text-xs">{r.category}</Badge>
                        <span className="text-xs text-muted-foreground">Min margin: {r.minMargin}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={r.active?"bg-green-100 text-green-700":"bg-gray-100 text-gray-600"}>
                      {r.active?"Active":"Inactive"}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteRule(r.id)}>
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Margin Analysis */}
        <TabsContent value="margin">
          <Card>
            <div className="p-4 border-b"><h3 className="font-semibold">Product Margin Breakdown</h3></div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Our Price</TableHead>
                  <TableHead className="text-right">Mktplace Fees (~8%)</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPETITOR_DATA.map(p => {
                  const fees = Math.round(p.ourPrice * 0.08 * 100) / 100;
                  const profit = p.ourPrice - p.costPrice - fees;
                  const margin = ((profit / p.ourPrice) * 100).toFixed(1);
                  return (
                    <TableRow key={p.sku}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-right">${p.costPrice}</TableCell>
                      <TableCell className="text-right font-bold">${p.ourPrice}</TableCell>
                      <TableCell className="text-right text-orange-600">${fees}</TableCell>
                      <TableCell className="text-right text-green-700 font-semibold">${profit.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={parseFloat(margin)>=20?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}>
                          {margin}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5"/>New Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rule Name</Label>
              <Input placeholder="e.g. Beat Amazon by $3" value={newRule.name||""} onChange={e=>setNewRule({...newRule,name:e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rule Type</Label>
                <Select value={newRule.type} onValueChange={v=>setNewRule({...newRule,type:v as any})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="margin">Minimum Margin %</SelectItem>
                    <SelectItem value="competitor">Beat Competitor by $</SelectItem>
                    <SelectItem value="fixed">Fixed Markup %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input type="number" placeholder="e.g. 20" value={newRule.value||""} onChange={e=>setNewRule({...newRule,value:e.target.value})}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={newRule.category} onValueChange={v=>setNewRule({...newRule,category:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {["All","MM","LT","HP","UHP","MC"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Min Margin % (floor)</Label>
                <Input type="number" value={newRule.minMargin||15} onChange={e=>setNewRule({...newRule,minMargin:Number(e.target.value)})}/>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setRuleOpen(false)}>Cancel</Button>
            <Button onClick={saveRule}>Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
