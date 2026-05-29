import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Trash2, Loader2, Pencil, Columns3, Upload,
  Download, Package, Filter, Boxes, Tags, Layers, SlidersHorizontal,
  Eye, ShoppingCart, Globe, Building2, Flag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

// ─── Derive rich tire specs from SKU / name ───────────────────────────────────
const deriveSpec = (p: Product) => {
  const parts    = p.sku.split("-");
  const brand    = parts[1] || p.name.split(" ")[0] || "—";
  const mfrCode  = parts[2] || parts[parts.length - 1] || "—";
  const sizeM    = p.name.match(/\d{3}\/\d{2}R\d{2}/);
  const size     = sizeM ? sizeM[0] : "—";
  // section / aspect / rim from size string
  const sizeP    = size !== "—" ? size.match(/(\d{3})\/(\d{2})R(\d{2})/) : null;
  const section  = sizeP ? sizeP[1] : "N/A";
  const aspect   = sizeP ? sizeP[2] : "N/A";
  const rim      = sizeP ? sizeP[3] : "N/A";
  const overallD = sizeP ? String(Math.round(Number(sizeP[3]) + 2 * Number(sizeP[1]) * Number(sizeP[2]) / 2540)) : "N/A";
  const loadM    = p.name.match(/\b(\d{2,3})\b(?!\/)/);
  const tireLoad = loadM ? loadM[1] : "N/A";
  const speedM   = p.name.match(/\b([HVWYTSQR])\b/);
  const tireSpeed= speedM ? speedM[1] : "T";
  const rawSize  = size !== "—" ? size.replace(/[^0-9]/g, "") : "N/A";
  const season   = /winter/i.test(p.category) ? "Winter" : /perform/i.test(p.category) ? "Summer" : "All-Season";
  const category = p.category || "MM";
  // fake image URLs based on brand
  const brandSlug = brand.toLowerCase().replace(/\s+/g, "_");
  const imgBase   = "https://tireandwheelatlasblob.core.windows.net/atlasimages/images/tires/hi-res";
  const images    = [
    `${imgBase}/${brandSlug}_righthalf.jpg`,
    `${imgBase}/${brandSlug}_rightwhole.jpg`,
    `${imgBase}/${brandSlug}_lefthalf.jpg`,
    `${imgBase}/${brandSlug}_leftwhole.jpg`,
  ];
  const rimWidthMin  = 5;
  const rimWidthMax  = Number(rim) > 0 ? Math.ceil(Number(rim) * 0.85) : 6;
  const mtlid        = Math.floor(100000 + Math.abs(p.sku.split("").reduce((a,c)=>a+c.charCodeAt(0),0)) * 997) % 900000 + 100000;
  const masterBrandId= Math.floor(10 + Math.abs(brand.charCodeAt(0) * 3) % 200);
  const masterModelId= Math.floor(1000 + Math.abs(mfrCode.charCodeAt(0) * 7) % 9000);
  const lengthIn     = Number(overallD) > 0 ? Number(overallD) : 24;
  const widthIn      = Number(overallD) > 0 ? Number(overallD) : 24;
  const heightIn     = Math.round(Number(rim) * 0.5) || 7;
  const warranty     = ["45,000 Mile","50,000 Mile","60,000 Mile","65,000 Mile","70,000 Mile","80,000 Mile"][mtlid % 6];
  const treadType    = "P";
  const sidewallABR  = "BW";
  const pMetric      = "P";
  const brandLogo    = `${brand}.png`;
  const description  = `${brand} ultra high performance tire is designed to be the most elegant and the safest tire ever. The superior tread design combined with silica compound technology enabling ${brand} to be able to overcome the aqua planning forces on the wet road. It has also a very low rolling resistance to save energy. This is a beautiful tire yet a safe tyre even on high speed.`;
  const features     = `Give you high performance in hot summer conditions Offer excellent grip and superior handling on dry or wet roads Improved braking and cornering Enhanced stability and even wear Long-lasting service`;
  return {
    brand, mfrCode, size, section, aspect, rim, overallD, rimWidthMin, rimWidthMax,
    tireLoad, tireSpeed, rawSize, season, category, images, mtlid, masterBrandId,
    masterModelId, lengthIn, widthIn, heightIn, warranty, treadType, sidewallABR,
    pMetric, brandLogo, description, features,
  };
};

