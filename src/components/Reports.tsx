import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const DAILY = [
  {day:"Mon",sales:12400,orders:34,profit:3100},{day:"Tue",sales:15200,orders:42,profit:3800},
  {day:"Wed",sales:9800, orders:27,profit:2450},{day:"Thu",sales:18600,orders:51,profit:4650},
  {day:"Fri",sales:22100,orders:61,profit:5525},{day:"Sat",sales:17800,orders:49,profit:4450},
  {day:"Sun",sales:8400, orders:23,profit:2100},
];
const MONTHLY = [
  {month:"Jan",revenue:142000,profit:35500,orders:390},{month:"Feb",revenue:128000,profit:32000,orders:352},
  {month:"Mar",revenue:165000,profit:41250,orders:453},{month:"Apr",revenue:171000,profit:42750,orders:469},
  {month:"May",revenue:188000,profit:47000,orders:516},{month:"Jun",revenue:195000,profit:48750,orders:535},
];
const TOP_TIRES = [
  {name:"Michelin Defender 225/65R17",brand:"Michelin",sold:284,revenue:41180,margin:22},
  {name:"Goodyear Assurance 205/55R16",brand:"Goodyear",sold:251,revenue:30120,margin:19},
  {name:"BFGoodrich KO2 265/70R17",brand:"BFGoodrich",sold:198,revenue:41580,margin:24},
  {name:"Continental CrossContact 235/55R18",brand:"Continental",sold:176,revenue:29040,margin:21},
  {name:"Pirelli P Zero 255/40R19",brand:"Pirelli",sold:142,revenue:39760,margin:28},
  {name:"Ironman All Country AT 265/70R17",brand:"Ironman",sold:312,revenue:30264,margin:15},
  {name:"Hankook Kinergy 215/60R16",brand:"Hankook",sold:267,revenue:23496,margin:17},
  {name:"Nexen N5000 Plus 225/50R17",brand:"Nexen",sold:198,revenue:14850,margin:13},
];
const BRANDS = [
  {brand:"Michelin",  sales:48200,units:332,margin:22,color:"#3b82f6"},
  {brand:"Goodyear",  sales:39100,units:326,margin:19,color:"#10b981"},
  {brand:"BFGoodrich",sales:36800,units:175,margin:24,color:"#f59e0b"},
  {brand:"Pirelli",   sales:34200,units:122,margin:28,color:"#ef4444"},
  {brand:"Continental",sales:31500,units:191,margin:21,color:"#8b5cf6"},
  {brand:"Ironman",   sales:29300,units:302,margin:15,color:"#6b7280"},
  {brand:"Hankook",   sales:24400,units:277,margin:17,color:"#ec4899"},
  {brand:"Nexen",     sales:18900,units:252,margin:13,color:"#14b8a6"},
];
const AGING = [
  {range:"0–30 Days", units:1842,value:198400,pct:61},
  {range:"31–60 Days",units:682, value:73400, pct:23},
  {range:"61–90 Days",units:312, value:33600, pct:10},
  {range:"90+ Days",  units:184, value:19800, pct:6},
];
const VENDORS = [
  {vendor:"Cleve Tire",        orders:142,avgDelivery:"2.1 days",returnRate:"0.8%",volume:48200},
  {vendor:"Vans Tire Pros",    orders:98, avgDelivery:"3.4 days",returnRate:"1.2%",volume:31500},
  {vendor:"National Tire",     orders:201,avgDelivery:"1.8 days",returnRate:"0.5%",volume:67800},
  {vendor:"Wholesale Tires Co",orders:76, avgDelivery:"4.2 days",returnRate:"2.1%",volume:24100},
];
const MARGIN_DATA = [
  {category:"MM",  costPrice:68, sellingPrice:89, margin:23.6,fees:8.9},
  {category:"LT",  costPrice:112,sellingPrice:148,margin:24.3,fees:14.8},
  {category:"HP",  costPrice:94, sellingPrice:124,margin:24.2,fees:12.4},
  {category:"UHP", costPrice:148,sellingPrice:198,margin:25.3,fees:19.8},
  {category:"MC",  costPrice:72, sellingPrice:92, margin:21.7,fees:9.2},
];

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#6b7280","#ec4899","#14b8a6"];

