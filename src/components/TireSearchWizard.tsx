import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Car, Ruler, CheckCircle2, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const TIRE_RESULTS: Record<string,{sku:string;name:string;brand:string;price:number;stock:number;load:string;speed:string;category:string}[]> = {
  "225/65R17":[
    {sku:"GE-Michelin-MCC1",name:"Michelin CrossClimate2 225/65R17",brand:"Michelin",price:165,stock:24,load:"102",speed:"H",category:"All-Season"},
    {sku:"GE-Goodyear-GCC2",name:"Goodyear Assurance WeatherReady 225/65R17",brand:"Goodyear",price:142,stock:18,load:"102",speed:"H",category:"All-Season"},
    {sku:"GE-Continental-CC3",name:"Continental TrueContact Tour 225/65R17",brand:"Continental",price:128,stock:31,load:"102",speed:"T",category:"All-Season"},
    {sku:"GE-BFG-BCC4",name:"BFGoodrich Advantage Control 225/65R17",brand:"BFGoodrich",price:119,stock:42,load:"102",speed:"H",category:"All-Season"},
  ],
  "265/70R16":[
    {sku:"GE-BFG-KO2",name:"BFGoodrich All-Terrain T/A KO2 265/70R16",brand:"BFGoodrich",price:195,stock:15,load:"112",speed:"S",category:"All-Terrain"},
    {sku:"GE-Goodyear-WR",name:"Goodyear Wrangler TrailRunner AT 265/70R16",brand:"Goodyear",price:178,stock:22,load:"112",speed:"T",category:"All-Terrain"},
    {sku:"GE-Ironman-AT",name:"Ironman All Country AT 265/70R16",brand:"Ironman",price:97,stock:44,load:"112",speed:"S",category:"All-Terrain"},
    {sku:"GE-Mastercraft-AT",name:"Mastercraft Courser AXT2 265/70R16",brand:"Mastercraft",price:142,stock:8,load:"112",speed:"T",category:"All-Terrain"},
  ],
  "205/55R16":[
    {sku:"GE-Michelin-PR4",name:"Michelin Primacy Tour A/S 205/55R16",brand:"Michelin",price:138,stock:19,load:"91",speed:"H",category:"Grand Touring"},
    {sku:"GE-Pirelli-C5",name:"Pirelli Cinturato P7 AS Plus 205/55R16",brand:"Pirelli",price:142,stock:11,load:"91",speed:"H",category:"Grand Touring"},
    {sku:"GE-Hankook-K125",name:"Hankook Kinergy PT 205/55R16",brand:"Hankook",price:88,stock:38,load:"91",speed:"H",category:"All-Season"},
  ],
};

const VEHICLE_DATA_VEH: Record<string,Record<string,{sizes:string[];recommended:string}>> = {
  "Toyota": {
    "Camry (2023)":  { sizes:["225/55R17","225/50R18","235/45R19"], recommended:"225/55R17" },
    "RAV4 (2023)":   { sizes:["225/65R17","235/55R18"], recommended:"225/65R17" },
    "Tacoma (2023)": { sizes:["265/65R17","265/60R18"], recommended:"265/65R17" },
  },
  "Ford": {
    "F-150 (2023)":  { sizes:["275/65R18","275/55R20","315/70R17"], recommended:"275/65R18" },
    "Explorer (2023)":{ sizes:["255/60R18","255/55R20","265/45R21"], recommended:"255/60R18" },
    "Mustang (2023)":{ sizes:["235/40R19","255/40R19","275/40R19"], recommended:"255/40R19" },
  },
  "Honda": {
    "Accord (2023)":  { sizes:["235/40R19","225/50R18"], recommended:"235/40R19" },
    "CR-V (2023)":    { sizes:["235/60R18","225/65R17"], recommended:"235/60R18" },
    "Civic (2023)":   { sizes:["235/40R18","215/55R16"], recommended:"235/40R18" },
  },
};

const COMPATIBLE: Record<string,{year:number;make:string;model:string;trim:string}[]> = {
  "225/65R17":[
    {year:2023,make:"Toyota",model:"RAV4",trim:"LE"},
    {year:2022,make:"Toyota",model:"RAV4",trim:"XLE"},
    {year:2023,make:"Honda",model:"CR-V",trim:"EX"},
    {year:2021,make:"Nissan",model:"Rogue",trim:"SL"},
    {year:2022,make:"Subaru",model:"Forester",trim:"Premium"},
  ],
  "265/70R16":[
    {year:2023,make:"Toyota",model:"Tacoma",trim:"SR5"},
    {year:2023,make:"Jeep",model:"Wrangler",trim:"Sport"},
    {year:2022,make:"Ford",model:"F-150",trim:"XL"},
    {year:2023,make:"Chevrolet",model:"Colorado",trim:"LT"},
  ],
};