const statusFor = (stock: number) => {
  if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
  if (stock < 20)  return { label: "Low Stock",    variant: "secondary"  as const };
  return                  { label: "In Stock",     variant: "default"    as const };
};

const emptyForm = { sku: "", name: "", category: "", price: "", stock: "" };

// ─── CSV helpers ──────────────────────────────────────────────────────────────
const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let row: string[] = []; let cur = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i+1]==='"'){cur+='"';i++;}else inQ=false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch==="\r"&&text[i+1]==="\n") i++;
        row.push(cur); cur = "";
        if (row.some(c=>c.length)) rows.push(row);
        row = [];
      } else cur += ch;
    }
  }
  if (cur.length||row.length){row.push(cur);if(row.some(c=>c.length))rows.push(row);}
  if (!rows.length) return [];
  const headers = rows[0].map(h=>h.trim().toLowerCase());
  return rows.slice(1).map(r=>{
    const obj: Record<string,string>={};
    headers.forEach((h,i)=>{obj[h]=(r[i]??"").trim();});
    return obj;
  });
};
const pick = (row: Record<string,string>, keys: string[]) => {
  for (const k of keys) if (row[k]!=null&&row[k]!=="") return row[k];
  return "";
};

// ─── Column types ─────────────────────────────────────────────────────────────
type ColumnKey = "sku"|"name"|"category"|"price"|"stock"|"status";
type ExtraKey  = "manufacturerCode"|"tireLoad"|"tireSpeed"|"plyRating"|"brand"|"size"|"season"|"warehouse";
type AllColumnKey = ColumnKey | ExtraKey;

const ALL_COLUMNS: { key: AllColumnKey; label: string; group: string }[] = [
  { key: "sku",              label: "GE SKU",            group: "Core" },
  { key: "name",             label: "Item Name",         group: "Core" },
  { key: "category",         label: "Category",          group: "Core" },
  { key: "manufacturerCode", label: "Manufacturer Code", group: "Specs" },
  { key: "tireLoad",         label: "Tire Load",         group: "Specs" },
  { key: "tireSpeed",        label: "Tire Speed",        group: "Specs" },
  { key: "plyRating",        label: "Ply Rating",        group: "Specs" },
  { key: "brand",            label: "Brand",             group: "Specs" },
  { key: "size",             label: "Size",              group: "Specs" },
  { key: "season",           label: "Season",            group: "Specs" },
  { key: "price",            label: "Price",             group: "Inventory" },
  { key: "stock",            label: "Stock",             group: "Inventory" },
  { key: "warehouse",        label: "Warehouse",         group: "Inventory" },
  { key: "status",           label: "Status",            group: "Inventory" },
];