export function Reports() {
  const [period, setPeriod] = useState("monthly");
  const todaySales   = DAILY.reduce((s,d)=>s+d.sales,0);
  const totalRevenue = MONTHLY.reduce((s,m)=>s+m.revenue,0);
  const totalProfit  = MONTHLY.reduce((s,m)=>s+m.profit,0);
  const totalOrders  = MONTHLY.reduce((s,m)=>s+m.orders,0);
  const grossMargin  = ((totalProfit/totalRevenue)*100).toFixed(1);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Advanced Reports</h1>
          <p className="text-sm text-muted-foreground">Sales, inventory, vendor and profitability analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={()=>toast.success("Report exported")}><Download className="w-4 h-4 mr-1"/>Export</Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Total Revenue",   value:`$${(totalRevenue/1000).toFixed(0)}K`, sub:"Last 6 months",  Icon:DollarSign, color:"text-blue-600",   trend:"+12.4%"},
          {label:"Gross Profit",    value:`$${(totalProfit/1000).toFixed(0)}K`,  sub:`${grossMargin}% margin`,Icon:TrendingUp,color:"text-green-600",trend:"+8.1%"},
          {label:"Total Orders",    value:totalOrders,                           sub:"Last 6 months",  Icon:ShoppingCart,color:"text-purple-600",trend:"+15.3%"},
          {label:"Daily Sales",     value:`$${(todaySales/1000).toFixed(0)}K`,   sub:"This week avg",  Icon:BarChart3,  color:"text-orange-600",trend:"+5.7%"},
        ].map(k=>(
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <k.Icon className={`w-4 h-4 ${k.color}`}/>
            </div>
            <p className={`text-3xl font-bold mt-2 ${k.color}`}>{k.value}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600 font-medium">{k.trend}</span>
              <span className="text-xs text-muted-foreground">{k.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="executive">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="brands">Brand Performance</TabsTrigger>
          <TabsTrigger value="toptires">Top Tires</TabsTrigger>
          <TabsTrigger value="margin">Margin Analysis</TabsTrigger>
          <TabsTrigger value="aging">Inventory Aging</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Performance</TabsTrigger>
        </TabsList>

        {/* Executive */}
        <TabsContent value="executive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Monthly Revenue & Profit</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="month" tick={{fontSize:12}}/>
                  <YAxis tick={{fontSize:12}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                  <Tooltip formatter={(v:number)=>`$${v.toLocaleString()}`}/>
                  <Legend/>
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4,4,0,0]}/>
                  <Bar dataKey="profit"  fill="#10b981" name="Profit"  radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Daily Sales This Week</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={DAILY}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="day" tick={{fontSize:12}}/>
                  <YAxis tick={{fontSize:12}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                  <Tooltip formatter={(v:number)=>`$${v.toLocaleString()}`}/>
                  <Legend/>
                  <Line type="monotone" dataKey="sales"  stroke="#3b82f6" strokeWidth={2} dot name="Sales"/>
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot name="Profit"/>
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Brand Performance */}
        <TabsContent value="brands" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Sales by Brand</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={BRANDS} dataKey="sales" nameKey="brand" cx="50%" cy="50%" outerRadius={100} label={({brand,pct})=>`${brand}`}>
                    {BRANDS.map((b,i)=><Cell key={b.brand} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v:number)=>`$${v.toLocaleString()}`}/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Brand Profitability</h3>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {BRANDS.map(b=>(
                    <TableRow key={b.brand}>
                      <TableCell className="font-medium">{b.brand}</TableCell>
                      <TableCell className="text-right">${b.sales.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{b.units}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={b.margin>=20?"default":"secondary"}>{b.margin}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        {/* Top Tires */}
        <TabsContent value="toptires">
          <Card>
            <div className="p-4 border-b"><h3 className="font-semibold">Top Selling Tires</h3></div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead>
                <TableHead>Tire Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {TOP_TIRES.map((t,i)=>(
                  <TableRow key={t.name}>
                    <TableCell className="font-bold text-muted-foreground">#{i+1}</TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.brand}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{t.sold}</TableCell>
                    <TableCell className="text-right">${t.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right"><Badge variant={t.margin>=20?"default":"secondary"}>{t.margin}%</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Margin Analysis */}
        <TabsContent value="margin" className="space-y-4">
          <Card>
            <div className="p-4 border-b"><h3 className="font-semibold">Margin Analysis by Category</h3></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MARGIN_DATA}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="category"/>
                  <YAxis tickFormatter={v=>`$${v}`}/>
                  <Tooltip/>
                  <Legend/>
                  <Bar dataKey="costPrice"    fill="#ef4444" name="Cost Price"    radius={[4,4,0,0]}/>
                  <Bar dataKey="sellingPrice" fill="#3b82f6" name="Selling Price" radius={[4,4,0,0]}/>
                  <Bar dataKey="fees"         fill="#f59e0b" name="Marketplace Fees" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Mktplace Fees</TableHead>
                <TableHead className="text-right">Profit Margin</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {MARGIN_DATA.map(m=>(
                  <TableRow key={m.category}>
                    <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                    <TableCell className="text-right">${m.costPrice}</TableCell>
                    <TableCell className="text-right font-semibold">${m.sellingPrice}</TableCell>
                    <TableCell className="text-right text-orange-600">${m.fees}</TableCell>
                    <TableCell className="text-right"><Badge className="bg-green-100 text-green-700">{m.margin}%</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Inventory Aging */}
        <TabsContent value="aging" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Inventory Age Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={AGING} dataKey="units" nameKey="range" cx="50%" cy="50%" outerRadius={90} label={({range,pct})=>`${pct}%`}>
                    {AGING.map((_,i)=><Cell key={i} fill={["#10b981","#3b82f6","#f59e0b","#ef4444"][i]}/>)}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Aging Breakdown</h3>
              <div className="space-y-3">
                {AGING.map((a,i)=>(
                  <div key={a.range} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{a.range}</span>
                      <span className="font-bold">{a.units} units — ${a.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 rounded-full transition-all" style={{width:`${a.pct}%`,backgroundColor:["#10b981","#3b82f6","#f59e0b","#ef4444"][i]}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
                <p className="font-semibold text-red-700">⚠️ Action Required</p>
                <p className="text-red-600">184 units aged 90+ days ($19,800 value). Consider discounting.</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Vendor Performance */}
        <TabsContent value="vendor">
          <Card>
            <div className="p-4 border-b"><h3 className="font-semibold">Vendor Performance Report</h3></div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Avg Delivery</TableHead>
                <TableHead className="text-right">Return Rate</TableHead>
                <TableHead className="text-right">Purchase Volume</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {VENDORS.map(v=>{
                  const score = parseFloat(v.avgDelivery)<2.5 && parseFloat(v.returnRate)<1 ? "Excellent" : parseFloat(v.avgDelivery)<3.5?"Good":"Review";
                  return (
                    <TableRow key={v.vendor}>
                      <TableCell className="font-medium">{v.vendor}</TableCell>
                      <TableCell className="text-right">{v.orders}</TableCell>
                      <TableCell className="text-right">{v.avgDelivery}</TableCell>
                      <TableCell className="text-right">{v.returnRate}</TableCell>
                      <TableCell className="text-right font-semibold">${v.volume.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={score==="Excellent"?"default":score==="Good"?"secondary":"destructive"}>{score}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