export function TireSearchWizard() {
  const [tab, setTab]           = useState("size");
  const [sizeInput, setSizeInput] = useState("");
  const [results, setResults]   = useState<typeof TIRE_RESULTS["225/65R17"]>([]);
  const [searched, setSearched] = useState("");
  const [make, setMake]         = useState("");
  const [model, setModel]       = useState("");
  const [cart, setCart]         = useState<string[]>([]);

  // Compatibility checker
  const [checkSize, setCheckSize]   = useState("");
  const [compatible, setCompatible] = useState<typeof COMPATIBLE["225/65R17"]>([]);
  const [checked, setChecked]       = useState(false);

  const searchBySize = (sz?: string) => {
    const s = (sz ?? sizeInput).trim().toUpperCase().replace(/\s+/g,"");
    const res = TIRE_RESULTS[s] || [];
    setResults(res); setSearched(s);
    if (!res.length) toast.error(`No tires found for size ${s}`);
  };

  const searchByVehicle = () => {
    if (!make||!model) { toast.error("Select make and model"); return; }
    const data = VEHICLE_DATA_VEH[make]?.[model];
    if (!data) { toast.error("No data for this vehicle"); return; }
    const sz = data.recommended;
    setSizeInput(sz);
    const res = TIRE_RESULTS[sz] || [];
    setResults(res); setSearched(sz);
    toast.success(`Showing tires for ${sz} (recommended for ${model})`);
    setTab("size");
  };

  const checkCompatibility = () => {
    const s = checkSize.trim().toUpperCase().replace(/\s+/g,"");
    setCompatible(COMPATIBLE[s] || []);
    setChecked(true);
  };

  const addToCart = (sku:string) => { setCart(c=>[...c,sku]); toast.success("Added to order"); };

  const makes = Object.keys(VEHICLE_DATA_VEH);
  const models = make ? Object.keys(VEHICLE_DATA_VEH[make]) : [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tire Search Wizard</h1>
          <p className="text-sm text-muted-foreground">Find tires by size, vehicle, or check compatibility</p>
        </div>
        {cart.length>0 && <Badge className="text-sm px-3 py-1">{cart.length} item(s) in order</Badge>}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="size"><Ruler className="w-4 h-4 mr-1"/>Search by Size</TabsTrigger>
          <TabsTrigger value="vehicle"><Car className="w-4 h-4 mr-1"/>Search by Vehicle</TabsTrigger>
          <TabsTrigger value="compat"><CheckCircle2 className="w-4 h-4 mr-1"/>Compatibility Checker</TabsTrigger>
        </TabsList>

        {/* Search by Size */}
        <TabsContent value="size" className="space-y-4">
          <Card className="p-5">
            <Label className="text-base font-semibold">Enter Tire Size</Label>
            <p className="text-sm text-muted-foreground mb-3">Examples: 225/65R17, 265/70R16, 205/55R16</p>
            <div className="flex gap-2">
              <Input placeholder="e.g. 225/65R17" value={sizeInput} className="text-lg font-mono"
                onChange={e=>setSizeInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&searchBySize()}/>
              <Button onClick={()=>searchBySize()}><Search className="w-4 h-4 mr-1"/>Search</Button>
            </div>
            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.keys(TIRE_RESULTS).map(s=>(
                <Button key={s} variant="outline" size="sm" className="font-mono text-xs"
                  onClick={()=>{ setSizeInput(s); searchBySize(s); }}>{s}</Button>
              ))}
            </div>
          </Card>

          {searched && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{results.length} tire(s) found for <span className="font-mono text-primary">{searched}</span></h2>
              </div>
              {results.length===0 ? (
                <Card className="p-10 text-center text-muted-foreground"><X className="w-10 h-10 mx-auto mb-2 opacity-30"/>No tires found for this size</Card>
              ) : results.map(t=>(
                <Card key={t.sku} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{t.name}</p>
                        <Badge variant="outline">{t.category}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{t.sku}</span>
                        <span>Load: <strong>{t.load}</strong></span>
                        <span>Speed: <strong>{t.speed}</strong></span>
                        <span className={t.stock<10?"text-red-500":"text-green-600"}>Stock: <strong>{t.stock}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold">${t.price}</p>
                      <Button size="sm" onClick={()=>addToCart(t.sku)}><ShoppingCart className="w-4 h-4 mr-1"/>Add to Order</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Search by Vehicle */}
        <TabsContent value="vehicle" className="space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">Select Your Vehicle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Make</Label>
                <Select value={make} onValueChange={v=>{ setMake(v); setModel(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select Make"/></SelectTrigger>
                  <SelectContent>{makes.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel} disabled={!make}>
                  <SelectTrigger><SelectValue placeholder={make?"Select Model":"Select Make First"}/></SelectTrigger>
                  <SelectContent>{models.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {make&&model && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">Recommended sizes for {model}:</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {VEHICLE_DATA_VEH[make]?.[model]?.sizes.map(s=>(
                    <Badge key={s} variant={s===VEHICLE_DATA_VEH[make][model].recommended?"default":"outline"} className="font-mono">
                      {s}{s===VEHICLE_DATA_VEH[make][model].recommended?" ★":""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={searchByVehicle} disabled={!make||!model}>
              <Search className="w-4 h-4 mr-1"/>Find Tires for This Vehicle
            </Button>
          </Card>
        </TabsContent>

        {/* Compatibility Checker */}
        <TabsContent value="compat" className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold mb-1">Tire & Vehicle Compatibility Checker</h2>
            <p className="text-sm text-muted-foreground mb-3">Enter a tire size to see which vehicles it fits</p>
            <div className="flex gap-2">
              <Input placeholder="e.g. 225/65R17" value={checkSize} className="font-mono"
                onChange={e=>setCheckSize(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&checkCompatibility()}/>
              <Button onClick={checkCompatibility}><CheckCircle2 className="w-4 h-4 mr-1"/>Check</Button>
            </div>
          </Card>
          {checked && (
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold">
                  {compatible.length > 0
                    ? `${compatible.length} compatible vehicle(s) for ${checkSize}`
                    : `No compatibility data for ${checkSize}`}
                </h3>
              </div>
              {compatible.length===0 ? (
                <div className="p-10 text-center text-muted-foreground"><X className="w-10 h-10 mx-auto mb-2 opacity-30"/>Try 225/65R17 or 265/70R16</div>
              ) : (
                <div className="divide-y">
                  {compatible.map((v,i)=>(
                    <div key={i} className="p-4 flex items-center gap-3">
                      <Car className="w-5 h-5 text-muted-foreground"/>
                      <span className="font-medium">{v.year} {v.make} {v.model}</span>
                      <Badge variant="outline">{v.trim}</Badge>
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto"/>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
