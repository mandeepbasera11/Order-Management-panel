import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Car, ArrowRight } from "lucide-react";

const TIRES = [
  { size:"225/65R17", fits:[
    { year:"2018-2024", make:"Honda",    model:"CR-V",      trims:"EX, EX-L, Touring" },
    { year:"2019-2023", make:"Toyota",   model:"RAV4",      trims:"LE, XLE" },
    { year:"2020-2024", make:"Mazda",    model:"CX-5",      trims:"Sport, Touring" },
  ]},
  { size:"205/55R16", fits:[
    { year:"2016-2022", make:"Honda",    model:"Civic",     trims:"LX, Sport" },
    { year:"2014-2019", make:"Toyota",   model:"Corolla",   trims:"LE, SE" },
    { year:"2017-2023", make:"Hyundai",  model:"Elantra",   trims:"SE, SEL" },
  ]},
  { size:"265/70R17", fits:[
    { year:"2015-2024", make:"Ford",     model:"F-150",     trims:"XL, XLT" },
    { year:"2019-2024", make:"Chevy",    model:"Silverado", trims:"WT, Custom" },
    { year:"2017-2023", make:"Toyota",   model:"Tacoma",    trims:"SR5, TRD Sport" },
  ]},
  { size:"255/40R19", fits:[
    { year:"2017-2024", make:"BMW",      model:"3 Series",  trims:"330i, M340i" },
    { year:"2018-2023", make:"Audi",     model:"A5",        trims:"Premium, Prestige" },
  ]},
];

export function TiresReverseLookup() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.toLowerCase().trim();
    return !s ? TIRES : TIRES.filter(t => t.size.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Search className="w-7 h-7 text-primary"/>Tires Reverse Lookup
        </h2>
        <p className="text-muted-foreground mt-1">Enter a tire size and discover every vehicle it fits.</p>
      </div>
      <Card className="p-5">
        <div className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="e.g. 225/65R17" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <Button>Lookup <ArrowRight className="w-4 h-4 ml-2"/></Button>
        </div>
      </Card>
      <div className="space-y-4">
        {results.map(t => (
          <Card key={t.size} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{t.size}</h3>
              <Badge variant="secondary">{t.fits.length} vehicles</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.fits.map((f,i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <Car className="w-5 h-5 text-primary mt-0.5"/>
                  <div>
                    <p className="font-medium text-sm">{f.year} {f.make} {f.model}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.trims}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {!results.length && <Card className="p-10 text-center text-muted-foreground">No matches for "{q}"</Card>}
      </div>
    </div>
  );
}