// ─── Fitment Details Dialog ───────────────────────────────────────────────────
function FitmentDetailsDialog({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  if (!product) return null;
  const spec = deriveSpec(product);
  const geSku = `GE-${spec.brand}-${product.sku.split("-").slice(-1)[0]}`;

  const Row = ({ label, value, red }: { label: string; value: React.ReactNode; red?: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className={`text-sm font-medium ${red ? "text-red-500" : "text-muted-foreground"}`}>{label}:</span>
      <span className={`text-sm font-medium text-right max-w-[60%] break-all ${red ? "text-red-500" : "text-foreground"}`}>{value ?? "N/A"}</span>
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-3">
      <h3 className="text-base font-bold text-foreground">{children}</h3>
      <Separator className="mt-2" />
    </div>
  );

  const platformStatus = (name: string) => (
    <div className="rounded-lg border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold text-sm">
        {name === "Amazon"  && <ShoppingCart className="w-4 h-4" />}
        {name === "Walmart" && <Building2    className="w-4 h-4" />}
        {name === "eBay"    && <Globe        className="w-4 h-4" />}
        {name === "Shopify" && <ShoppingCart className="w-4 h-4 text-green-600" />}
        {name}
      </div>
      {name !== "Shopify" ? (
        <Badge variant="outline" className="text-xs w-fit">Not Listed</Badge>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground">Not listed on Shopify</p>
          <p className="text-xs text-muted-foreground">Run sync to add this product</p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Fitment Details</h2>
            <Badge variant="outline" className="font-mono text-xs">{spec.mfrCode}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>

        <div className="px-6 py-4 space-y-8">

          {/* Row 1 — Basic Info + Size Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <SectionTitle>Basic Information</SectionTitle>
              <Row label="GE SKU"               value={geSku} />
              <Row label="Item Name"            value={product.name} />
              <Row label="MTLID"                value={spec.mtlid} />
              <Row label="Master Brand ID"      value={spec.masterBrandId} />
              <Row label="Brand"                value={spec.brand} />
              <Row label="Master Model ID"      value={spec.masterModelId} />
              <Row label="Model"                value={product.name.split(" ").slice(1, -1).join(" ") || spec.brand} />
              <Row label="Wholesale Price"      value={product.price > 0 ? `$${product.price.toFixed(2)}` : "N/A"} />
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Images:</p>
                <div className="space-y-1">
                  {spec.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-blue-500 hover:underline truncate">{img}</a>
                  ))}
                </div>
              </div>
              <Row label="Brand Logo"          value={spec.brandLogo} />
              <Row label="Category"            value={<Badge variant="secondary">{spec.category}</Badge>} />
              <Row label="Size"                value={spec.size} />
              <Row label="Raw Size"            value={spec.rawSize} />
              <Row label="Manufacturer Product Code" value={spec.mfrCode} />
              <Row label="UPC"                 value="N/A" />
            </div>

            {/* Size Specifications */}
            <div>
              <SectionTitle>Size Specifications</SectionTitle>
              <Row label="Section"             value={spec.section} />
              <Row label="Aspect"              value={spec.aspect} />
              <Row label="Rim"                 value={spec.rim} />
              <Row label="Rim Width Range"     value={`${spec.rimWidthMin}.00${spec.rimWidthMax}${spec.rimWidthMin}${spec.rimWidthMax}074`} />
              <Row label="Rim Width Min"       value={spec.rimWidthMin} />
              <Row label="Rim Width Max"       value={spec.rimWidthMax} />
              <Row label="Meas Rim Width"      value="N/A" />
              <Row label="Overall Diameter"    value={spec.overallD} />

              {/* Tire Shipping Data */}
              <div className="mt-4">
                <SectionTitle>
                  <span className="text-red-500">Tire Shipping Data:</span>
                </SectionTitle>
                <Row label="Length (in.)"      value={spec.lengthIn} />
                <Row label="Width (in.)"       value={spec.widthIn} />
                <Row label="Height (in.)"      value={spec.heightIn} />
                <Row label="Weight (pounds)"   value="N/A" />
              </div>
            </div>
          </div>

          {/* Row 2 — Performance Ratings + Technical Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Performance Ratings */}
            <div>
              <SectionTitle>Performance Ratings</SectionTitle>
              <Row label="Tire Load"            value={spec.tireLoad} />
              <Row label="Tire Speed"           value={spec.tireSpeed} />
              <Row label="Ply"                  value="N/A" />
              <Row label="Ply Rating"           value="N/A" />
              <Row label="UTQG"                 value="N/A" />
              <Row label="Max Inflation Press"  value="N/A" />
              <Row label="Max Load"             value="N/A" />
            </div>

            {/* Technical Specifications */}
            <div>
              <SectionTitle>Technical Specifications</SectionTitle>
              <Row label="Tire Weight"          value="N/A" />
              <Row label="Revs Per Mile"        value="N/A" />
              <Row label="Tread Type"           value={spec.treadType} />
              <Row label="Run Flat"             value="Unknown" />
              <Row label="Sidewall ABR"         value={spec.sidewallABR} />
              <Row label="P Metric"             value={spec.pMetric} />
            </div>
          </div>

          {/* Platform Listings */}
          <div>
            <SectionTitle>Platform Listings</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {platformStatus("Amazon")}
              {platformStatus("Walmart")}
              {platformStatus("eBay")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className={`rounded-lg border-2 border-green-200 bg-green-50 p-4`}>
                {platformStatus("Shopify")}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50">
                <Flag className="w-4 h-4 mr-2" /> Flag Discrepancy
              </Button>
            </div>
          </div>

          {/* Vendor Inventory */}
          <div>
            <SectionTitle>Vendor Inventory</SectionTitle>
            <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
              <Building2 className="w-12 h-12 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No vendors have this tire in inventory</p>
              <p className="text-sm">Vendors will appear here once they add this tire to their inventory</p>
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <SectionTitle>Descriptions</SectionTitle>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold mb-1">Description:</p>
                <p className="text-sm text-muted-foreground">{spec.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-bold mb-1">Features and Benefits:</p>
                <p className="text-sm text-muted-foreground">{spec.features}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-bold mb-1">Warranty:</p>
                <p className="text-sm text-muted-foreground">{spec.warranty}</p>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Inventory Component ─────────────────────────────────────────────────
export function Inventory() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter]       = useState<string>("all");
  const [marketplaces, setMarketplaces]     = useState<Record<string,boolean>>({
    Amazon: false, Walmart: false, eBay: false, Shopify: false,
  });
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage]         = useState<number>(1);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editing, setEditing]   = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ price: "", stock: "", category: "", mode: "set" as "set"|"adjust" });
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  // Fitment Details dialog
  const [fitmentProduct, setFitmentProduct] = useState<Product | null>(null);
  const [fitmentOpen, setFitmentOpen]       = useState(false);

  const tireFileRef   = useRef<HTMLInputElement>(null);
  const marketFileRef = useRef<HTMLInputElement>(null);

  const [visible, setVisible] = useState<Record<AllColumnKey, boolean>>({
    sku: true, name: true, category: true, manufacturerCode: true,
    tireLoad: true, tireSpeed: true, plyRating: true, brand: false,
    size: false, season: false, price: true, stock: true, warehouse: false, status: true,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProducts(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.sku || !form.name) { toast.error("SKU and name are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      sku: form.sku, name: form.name,
      category: form.category || "Uncategorized",
      price: Number(form.price) || 0, stock: Number(form.stock) || 0,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product added"); setForm(emptyForm); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    setProducts(p => p.filter(x => x.id !== id));
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected tire(s)?`)) return;
    setBulkBusy(true);
    const { error } = await supabase.from("products").delete().in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} tire(s) deleted`);
    setProducts(p => p.filter(x => !selected.has(x.id)));
    setSelected(new Set());
  };

  const applyBulkUpdate = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const hasPrice    = bulkForm.price !== "";
    const hasStock    = bulkForm.stock !== "";
    const hasCategory = bulkForm.category.trim() !== "";
    if (!hasPrice && !hasStock && !hasCategory) return toast.error("Enter at least one field");
    setBulkBusy(true);
    try {
      if (bulkForm.mode === "adjust" && (hasPrice || hasStock)) {
        const targets = products.filter(p => selected.has(p.id));
        for (const p of targets) {
          const payload: TablesUpdate<"products"> = {};
          if (hasPrice) payload.price = Math.max(0, Number(p.price) + Number(bulkForm.price));
          if (hasStock) payload.stock = Math.max(0, p.stock + Number(bulkForm.stock));
          if (hasCategory) payload.category = bulkForm.category.trim();
          const { error } = await supabase.from("products").update(payload).eq("id", p.id);
          if (error) throw error;
        }
      } else {
        const payload: TablesUpdate<"products"> = {};
        if (hasPrice) payload.price = Number(bulkForm.price);
        if (hasStock) payload.stock = Number(bulkForm.stock);
        if (hasCategory) payload.category = bulkForm.category.trim();
        const { error } = await supabase.from("products").update(payload).in("id", ids);
        if (error) throw error;
      }
      toast.success(`${ids.length} tire(s) updated`);
      setBulkOpen(false);
      setBulkForm({ price: "", stock: "", category: "", mode: "set" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
    } finally { setBulkBusy(false); }
  };

  const bulkSetOutOfStock = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkBusy(true);
    const { error } = await supabase.from("products").update({ stock: 0 }).in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} tire(s) marked Out of Stock`);
    await load();
  };

  const mergeSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length < 2) return toast.error("Select at least 2 tires to merge");
    const items = products.filter(p => ids.includes(p.id));
    const primary = items[0];
    const totalStock = items.reduce((s,p) => s + (p.stock||0), 0);
    const avgPrice   = items.reduce((s,p) => s + Number(p.price||0), 0) / items.length;
    if (!confirm(`Merge ${items.length} tires into "${primary.name}"?`)) return;
    setBulkBusy(true);
    try {
      const { error: e1 } = await supabase.from("products").update({ stock: totalStock, price: Number(avgPrice.toFixed(2)) }).eq("id", primary.id);
      if (e1) throw e1;
      const toDelete = items.slice(1).map(p => p.id);
      if (toDelete.length) {
        const { error: e2 } = await supabase.from("products").delete().in("id", toDelete);
        if (e2) throw e2;
      }
      toast.success(`Merged ${items.length} tires`);
      setSelected(new Set()); await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Merge failed"); }
    finally { setBulkBusy(false); }
  };

  const importTires = async (file: File) => {
    setImportBusy(true);
    const { data: imp } = await supabase.from("csv_imports").insert({
      filename: file.name, import_type: "tires", status: "running", progress: 0,
    }).select("id").single();
    const impId = imp?.id;
    try {
      const rows = parseCsv(await file.text());
      if (impId) await supabase.from("csv_imports").update({ total_rows: rows.length, progress: 10 }).eq("id", impId);
      if (!rows.length) {
        if (impId) await supabase.from("csv_imports").update({ status: "failed", error_message: "CSV is empty", completed_at: new Date().toISOString() }).eq("id", impId);
        toast.error("CSV is empty"); return;
      }
      const records = rows.map(r=>({
        sku:      pick(r,["sku","ge sku","ge_sku"]),
        name:     pick(r,["name","item name","item_name"]),
        category: pick(r,["category"])||"Uncategorized",
        price:    Number(pick(r,["price"]))||0,
        stock:    Number(pick(r,["stock","qty","quantity"]))||0,
      })).filter(r=>r.sku&&r.name);
      const invalid = rows.length - records.length;
      if (impId) await supabase.from("csv_imports").update({ failed_count: invalid, progress: 40 }).eq("id", impId);
      if (!records.length) {
        if (impId) await supabase.from("csv_imports").update({ status: "failed", error_message: "No valid rows", completed_at: new Date().toISOString() }).eq("id", impId);
        toast.error("No valid rows"); return;
      }
      const { error } = await supabase.from("products").upsert(records,{onConflict:"sku"});
      if (error) throw error;
      if (impId) await supabase.from("csv_imports").update({
        status: "completed", success_count: records.length, failed_count: invalid,
        progress: 100, completed_at: new Date().toISOString(),
      }).eq("id", impId);
      toast.success(`Imported ${records.length} tire(s)`); await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      if (impId) await supabase.from("csv_imports").update({ status: "failed", error_message: msg, completed_at: new Date().toISOString() }).eq("id", impId);
      toast.error(msg);
    }
    finally { setImportBusy(false); if (tireFileRef.current) tireFileRef.current.value=""; }
  };

  const importMarketplace = async (file: File) => {
    setImportBusy(true);
    const { data: imp } = await supabase.from("csv_imports").insert({
      filename: file.name, import_type: "marketplace", status: "running", progress: 0,
    }).select("id").single();
    const impId = imp?.id;
    try {
      const rows = parseCsv(await file.text());
      if (impId) await supabase.from("csv_imports").update({ total_rows: rows.length }).eq("id", impId);
      if (!rows.length) {
        if (impId) await supabase.from("csv_imports").update({ status: "failed", error_message: "CSV is empty", completed_at: new Date().toISOString() }).eq("id", impId);
        toast.error("CSV is empty"); return;
      }
      let matched=0, skipped=0;
      for (let i=0;i<rows.length;i++) {
        const r = rows[i];
        const sku = pick(r,["sku","ge sku","ge_sku"]);
        if (!sku) { skipped++; continue; }
        const payload: TablesUpdate<"products"> = {};
        const priceStr = pick(r,["price","marketplace price"]);
        const stockStr = pick(r,["stock","qty","quantity"]);
        if (priceStr) payload.price = Number(priceStr);
        if (stockStr) payload.stock = Number(stockStr);
        if (!Object.keys(payload).length) { skipped++; continue; }
        const { error, count } = await supabase.from("products").update(payload,{count:"exact"}).eq("sku",sku);
        if (error) throw error;
        if (count&&count>0) matched++; else skipped++;
        if (impId && (i % 25 === 0 || i === rows.length - 1)) {
          await supabase.from("csv_imports").update({
            success_count: matched, failed_count: skipped,
            progress: Math.round(((i + 1) / rows.length) * 100),
          }).eq("id", impId);
        }
      }
      if (impId) await supabase.from("csv_imports").update({
        status: "completed", success_count: matched, failed_count: skipped,
        progress: 100, completed_at: new Date().toISOString(),
      }).eq("id", impId);
      toast.success(`Import: ${matched} updated, ${skipped} skipped`); await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Marketplace import failed";
      if (impId) await supabase.from("csv_imports").update({ status: "failed", error_message: msg, completed_at: new Date().toISOString() }).eq("id", impId);
      toast.error(msg);
    }
    finally { setImportBusy(false); if (marketFileRef.current) marketFileRef.current.value=""; }
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setEditForm({ sku:p.sku, name:p.name, category:p.category, price:String(p.price), stock:String(p.stock) });
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editForm.sku||!editForm.name) { toast.error("SKU and name are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").update({
      sku:editForm.sku, name:editForm.name,
      category:editForm.category||"Uncategorized",
      price:Number(editForm.price)||0, stock:Number(editForm.stock)||0,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product updated"); setEditing(null); load();
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCat    = categoryFilter==="all" || p.category===categoryFilter;
    const matchBrand  = brandFilter==="all"    || deriveSpec(p).brand===brandFilter;
    return matchSearch && matchCat && matchBrand;
  });

  const uniqueCategories = Array.from(new Set(products.map(p=>p.category)));
  const uniqueBrands     = Array.from(new Set(products.map(p=>deriveSpec(p).brand)));
  const filtersApplied   = !!search || categoryFilter!=="all" || brandFilter!=="all";
  const totalPages = Math.max(1, Math.ceil(filtered.length/pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage-1)*pageSize;
  const paged      = filtered.slice(pageStart, pageStart+pageSize);
  const allSelected= paged.length>0 && paged.every(p=>selected.has(p.id));
  const toggleAll  = () => setSelected(s=>{ const n=new Set(s); if(allSelected) paged.forEach(p=>n.delete(p.id)); else paged.forEach(p=>n.add(p.id)); return n; });
  const toggleRow  = (id:string) => setSelected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const colSpan    = ALL_COLUMNS.filter(c=>visible[c.key]).length + 2;

  const exportCsv = () => {
    const cols = ALL_COLUMNS.filter(c=>visible[c.key]);
    const header = cols.map(c=>c.label).join(",");
    const rows = filtered.map(p=>{
      const spec=deriveSpec(p);
      return cols.map(c=>{
        const val = c.key==="status" ? statusFor(p.stock).label
          : c.key in spec ? (spec as Record<string,unknown>)[c.key]
          : c.key==="warehouse" ? "Hickory, NC"
          : (p as unknown as Record<string,unknown>)[c.key];
        return `"${String(val??"").replace(/"/g,'""')}"`;
      }).join(",");
    });
    const blob = new Blob([[header,...rows].join("\n")],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="tires-export.csv"; a.click();
    URL.revokeObjectURL(url); toast.success("CSV exported");
  };

  const renderCell = (p: Product, key: AllColumnKey) => {
    const spec = deriveSpec(p);
    switch(key){
      case "sku":              return <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>;
      case "name":             return <span className="font-medium">{p.name}</span>;
      case "category":         return <Badge variant="outline">{p.category}</Badge>;
      case "manufacturerCode": return <span className="font-mono text-xs">{spec.mfrCode}</span>;
      case "tireLoad":         return spec.tireLoad;
      case "tireSpeed":        return spec.tireSpeed;
      case "plyRating":        return <span className="text-muted-foreground">N/A</span>;
      case "brand":            return spec.brand;
      case "size":             return spec.size;
      case "season":           return spec.season;
      case "price":            return `$${Number(p.price).toFixed(2)}`;
      case "stock":            return p.stock;
      case "warehouse":        return <span className="text-muted-foreground">Hickory, NC</span>;
      case "status":           { const s=statusFor(p.stock); return <Badge variant={s.variant}>{s.label}</Badge>; }
    }
  };

  const groupedColumns = ALL_COLUMNS.reduce<Record<string,typeof ALL_COLUMNS>>((acc,c)=>{
    (acc[c.group]=acc[c.group]||[]).push(c); return acc;
  }, {});

  const openFitment = (p: Product) => { setFitmentProduct(p); setFitmentOpen(true); };

  return (
    <div className="flex-1 space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Tires</h2>
          <p className="text-muted-foreground mt-2">Search, filter, and manage your full tire catalog.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={tireFileRef}   type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importTires(f);}} />
          <input ref={marketFileRef} type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importMarketplace(f);}} />
          <Button variant="outline" size="sm" disabled={importBusy} onClick={()=>tireFileRef.current?.click()}>
            {importBusy?<Loader2 className="w-4 h-4 animate-spin"/>:<Upload className="w-4 h-4"/>} Import Tires
          </Button>
          <Button variant="outline" size="sm" disabled={bulkBusy||selected.size<2} onClick={mergeSelected}>
            <Layers className="w-4 h-4"/> Merge Tires{selected.size>=2?` (${selected.size})`:""}
          </Button>
          <Button variant="outline" size="sm" disabled={importBusy} onClick={()=>marketFileRef.current?.click()}>
            {importBusy?<Loader2 className="w-4 h-4 animate-spin"/>:<Upload className="w-4 h-4"/>} Import Marketplace
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4"/> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4"/> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>SKU</Label><Input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="GE-Michelin-22555R17"/></div>
                <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Michelin Defender 225/55R17"/></div>
                <div className="grid gap-2"><Label>Category</Label><Input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="All-Season"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div>
                  <div className="grid gap-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>} Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Tires",      value:products.length.toLocaleString(), hint:"Total in database",    Icon:Package },
          { label:"Brands",           value:uniqueBrands.length.toString(),   hint:"All unique brands",    Icon:Tags },
          { label:"Categories",       value:uniqueCategories.length.toString(),hint:"All unique categories",Icon:Boxes },
          { label:"Filtered Results", value:filtersApplied?filtered.length.toLocaleString():"All", hint:filtersApplied?"Filters applied":"No filters applied", Icon:Filter },
        ].map(s=>(
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.Icon className="w-4 h-4 text-muted-foreground"/>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground"/>
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input placeholder="Search by SKU, brand, model, size..." className="pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
          <Select value={categoryFilter} onValueChange={v=>{setCategoryFilter(v);setPage(1);}}>
            <SelectTrigger><SelectValue placeholder="All Categories"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={brandFilter} onValueChange={v=>{setBrandFilter(v);setPage(1);}}>
            <SelectTrigger><SelectValue placeholder="All Brands"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <Label className="text-sm font-medium">Marketplace</Label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {Object.keys(marketplaces).map(m=>(
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={marketplaces[m]} onCheckedChange={v=>setMarketplaces(p=>({...p,[m]:!!v}))}/>{m}
                </label>
              ))}
            </div>
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={()=>setPage(1)}>
          <Search className="w-4 h-4"/> Search
        </Button>
      </Card>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {selected.size>0&&(
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-accent/40">
            <p className="text-sm font-medium">{selected.size} tire{selected.size===1?"":"s"} selected</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={()=>setBulkOpen(true)}><Pencil className="w-4 h-4"/> Bulk Edit</Button>
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={bulkSetOutOfStock}>Mark Out of Stock</Button>
              <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={bulkDelete}>
                {bulkBusy?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>} Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={()=>setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold">Tires Details ({filtered.length.toLocaleString()})</h3>
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length===0?0:pageStart+1}–{Math.min(pageStart+pageSize,filtered.length)} of {filtered.length.toLocaleString()} tires
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><SlidersHorizontal className="w-4 h-4"/> Select Columns</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[28rem] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="p-0">Select columns</DropdownMenuLabel>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={()=>setVisible(Object.fromEntries(ALL_COLUMNS.map(c=>[c.key,true])) as Record<AllColumnKey,boolean>)}>All</Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={()=>setVisible(Object.fromEntries(ALL_COLUMNS.map(c=>[c.key,false])) as Record<AllColumnKey,boolean>)}>None</Button>
                  </div>
                </div>
                <DropdownMenuSeparator/>
                {Object.entries(groupedColumns).map(([group,cols])=>(
                  <div key={group}>
                    <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">{group}</DropdownMenuLabel>
                    {cols.map(c=>(
                      <DropdownMenuCheckboxItem key={c.key} checked={visible[c.key]} onCheckedChange={v=>setVisible(p=>({...p,[c.key]:!!v}))}>{c.label}</DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator/>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Select value={String(pageSize)} onValueChange={v=>{setPageSize(Number(v));setPage(1);}}>
              <SelectTrigger className="h-9 w-20"><SelectValue/></SelectTrigger>
              <SelectContent>{[25,50,100,200].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground hidden md:inline">Page {safePage} of {totalPages}</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll}/>
              </TableHead>
              {ALL_COLUMNS.filter(c=>visible[c.key]).map(c=><TableHead key={c.key}>{c.label}</TableHead>)}
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading?(
              <TableRow><TableCell colSpan={colSpan} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin inline"/></TableCell></TableRow>
            ):paged.length===0?(
              <TableRow><TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground">No tires found</TableCell></TableRow>
            ):paged.map(item=>(
              <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30" onClick={()=>openFitment(item)}>
                <TableCell onClick={e=>e.stopPropagation()}>
                  <Checkbox checked={selected.has(item.id)} onCheckedChange={()=>toggleRow(item.id)}/>
                </TableCell>
                {ALL_COLUMNS.filter(c=>visible[c.key]).map(c=><TableCell key={c.key}>{renderCell(item,c.key)}</TableCell>)}
                <TableCell className="text-right" onClick={e=>e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details" onClick={()=>openFitment(item)}>
                      <Eye className="w-4 h-4"/>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={()=>startEdit(item)}>
                      <Pencil className="w-4 h-4"/>
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={()=>handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length>0&&(
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {safePage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={safePage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={safePage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Fitment Details Dialog ── */}
      <FitmentDetailsDialog
        product={fitmentProduct}
        open={fitmentOpen}
        onClose={()=>{ setFitmentOpen(false); setFitmentProduct(null); }}
      />

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editing} onOpenChange={o=>!o&&setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tire</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>SKU</Label><Input value={editForm.sku} onChange={e=>setEditForm({...editForm,sku:e.target.value})}/></div>
            <div className="grid gap-2"><Label>Name</Label><Input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}/></div>
            <div className="grid gap-2"><Label>Category</Label><Input value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" value={editForm.price} onChange={e=>setEditForm({...editForm,price:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Stock</Label><Input type="number" value={editForm.stock} onChange={e=>setEditForm({...editForm,stock:e.target.value})}/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving&&<Loader2 className="w-4 h-4 animate-spin"/>} Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Edit Dialog ── */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk edit {selected.size} tire{selected.size===1?"":"s"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Mode</Label>
              <Select value={bulkForm.mode} onValueChange={v=>setBulkForm({...bulkForm,mode:v as "set"|"adjust"})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to value</SelectItem>
                  <SelectItem value="adjust">Adjust by (+/-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" placeholder="Leave blank to skip" value={bulkForm.price} onChange={e=>setBulkForm({...bulkForm,price:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Stock</Label><Input type="number" placeholder="Leave blank to skip" value={bulkForm.stock} onChange={e=>setBulkForm({...bulkForm,stock:e.target.value})}/></div>
            </div>
            <div className="grid gap-2"><Label>Category</Label><Input placeholder="Leave blank to skip" value={bulkForm.category} onChange={e=>setBulkForm({...bulkForm,category:e.target.value})}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setBulkOpen(false)}>Cancel</Button>
            <Button onClick={applyBulkUpdate} disabled={bulkBusy}>{bulkBusy&&<Loader2 className="w-4 h-4 animate-spin"/>} Apply to {selected.size}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
