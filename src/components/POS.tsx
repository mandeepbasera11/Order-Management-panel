import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, DollarSign, Receipt, Printer, X } from "lucide-react";
import { toast } from "sonner";

type Product = { id:string; sku:string; name:string; price:number; stock:number; category:string };
type CartItem = Product & { qty:number };

const PRODUCTS: Product[] = [
  { id:"1",  sku:"GE-Michelin-123",    name:"Michelin Defender 225/65R17",        price:145, stock:24, category:"MM"  },
  { id:"2",  sku:"GE-Goodyear-456",    name:"Goodyear Assurance 205/55R16",       price:120, stock:18, category:"MM"  },
  { id:"3",  sku:"GE-BFG-KO2",        name:"BFGoodrich KO2 265/70R17",           price:210, stock:3,  category:"AT"  },
  { id:"4",  sku:"GE-Pirelli-321",    name:"Pirelli P Zero 255/40R19",           price:280, stock:11, category:"UHP" },
  { id:"5",  sku:"GE-Continental-654",name:"Continental CrossContact 235/55R18", price:165, stock:31, category:"MM"  },
  { id:"6",  sku:"GE-Ironman-111",    name:"Ironman All Country AT 265/70R17",   price:97,  stock:44, category:"AT"  },
  { id:"7",  sku:"GE-Hankook-222",    name:"Hankook Kinergy 215/60R16",          price:88,  stock:38, category:"MM"  },
  { id:"8",  sku:"GE-Nexen-333",      name:"Nexen N5000 Plus 225/50R17",         price:75,  stock:28, category:"MM"  },
];

const PAYMENT_METHODS = ["Cash","Credit Card","Debit Card","Check","Store Credit"];

export function POS() {
  const [search, setSearch]       = useState("");
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [discount, setDiscount]   = useState("");
  const [payMethod, setPayMethod] = useState("Credit Card");
  const [customer, setCustomer]   = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{items:CartItem[];total:number;method:string;customer:string;orderNo:string}|null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? PRODUCTS : PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [search]);

  const addToCart = (p: Product) => {
    setCart(c => {
      const existing = c.find(x => x.id===p.id);
      if (existing) return c.map(x => x.id===p.id ? {...x, qty:x.qty+1} : x);
      return [...c, {...p, qty:1}];
    });
    toast.success(`${p.name.split(" ").slice(0,2).join(" ")} added`);
  };

  const updateQty = (id:string, qty:number) => {
    if (qty <= 0) { setCart(c => c.filter(x => x.id!==id)); return; }
    setCart(c => c.map(x => x.id===id ? {...x, qty} : x));
  };

  const subtotal   = cart.reduce((s,i) => s + i.price*i.qty, 0);
  const discountAmt = Math.min(subtotal, parseFloat(discount)||0);
  const taxRate    = 0.075;
  const taxable    = subtotal - discountAmt;
  const tax        = taxable * taxRate;
  const total      = taxable + tax;

  const checkout = () => {
    if (!cart.length) { toast.error("Cart is empty"); return; }
    const orderNo = `POS-${Date.now().toString().slice(-6)}`;
    setLastOrder({ items:[...cart], total, method:payMethod, customer, orderNo });
    setReceiptOpen(true);
    setCart([]); setDiscount(""); setCustomer("");
    toast.success(`Sale complete — ${orderNo}`);
  };

  return (
    <div className="flex-1 overflow-hidden flex h-full">
      {/* Left — Product Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        <div className="p-4 border-b border-border space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/>Point of Sale</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search tires by name, SKU or category..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => (
              <Card key={p.id} className={`p-4 cursor-pointer hover:border-primary transition-all hover:shadow-sm ${p.stock===0?"opacity-50 cursor-not-allowed":""}`}
                onClick={() => p.stock > 0 && addToCart(p)}>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">{p.category}</Badge>
                  <span className={`text-xs ${p.stock<5?"text-red-500 font-bold":"text-muted-foreground"}`}>
                    {p.stock===0?"Out of Stock":`${p.stock} left`}
                  </span>
                </div>
                <p className="font-medium text-sm leading-tight mb-1">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground mb-2">{p.sku}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">${p.price}</p>
                  <Button size="sm" className="h-7 text-xs" disabled={p.stock===0} onClick={e=>{e.stopPropagation();p.stock>0&&addToCart(p);}}>
                    <Plus className="w-3 h-3 mr-1"/>Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Cart & Checkout */}
      <div className="w-80 flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4"/>Current Sale
            {cart.length>0 && <Badge variant="secondary">{cart.reduce((s,i)=>s+i.qty,0)} items</Badge>}
          </h3>
          <div className="mt-2">
            <Input placeholder="Customer name (optional)" value={customer} onChange={e=>setCustomer(e.target.value)} className="text-sm h-8"/>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.length===0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">${item.price} × {item.qty} = <strong>${(item.price*item.qty).toFixed(2)}</strong></p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={()=>updateQty(item.id,item.qty-1)}><Minus className="w-3 h-3"/></Button>
                <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={()=>updateQty(item.id,item.qty+1)}><Plus className="w-3 h-3"/></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={()=>setCart(c=>c.filter(x=>x.id!==item.id))}><Trash2 className="w-3 h-3"/></Button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Discount ($)</Label>
            <Input type="number" placeholder="0.00" value={discount} onChange={e=>setDiscount(e.target.value)} className="h-8 text-sm"/>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discountAmt>0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${discountAmt.toFixed(2)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Tax (7.5%)</span><span>${tax.toFixed(2)}</span></div>
            <Separator/>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <Select value={payMethod} onValueChange={setPayMethod}>
            <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={()=>setCart([])}>
              <X className="w-3 h-3 mr-1"/>Clear
            </Button>
            <Button size="sm" className="text-xs" onClick={checkout} disabled={!cart.length}>
              <CreditCard className="w-3 h-3 mr-1"/>Charge ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5"/>Sale Receipt</DialogTitle></DialogHeader>
          {lastOrder && (
            <div className="space-y-3 text-sm font-mono">
              <div className="text-center">
                <p className="font-bold text-lg">DmTire Hub</p>
                <p className="text-muted-foreground text-xs">{new Date().toLocaleString()}</p>
                <p className="text-xs font-bold mt-1">{lastOrder.orderNo}</p>
              </div>
              {lastOrder.customer && <p className="text-center">Customer: {lastOrder.customer}</p>}
              <Separator/>
              {lastOrder.items.map(i => (
                <div key={i.id} className="flex justify-between text-xs">
                  <span className="truncate mr-2">{i.name.split(" ").slice(0,3).join(" ")} ×{i.qty}</span>
                  <span>${(i.price*i.qty).toFixed(2)}</span>
                </div>
              ))}
              <Separator/>
              <div className="flex justify-between font-bold"><span>TOTAL</span><span>${lastOrder.total.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground text-xs"><span>Payment</span><span>{lastOrder.method}</span></div>
              <Separator/>
              <p className="text-center text-xs text-muted-foreground">Thank you for your business!</p>
              <Button className="w-full" size="sm" onClick={()=>{ setReceiptOpen(false); toast.success("Receipt printed"); }}>
                <Printer className="w-4 h-4 mr-1"/>Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
