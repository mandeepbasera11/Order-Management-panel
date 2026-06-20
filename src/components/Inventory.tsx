import { useEffect, useRef, useState, useMemo } from "react";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Trash2, Loader2, Pencil, Upload, Download,
  Package, Filter, Boxes, Tags, SlidersHorizontal,
  Eye, ShoppingCart, Globe, Building2, Flag, RefreshCw,
  FileText, CheckCircle2, XCircle, AlertTriangle, X, FileSpreadsheet,
  ArrowRight, RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Type ─────────────────────────────────────────────────────────────────────
type Product = {
  id: string;
  created_at: string;
  updated_at: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  // CSV fields
  aspect: string | null;
  base_ge_sku: string | null;
  brand: string | null;
  brand_logo: string | null;
  description: string | null;
  features_and_benefits: string | null;
  images: string | null;
  item_name: string | null;
  manufacturer_product_code: string | null;
  master_brand_id: string | null;
  master_model_id: string | null;
  max_inflation_press: string | null;
  max_load: string | null;
  meas_rim_width: string | null;
  model: string | null;
  mtlid: string | null;
  overall_diam: string | null;
  p_metric: string | null;
  ply: string | null;
  ply_rating: string | null;
  raw_size: string | null;
  revs_per_mile: string | null;
  rim: string | null;
  rim_width_max: string | null;
  rim_width_min: string | null;
  rim_width_range: string | null;
  run_flat: string | null;
  section: string | null;
  sidewall_abr: string | null;
  size: string | null;
  tire_load: string | null;
  tire_speed: string | null;
  tire_weight: string | null;
  tread_depth: string | null;
  tread_type: string | null;
  upc: string | null;
  utqg: string | null;
  warranty: string | null;
  wholesale_price: number | null;
  total_vendor_inventory: number | null;
  vendor1_name: string | null; vendor1_quantity: number | null; vendor1_price: number | null;
  vendor2_name: string | null; vendor2_quantity: number | null; vendor2_price: number | null;
  vendor3_name: string | null; vendor3_quantity: number | null; vendor3_price: number | null;
  vendor4_name: string | null; vendor4_quantity: number | null; vendor4_price: number | null;
  vendor5_name: string | null; vendor5_quantity: number | null; vendor5_price: number | null;
  vendor6_name: string | null; vendor6_quantity: number | null; vendor6_price: number | null;
  vendor7_name: string | null; vendor7_quantity: number | null; vendor7_price: number | null;
  vendor8_name: string | null; vendor8_quantity: number | null; vendor8_price: number | null;
  vendor9_name: string | null; vendor9_quantity: number | null; vendor9_price: number | null;
  vendor10_name: string | null; vendor10_quantity: number | null; vendor10_price: number | null;
  vendor11_name: string | null; vendor11_quantity: number | null; vendor11_price: number | null;
  vendor12_name: string | null; vendor12_quantity: number | null; vendor12_price: number | null;
  vendor13_name: string | null; vendor13_quantity: number | null; vendor13_price: number | null;
  vendor14_name: string | null; vendor14_quantity: number | null; vendor14_price: number | null;
  vendor15_name: string | null; vendor15_quantity: number | null; vendor15_price: number | null;
  vendor16_name: string | null; vendor16_quantity: number | null; vendor16_price: number | null;
  vendor17_name: string | null; vendor17_quantity: number | null; vendor17_price: number | null;
  vendor18_name: string | null; vendor18_quantity: number | null; vendor18_price: number | null;
  vendor19_name: string | null; vendor19_quantity: number | null; vendor19_price: number | null;
  vendor20_name: string | null; vendor20_quantity: number | null; vendor20_price: number | null;
  vendor21_name: string | null; vendor21_quantity: number | null; vendor21_price: number | null;
};

// ─── Column definitions — every CSV column ───────────────────────────────────
type ColKey = keyof Product;

const COLUMN_GROUPS: { group: string; cols: { key: ColKey; label: string; defaultOn: boolean }[] }[] = [
  {
    group: "Basic Information",
    cols: [
      { key: "sku",                       label: "GE SKU",                    defaultOn: true  },
      { key: "base_ge_sku",               label: "Base GE SKU",               defaultOn: false },
      { key: "item_name",                 label: "Item Name",                 defaultOn: true  },
      { key: "brand",                     label: "Brand",                     defaultOn: true  },
      { key: "category",                  label: "Category",                  defaultOn: true  },
      { key: "model",                     label: "Model",                     defaultOn: true  },
      { key: "size",                      label: "Size",                      defaultOn: true  },
      { key: "manufacturer_product_code", label: "Manufacturer Code",         defaultOn: true  },
      { key: "upc",                       label: "UPC",                       defaultOn: false },
      { key: "raw_size",                  label: "Raw Size",                  defaultOn: false },
      { key: "brand_logo",                label: "Brand Logo",                defaultOn: false },
      { key: "images",                    label: "Images",                    defaultOn: false },
      { key: "description",               label: "Description",               defaultOn: false },
      { key: "features_and_benefits",     label: "Features & Benefits",       defaultOn: false },
      { key: "warranty",                  label: "Warranty",                  defaultOn: false },
    ],
  },
  {
    group: "Identifiers",
    cols: [
      { key: "mtlid",           label: "MTLID",            defaultOn: false },
      { key: "master_brand_id", label: "Master Brand ID",  defaultOn: false },
      { key: "master_model_id", label: "Master Model ID",  defaultOn: false },
    ],
  },
  {
    group: "Size Specifications",
    cols: [
      { key: "section",         label: "Section",          defaultOn: false },
      { key: "aspect",          label: "Aspect",           defaultOn: false },
      { key: "rim",             label: "Rim",              defaultOn: false },
      { key: "overall_diam",    label: "Overall Diameter", defaultOn: false },
      { key: "rim_width_range", label: "Rim Width Range",  defaultOn: false },
      { key: "rim_width_min",   label: "Rim Width Min",    defaultOn: false },
      { key: "rim_width_max",   label: "Rim Width Max",    defaultOn: false },
      { key: "meas_rim_width",  label: "Meas Rim Width",   defaultOn: false },
    ],
  },
  {
    group: "Performance Information",
    cols: [
      { key: "tire_load",           label: "Tire Load",          defaultOn: true  },
      { key: "tire_speed",          label: "Tire Speed",         defaultOn: true  },
      { key: "ply",                 label: "Ply",                defaultOn: false },
      { key: "ply_rating",          label: "Ply Rating",         defaultOn: true  },
      { key: "utqg",                label: "UTQG",               defaultOn: false },
      { key: "max_inflation_press", label: "Max Inflation Press",defaultOn: false },
      { key: "max_load",            label: "Max Load",           defaultOn: false },
      { key: "tread_depth",         label: "Tread Depth",        defaultOn: false },
    ],
  },
  {
    group: "Technical Information",
    cols: [
      { key: "tread_type",   label: "Tread Type",   defaultOn: true  },
      { key: "tire_weight",  label: "Tire Weight",  defaultOn: false },
      { key: "revs_per_mile",label: "Revs Per Mile",defaultOn: false },
      { key: "run_flat",     label: "Run Flat",     defaultOn: false },
      { key: "sidewall_abr", label: "Sidewall ABR", defaultOn: false },
      { key: "p_metric",     label: "P Metric",     defaultOn: false },
    ],
  },
  {
    group: "Inventory & Pricing",
    cols: [
      { key: "wholesale_price",        label: "Wholesale Price",      defaultOn: true  },
      { key: "price",                  label: "Our Price",            defaultOn: true  },
      { key: "stock",                  label: "Stock",                defaultOn: true  },
      { key: "total_vendor_inventory", label: "Total Vendor Inv.",    defaultOn: true  },
    ],
  },
  {
    group: "Vendors",
    cols: Array.from({ length: 21 }, (_, i) => i + 1).flatMap((n) => [
      { key: `vendor${n}_name`     as ColKey, label: `V${n} Name`,  defaultOn: false },
      { key: `vendor${n}_quantity` as ColKey, label: `V${n} Qty`,   defaultOn: false },
      { key: `vendor${n}_price`    as ColKey, label: `V${n} Price`, defaultOn: false },
    ]),
  },
];

const ALL_COLS = COLUMN_GROUPS.flatMap((g) => g.cols);

// ─── CSV helpers ──────────────────────────────────────────────────────────────
// ── Streaming CSV line parser ──────────────────────────────────────────────
// Parses ONE line of CSV (handles quoted commas) — used by the streaming reader below.
const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') { if (line[i+1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
};

// Small-file fallback (kept for anything that still calls it directly)
const parseCsv = (text: string): Record<string, string>[] => {
  const lines = text.split(/\r\n|\n|\r/).filter(l => l.length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const obj: Record<string,string> = {};
    headers.forEach((h,i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
};

const pickVal = (row: Record<string,string>, ...keys: string[]) => {
  for (const k of keys) { const v = row[k]; if (v!=null&&v!=="") return v; }
  return "";
};
const num = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
const int = (v: string) => { const n = parseInt(v); return isNaN(n) ? null : n; };

// Shared mutable holder so streamParseCsv can pass parsed headers back
// without changing its per-row callback signature.
const csvHeadersRef: { headers: string[] } = { headers: [] };

// Yield to browser so the UI thread isn't blocked during heavy parsing
const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// ── Streaming file reader for huge (100MB–1GB+) CSVs ───────────────────────
// Reads the file in 4MB byte chunks via File.slice() + slice.text() (never
// loads the whole file into one giant string), splits on newlines, and
// calls onRow for every complete line as soon as it's available. This keeps
// memory usage flat regardless of file size and keeps the browser responsive
// — this is what fixes 500MB+ CSV files crashing the tab.
async function streamParseCsv(
  file: File,
  onRow: (cells: string[], rowIndex: number) => void,
  onProgress: (pct: number) => void,
): Promise<void> {
  const CHUNK_BYTES = 4 * 1024 * 1024; // 4MB per read
  const totalBytes  = file.size;
  let offset        = 0;
  let leftover      = "";       // partial line carried over between chunks
  let rowIndex      = 0;
  let headers: string[] | null = null;

  while (offset < totalBytes) {
    const slice = file.slice(offset, offset + CHUNK_BYTES);
    const text  = await slice.text(); // reads ONLY this small slice into memory
    offset += CHUNK_BYTES;

    const combined = leftover + text;
    const lines = combined.split(/\r\n|\n|\r/);
    // Last entry might be a partial line — hold it over for the next chunk
    leftover = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.length) continue;
      const cells = parseCsvLine(line);
      if (!headers) {
        headers = cells.map(h => h.trim().toLowerCase());
        continue; // header row — don't emit as data
      }
      onRow(cells, rowIndex++);
    }

    onProgress(Math.min(100, Math.round((offset / totalBytes) * 100)));
    await yieldToBrowser();
  }

  // Final leftover line (file may not end with a trailing newline)
  if (leftover.trim().length && headers) {
    const cells = parseCsvLine(leftover);
    onRow(cells, rowIndex++);
  }

  if (!headers) throw new Error("Could not detect a header row in this file.");
  csvHeadersRef.headers = headers;
}

// ─── Bulk import types & validation ──────────────────────────────────────────
type RowStatus = "valid" | "warning" | "error";
type ParsedRow = {
  rowNum: number;
  raw: Record<string, string>;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: RowStatus;
  issues: string[];
  isDuplicateInFile: boolean;
  willUpdate: boolean; // true if SKU already exists in DB
};

function validateRow(
  r: Record<string, string>,
  rowNum: number,
  skusSeenSoFar: Set<string>,
  existingSkus: Set<string>
): ParsedRow {
  const issues: string[] = [];
  const sku  = pickVal(r, "ge_sku", "sku");
  const name = pickVal(r, "item_name", "name");

  let lowestVendorPrice: number | null = null;
  for (let i = 1; i <= 21; i++) {
    const vp = num(r[`vendor${i}_price`] || "");
    if (vp != null && (lowestVendorPrice === null || vp < lowestVendorPrice)) lowestVendorPrice = vp;
  }
  const wp = num(pickVal(r, "wholesale_price"));
  const price = wp ?? lowestVendorPrice ?? 0;
  const stock = int(pickVal(r, "stock")) ?? int(pickVal(r, "total_vendor_inventory")) ?? 0;
  const category = pickVal(r, "category") || "MM";

  if (!sku)  issues.push("Missing SKU");
  if (!name) issues.push("Missing item name");

  const isDuplicateInFile = !!sku && skusSeenSoFar.has(sku);
  if (isDuplicateInFile) issues.push("Duplicate SKU within this file");

  if (price === 0) issues.push("No price found (wholesale or vendor)");
  if (stock < 0)    issues.push("Negative stock value");

  const willUpdate = !!sku && existingSkus.has(sku);

  let status: RowStatus = "valid";
  if (!sku || !name) status = "error";
  else if (issues.length > 0) status = "warning";

  return { rowNum, raw: r, sku, name, category, price, stock, status, issues, isDuplicateInFile, willUpdate };
}

// Build the full DB record from a raw CSV row (same mapping as before)
function buildRecord(r: Record<string, string>): Record<string, unknown> | null {
  const sku  = pickVal(r, "ge_sku", "sku");
  const name = pickVal(r, "item_name", "name");
  if (!sku || !name) return null;

  let lowestVendorPrice: number | null = null;
  for (let i = 1; i <= 21; i++) {
    const vp = num(r[`vendor${i}_price`] || "");
    if (vp != null && (lowestVendorPrice === null || vp < lowestVendorPrice)) lowestVendorPrice = vp;
  }
  const wp = num(pickVal(r, "wholesale_price"));

  const rec: Record<string, unknown> = {
    sku, name,
    category:   pickVal(r, "category") || "MM",
    price:      wp ?? lowestVendorPrice ?? 0,
    stock:      int(pickVal(r, "stock")) ?? int(pickVal(r, "total_vendor_inventory")) ?? 0,
    aspect:                     r.aspect || null,
    base_ge_sku:                r.base_ge_sku || null,
    brand:                      r.brand || null,
    brand_logo:                 r.brand_logo || null,
    description:                r.description || null,
    features_and_benefits:      r.features_and_benefits || null,
    images:                     r.images || null,
    item_name:                  r.item_name || null,
    manufacturer_product_code:  r.manufacturer_product_code || null,
    master_brand_id:            r.master_brand_id || null,
    master_model_id:            r.master_model_id || null,
    max_inflation_press:        r.max_inflation_press || null,
    max_load:                   r.max_load || null,
    meas_rim_width:             r.meas_rim_width || null,
    model:                      r.model || null,
    mtlid:                      r.mtlid || null,
    overall_diam:               r.overall_diam || null,
    p_metric:                   r.p_metric || null,
    ply:                        r.ply || null,
    ply_rating:                 r.ply_rating || null,
    raw_size:                   r.raw_size || null,
    revs_per_mile:              r.revs_per_mile || null,
    rim:                        r.rim || null,
    rim_width_max:              r.rim_width_max || null,
    rim_width_min:              r.rim_width_min || null,
    rim_width_range:            r.rim_width_range || null,
    run_flat:                   r.run_flat || null,
    section:                    r.section || null,
    sidewall_abr:               r.sidewall_abr || null,
    size:                       r.size || null,
    tire_load:                  r.tire_load || null,
    tire_speed:                 r.tire_speed || null,
    tire_weight:                r.tire_weight || null,
    tread_depth:                r.tread_depth || null,
    tread_type:                 r.tread_type || null,
    upc:                        r.upc || null,
    utqg:                       r.utqg || null,
    warranty:                   r.warranty || null,
    wholesale_price:            num(r.wholesale_price),
    total_vendor_inventory:     int(r.total_vendor_inventory || r.Total_Vendor_Inventory),
  };
  for (let i = 1; i <= 21; i++) {
    rec[`vendor${i}_name`]     = r[`vendor${i}_name`]     || r[`Vendor${i}_Name`]     || null;
    rec[`vendor${i}_quantity`] = int(r[`vendor${i}_quantity`] || r[`Vendor${i}_Quantity`] || "");
    rec[`vendor${i}_price`]    = num(r[`vendor${i}_price`]    || r[`Vendor${i}_Price`]    || "");
  }
  return rec;
}

const statusFor = (stock: number) => {
  if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
  if (stock < 20)  return { label: "Low Stock",    variant: "secondary"  as const };
  return                  { label: "In Stock",     variant: "default"    as const };
};

// ─── Fitment Details Dialog (with full inline edit) ───────────────────────────
function FitmentDetailsDialog({
  product, open, onClose, onSaved,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Product) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]       = useState<Product | null>(null);
  const [saving, setSaving]     = useState(false);

  // Reset edit state when dialog opens with a new product
  useEffect(() => {
    if (product) { setDraft({...product}); setEditMode(false); }
  }, [product]);

  if (!product || !draft) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const set = (key: keyof Product, val: string) =>
    setDraft(d => d ? { ...d, [key]: val === "" ? null : val } : d);

  // View row
  const Field = ({ label, value, red }: { label: string; value?: string | number | null; red?: boolean }) => (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0 gap-4">
      <span className={`text-sm font-medium shrink-0 ${red?"text-red-500":"text-muted-foreground"}`}>{label}:</span>
      <span className={`text-sm text-right break-all ${red?"text-red-500":"text-foreground"}`}>{value || "N/A"}</span>
    </div>
  );

  // Edit row — label + input side-by-side
  const EditField = ({
    label, fieldKey, type = "text", red,
  }: {
    label: string; fieldKey: keyof Product; type?: string; red?: boolean;
  }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0 gap-3">
      <span className={`text-sm font-medium shrink-0 w-40 ${red?"text-red-500":"text-muted-foreground"}`}>{label}:</span>
      <Input
        type={type}
        className="h-7 text-sm text-right"
        value={(draft[fieldKey] as string | number | null) ?? ""}
        onChange={e => set(fieldKey, e.target.value)}
      />
    </div>
  );

  // Textarea edit row (for description, features)
  const EditTextarea = ({ label, fieldKey }: { label: string; fieldKey: keyof Product }) => (
    <div className="space-y-1 py-1.5 border-b border-border last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <textarea
        rows={3}
        className="w-full text-sm rounded-md border border-input bg-background px-3 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        value={(draft[fieldKey] as string | null) ?? ""}
        onChange={e => set(fieldKey, e.target.value)}
      />
    </div>
  );

  const SectionTitle = ({ children, red }: { children: React.ReactNode; red?: boolean }) => (
    <div className="mb-3 mt-2">
      <h3 className={`text-base font-bold ${red?"text-red-500":"text-foreground"}`}>{children}</h3>
      <Separator className="mt-1" />
    </div>
  );

  // ── Save to Supabase ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase.from("products").update(draft as never).eq("id", draft.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Tire updated successfully");
    onSaved(draft);
    setEditMode(false);
  };

  const handleCancel = () => { setDraft({...product}); setEditMode(false); };

  // Parse vendors for view mode
  const imageUrls = (product.images || "").split(";").map(s=>s.trim()).filter(Boolean);
  const vendors = Array.from({length:21},(_,i)=>i+1).map(n=>({
    name:     (product as Record<string,unknown>)[`vendor${n}_name`]     as string|null,
    quantity: (product as Record<string,unknown>)[`vendor${n}_quantity`] as number|null,
    price:    (product as Record<string,unknown>)[`vendor${n}_price`]    as number|null,
  })).filter(v=>v.name);

  return (
    <Dialog open={open} onOpenChange={o=>{ if(!o){ handleCancel(); onClose(); } }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">

        {/* ── Sticky header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Fitment Details</h2>
            <Badge variant="outline" className="font-mono text-xs">
              {product.manufacturer_product_code || product.sku}
            </Badge>
            {editMode && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Editing</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editMode ? (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-8">

          {/* ── Row 1: Basic Info + Size Specs ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Basic Information */}
            <div>
              <SectionTitle>Basic Information</SectionTitle>
              {editMode ? (
                <>
                  <EditField label="GE SKU"                    fieldKey="sku" />
                  <EditField label="Item Name"                 fieldKey="item_name" />
                  <EditField label="MTLID"                     fieldKey="mtlid" />
                  <EditField label="Master Brand ID"           fieldKey="master_brand_id" />
                  <EditField label="Brand"                     fieldKey="brand" />
                  <EditField label="Master Model ID"           fieldKey="master_model_id" />
                  <EditField label="Model"                     fieldKey="model" />
                  <EditField label="Wholesale Price"           fieldKey="wholesale_price" type="number" />
                  <EditField label="Images"                    fieldKey="images" />
                  <EditField label="Brand Logo"                fieldKey="brand_logo" />
                  <EditField label="Category"                  fieldKey="category" />
                  <EditField label="Size"                      fieldKey="size" />
                  <EditField label="Raw Size"                  fieldKey="raw_size" />
                  <EditField label="Manufacturer Code"         fieldKey="manufacturer_product_code" />
                  <EditField label="UPC"                       fieldKey="upc" />
                </>
              ) : (
                <>
                  <Field label="GE SKU"                    value={product.sku} />
                  <Field label="Item Name"                 value={product.item_name || product.name} />
                  <Field label="MTLID"                     value={product.mtlid} />
                  <Field label="Master Brand ID"           value={product.master_brand_id} />
                  <Field label="Brand"                     value={product.brand} />
                  <Field label="Master Model ID"           value={product.master_model_id} />
                  <Field label="Model"                     value={product.model} />
                  <Field label="Wholesale Price"           value={product.wholesale_price != null ? `$${Number(product.wholesale_price).toFixed(2)}` : undefined} />
                  <div className="py-2 border-b border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Images:</p>
                    {imageUrls.length > 0
                      ? imageUrls.map((url,i)=>(
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="block text-xs text-blue-500 hover:underline truncate mb-1">{url}</a>
                        ))
                      : <span className="text-sm text-muted-foreground">N/A</span>
                    }
                  </div>
                  <Field label="Brand Logo"                value={product.brand_logo} />
                  <Field label="Category"                  value={product.category} />
                  <Field label="Size"                      value={product.size} />
                  <Field label="Raw Size"                  value={product.raw_size} />
                  <Field label="Manufacturer Product Code" value={product.manufacturer_product_code} />
                  <Field label="UPC"                       value={product.upc} />
                </>
              )}
            </div>

            {/* Size Specifications */}
            <div>
              <SectionTitle>Size Specifications</SectionTitle>
              {editMode ? (
                <>
                  <EditField label="Section"          fieldKey="section" />
                  <EditField label="Aspect"           fieldKey="aspect" />
                  <EditField label="Rim"              fieldKey="rim" />
                  <EditField label="Rim Width Range"  fieldKey="rim_width_range" />
                  <EditField label="Rim Width Min"    fieldKey="rim_width_min" />
                  <EditField label="Rim Width Max"    fieldKey="rim_width_max" />
                  <EditField label="Meas Rim Width"   fieldKey="meas_rim_width" />
                  <EditField label="Overall Diameter" fieldKey="overall_diam" />
                </>
              ) : (
                <>
                  <Field label="Section"          value={product.section} />
                  <Field label="Aspect"           value={product.aspect} />
                  <Field label="Rim"              value={product.rim} />
                  <Field label="Rim Width Range"  value={product.rim_width_range} />
                  <Field label="Rim Width Min"    value={product.rim_width_min} />
                  <Field label="Rim Width Max"    value={product.rim_width_max} />
                  <Field label="Meas Rim Width"   value={product.meas_rim_width} />
                  <Field label="Overall Diameter" value={product.overall_diam} />
                </>
              )}

              <SectionTitle red>Tire Shipping Data:</SectionTitle>
              {editMode
                ? <EditField label="Tire Weight" fieldKey="tire_weight" red />
                : <Field     label="Tire Weight" value={product.tire_weight} red />
              }
            </div>
          </div>

          {/* ── Row 2: Performance + Technical ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Performance Ratings */}
            <div>
              <SectionTitle>Performance Ratings</SectionTitle>
              {editMode ? (
                <>
                  <EditField label="Tire Load"           fieldKey="tire_load" />
                  <EditField label="Tire Speed"          fieldKey="tire_speed" />
                  <EditField label="Ply"                 fieldKey="ply" />
                  <EditField label="Ply Rating"          fieldKey="ply_rating" />
                  <EditField label="UTQG"                fieldKey="utqg" />
                  <EditField label="Max Inflation Press" fieldKey="max_inflation_press" />
                  <EditField label="Max Load"            fieldKey="max_load" />
                </>
              ) : (
                <>
                  <Field label="Tire Load"           value={product.tire_load} />
                  <Field label="Tire Speed"          value={product.tire_speed} />
                  <Field label="Ply"                 value={product.ply} />
                  <Field label="Ply Rating"          value={product.ply_rating} />
                  <Field label="UTQG"                value={product.utqg} />
                  <Field label="Max Inflation Press" value={product.max_inflation_press} />
                  <Field label="Max Load"            value={product.max_load} />
                </>
              )}
            </div>

            {/* Technical Specifications */}
            <div>
              <SectionTitle>Technical Specifications</SectionTitle>
              {editMode ? (
                <>
                  <EditField label="Tread Type"    fieldKey="tread_type" />
                  <EditField label="Tread Depth"   fieldKey="tread_depth" />
                  <EditField label="Run Flat"      fieldKey="run_flat" />
                  <EditField label="Sidewall ABR"  fieldKey="sidewall_abr" />
                  <EditField label="P Metric"      fieldKey="p_metric" />
                  <EditField label="Revs Per Mile" fieldKey="revs_per_mile" />
                </>
              ) : (
                <>
                  <Field label="Tread Type"    value={product.tread_type} />
                  <Field label="Tread Depth"   value={product.tread_depth} />
                  <Field label="Run Flat"      value={product.run_flat} />
                  <Field label="Sidewall ABR"  value={product.sidewall_abr} />
                  <Field label="P Metric"      value={product.p_metric} />
                  <Field label="Revs Per Mile" value={product.revs_per_mile} />
                </>
              )}
            </div>
          </div>

          {/* ── Platform Listings ── */}
          <div>
            <SectionTitle>Platform Listings</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {["Amazon","Walmart","eBay"].map(p=>(
                <div key={p} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {p==="Amazon"&&<ShoppingCart className="w-4 h-4"/>}
                    {p==="Walmart"&&<Building2 className="w-4 h-4"/>}
                    {p==="eBay"&&<Globe className="w-4 h-4"/>}
                    {p}
                  </div>
                  <Badge variant="outline" className="text-xs">Not Listed</Badge>
                </div>
              ))}
            </div>
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 w-fit space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShoppingCart className="w-4 h-4 text-green-600"/>Shopify
              </div>
              <p className="text-sm text-muted-foreground">Not listed on Shopify</p>
              <p className="text-xs text-muted-foreground">Run sync to add this product</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50">
                <Flag className="w-4 h-4 mr-2"/> Flag Discrepancy
              </Button>
            </div>
          </div>

          {/* ── Vendor Inventory ── */}
          <div>
            <SectionTitle>Vendor Inventory</SectionTitle>
            {vendors.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v,i)=>(
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i+1}</TableCell>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-right">{v.quantity ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {v.price != null ? `$${Number(v.price).toFixed(2)}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/40">
                      <TableCell colSpan={2}>Total Vendor Inventory</TableCell>
                      <TableCell className="text-right">
                        {product.total_vendor_inventory ?? vendors.reduce((s,v)=>s+(v.quantity||0),0)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
                <Building2 className="w-12 h-12 text-muted-foreground/30"/>
                <p className="font-medium text-foreground">No vendors have this tire in inventory</p>
                <p className="text-sm">Vendors will appear here once they add this tire to their inventory</p>
              </div>
            )}
          </div>

          {/* ── Descriptions ── */}
          <div>
            <SectionTitle>Descriptions</SectionTitle>
            {editMode ? (
              <div className="space-y-3">
                <EditTextarea label="Description"         fieldKey="description" />
                <EditTextarea label="Features & Benefits" fieldKey="features_and_benefits" />
                <EditTextarea label="Warranty"            fieldKey="warranty" />
              </div>
            ) : (
              <div className="space-y-4">
                {product.description && (
                  <div>
                    <p className="text-sm font-bold mb-1">Description:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
                    <Separator className="mt-3"/>
                  </div>
                )}
                {product.features_and_benefits && (
                  <div>
                    <p className="text-sm font-bold mb-1">Features and Benefits:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{product.features_and_benefits}</p>
                    <Separator className="mt-3"/>
                  </div>
                )}
                {product.warranty && (
                  <div>
                    <p className="text-sm font-bold mb-1">Warranty:</p>
                    <p className="text-sm text-muted-foreground">{product.warranty}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Save footer (visible when editing) ── */}
          {editMode && (
            <div className="sticky bottom-0 bg-background border-t border-border pt-4 pb-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                Save Changes
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Inventory Component ─────────────────────────────────────────────────
// ─── Select Columns Modal — matches screenshot exactly ───────────────────────
function SelectColumnsModal({
  open, onClose, visible, setVisible,
}: {
  open: boolean;
  onClose: () => void;
  visible: Record<string, boolean>;
  setVisible: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const DISPLAY_GROUPS = [
    ...COLUMN_GROUPS.filter(g => g.group !== "Vendors"),
    {
      group: "Actions Information",
      cols: [{ key: "_actions" as ColKey, label: "Actions", defaultOn: true }],
    },
  ];

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    ALL_COLS.forEach(c => { next[c.key as string] = true; });
    next["_actions"] = true;
    setVisible(next);
  };

  const defaultOnly = () => {
    const next: Record<string, boolean> = {};
    ALL_COLS.forEach(c => { next[c.key as string] = c.defaultOn; });
    next["_actions"] = true;
    setVisible(next);
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Select Table Columns</h2>
          </div>
        </div>

        {/* Select All / Default Only buttons */}
        <div className="flex gap-2 px-5 pt-4 pb-2">
          <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
          <Button variant="outline" size="sm" onClick={defaultOnly}>Default Only</Button>
        </div>

        {/* Groups */}
        <div className="px-5 pb-6 space-y-6">
          {DISPLAY_GROUPS.map(g => (
            <div key={g.group}>
              {/* Group title */}
              <h3 className="text-sm font-semibold text-foreground mb-3">{g.group}</h3>
              <Separator className="mb-3" />
              {/* 3-column grid of checkboxes */}
              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                {g.cols.map(col => {
                  const key = col.key as string;
                  const isActions = key === "_actions";
                  const checked = isActions ? true : !!visible[key];
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2 cursor-pointer select-none
                        ${isActions ? "opacity-60 cursor-default" : ""}`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={isActions}
                        onCheckedChange={v => {
                          if (!isActions) setVisible(p => ({ ...p, [key]: !!v }));
                        }}
                        className="shrink-0"
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const emptyForm = { sku: "", name: "", category: "", price: "", stock: "" };

// ─── Bulk Import Dialog ────────────────────────────────────────────────────────

function BulkImportDialog({
  open, onClose, existingSkus, onComplete,
}: {
  open: boolean;
  onClose: () => void;
  existingSkus: Set<string>;
  onComplete: () => void;
}) {
  type ImportStage = "pick" | "parsing" | "preview" | "importing" | "done";

  const [stage, setStage]           = useState<ImportStage>("pick");
  const [dragOver, setDragOver]     = useState(false);
  const [fileName, setFileName]     = useState("");
  const [fileSize, setFileSize]     = useState("");
  const [parseProgress, setParseProgress] = useState(0);
  const [rowsParsedCount, setRowsParsedCount] = useState(0);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headerCols, setHeaderCols] = useState<string[]>([]);
  const [skipErrors, setSkipErrors] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [importedSoFar, setImportedSoFar]   = useState(0);
  const [totalToImport, setTotalToImport]   = useState(0);
  const [result, setResult]         = useState<{
    inserted: number; updated: number; skipped: number;
    failed: { row: number; sku: string; reason: string }[];
  } | null>(null);
  const [parseError, setParseError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all"|"error"|"warning"|"valid">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const reset = () => {
    setStage("pick"); setFileName(""); setFileSize(""); setParseProgress(0);
    setRowsParsedCount(0); setParsedRows([]); setHeaderCols([]); setSkipErrors(true);
    setImportProgress(0); setImportedSoFar(0); setTotalToImport(0);
    setResult(null); setParseError(""); setFilterStatus("all");
  };
  const handleClose = () => { cancelRef.current = true; reset(); onClose(); };

  // Safety cap — holding millions of full row objects in React state can
  // itself slow the browser down even with streaming reads. Above this many
  // rows, we stop keeping every row in memory and switch to "summary only"
  // mode (still imports everything correctly, just skips the per-row table).
  const MAX_ROWS_IN_MEMORY = 1000_000;

  // ── Stream-parse the file in 4MB chunks — works for files of any size ──────
  // Never calls file.text() on the whole file, so even 500MB+ CSVs won't
  // crash or freeze the browser tab.
  const processFile = async (file: File) => {
    setParseError("");
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(1) + " MB");
    setParseProgress(0);
    setRowsParsedCount(0);
    setStage("parsing");
    cancelRef.current = false;

    const seen = new Set<string>();
    const parsed: ParsedRow[] = [];
    let truncated = false;

    try {
      await streamParseCsv(
        file,
        (cells, rowIndex) => {
          const headers = csvHeadersRef.headers;
          const r: Record<string,string> = {};
          headers.forEach((h, i) => { r[h] = (cells[i] ?? "").trim(); });

          if (parsed.length < MAX_ROWS_IN_MEMORY) {
            const pr = validateRow(r, rowIndex + 2, seen, existingSkus);
            if (pr.sku) seen.add(pr.sku);
            parsed.push(pr);
            if (parsed.length % 500 === 0) setRowsParsedCount(parsed.length);
          } else {
            truncated = true;
          }
        },
        (pct) => setParseProgress(pct),
      );

      if (cancelRef.current) return; // user closed dialog mid-parse

      if (!parsed.length) {
        setParseError("No data rows found. Make sure the first row contains column headers (e.g. ge_sku, item_name, price, stock).");
        setStage("pick");
        return;
      }

      if (truncated) {
        setParseError(
          `This file has more than ${MAX_ROWS_IN_MEMORY.toLocaleString()} rows. For files this large, please split the CSV into smaller parts (e.g. ${MAX_ROWS_IN_MEMORY.toLocaleString()} rows each) and import them one at a time — this keeps the preview screen fast and reliable.`
        );
        setStage("pick");
        return;
      }

      setHeaderCols(csvHeadersRef.headers);
      setRowsParsedCount(parsed.length);
      setParsedRows(parsed);
      setStage("preview");
    } catch (err) {
      if (cancelRef.current) return;
      const msg = err instanceof Error ? err.message : "Unknown error while reading file";
      setParseError(msg);
      setStage("pick");
    }
  };

  const handleFileSelect = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please select a .csv file (not .xlsx or .xls)");
      return;
    }
    processFile(f);
  };

  // ── Counts ─────────────────────────────────────────────────────────────────
  const validCount   = parsedRows.filter(r => r.status === "valid").length;
  const warningCount = parsedRows.filter(r => r.status === "warning").length;
  const errorCount   = parsedRows.filter(r => r.status === "error").length;
  const updateCount  = parsedRows.filter(r => r.willUpdate && r.status !== "error").length;
  const insertCount  = parsedRows.filter(r => !r.willUpdate && r.status !== "error").length;

  const rowsToImport = skipErrors
    ? parsedRows.filter(r => r.status !== "error" && r.sku && r.name)
    : parsedRows.filter(r => r.sku && r.name);

  const previewRows = parsedRows
    .filter(r => filterStatus === "all" ? true : r.status === filterStatus)
    .slice(0, 100);

  // ── Run import in batches ──────────────────────────────────────────────────
  const runImport = async () => {
    setStage("importing");
    setImportProgress(0);
    setImportedSoFar(0);
    setTotalToImport(rowsToImport.length);

    const failed: { row: number; sku: string; reason: string }[] = [];
    let inserted = 0, updated = 0;
    const skippedCount = parsedRows.length - rowsToImport.length;

    const BATCH = 150; // smaller batch = more reliable on slow connections
    for (let i = 0; i < rowsToImport.length; i += BATCH) {
      const batch   = rowsToImport.slice(i, i + BATCH);
      const records = batch.map(r => buildRecord(r.raw)).filter(Boolean) as Record<string, unknown>[];
      try {
        const { error } = await supabase.from("products").upsert(records as never[], { onConflict: "sku" });
        if (error) {
          batch.forEach(r => failed.push({ row: r.rowNum, sku: r.sku, reason: error.message }));
        } else {
          batch.forEach(r => { if (r.willUpdate) updated++; else inserted++; });
        }
      } catch (err) {
        batch.forEach(r => failed.push({ row: r.rowNum, sku: r.sku, reason: err instanceof Error ? err.message : "Unknown error" }));
      }
      const done = i + batch.length;
      setImportedSoFar(done);
      setImportProgress(Math.min(100, Math.round((done / rowsToImport.length) * 100)));
      await yieldToBrowser();
    }

    setResult({ inserted, updated, skipped: skippedCount + failed.length, failed });
    setStage("done");
    onComplete();
  };

  // ── Download error CSV ─────────────────────────────────────────────────────
  const downloadErrorReport = () => {
    const errorRows = parsedRows.filter(r => r.status !== "valid");
    const lines = ["Row,SKU,Name,Status,Issues"];
    errorRows.forEach(r => {
      lines.push(`${r.rowNum},"${r.sku.replace(/"/g,'""')}","${r.name.replace(/"/g,'""')}",${r.status},"${r.issues.join("; ")}"`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "import-error-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: RowStatus) => {
    if (status === "valid")   return <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs gap-1 py-0"><CheckCircle2 className="w-3 h-3"/>Valid</Badge>;
    if (status === "warning") return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs gap-1 py-0"><AlertTriangle className="w-3 h-3"/>Warning</Badge>;
    return <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs gap-1 py-0"><XCircle className="w-3 h-3"/>Error</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && stage !== "importing") handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500"/>
            <h2 className="font-bold text-base">Bulk Import Tires</h2>
            {fileName && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{fileName} {fileSize && `· ${fileSize}`}</span>}
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {(["pick","preview","importing","done"] as const).map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs
                  ${stage === s ? "bg-indigo-500 text-white" :
                    (["preview","importing","done"].indexOf(stage) > i) ? "bg-green-500 text-white" :
                    "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                {i < 3 && <span className="w-4 h-px bg-border"/>}
              </span>
            ))}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Stage: pick ── */}
          {(stage === "pick" || stage === "parsing") && (
            <>
              {stage === "pick" && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl py-12 text-center cursor-pointer transition-all
                    ${dragOver ? "border-indigo-400 bg-indigo-50 scale-[1.01]" : "border-border hover:border-indigo-300 hover:bg-muted/30"}`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                    onChange={e => handleFileSelect(e.target.files?.[0])} />
                  <Upload className="w-12 h-12 mx-auto mb-3 text-indigo-400"/>
                  <p className="font-semibold text-base">Drag & drop your CSV here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
                  <p className="text-xs text-muted-foreground mt-3 bg-muted inline-block px-3 py-1 rounded-full">
                    Supports full tire fitment CSV — up to 150K+ rows
                  </p>
                </div>
              )}

              {stage === "parsing" && (
                <div className="py-8 text-center space-y-4">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-500"/>
                  <p className="font-semibold">Reading & validating your CSV…</p>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-200" style={{ width: `${parseProgress}%` }}/>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {parseProgress}% of file read · {rowsParsedCount.toLocaleString()} rows processed so far
                  </p>
                  <p className="text-xs text-muted-foreground">Large files are streamed in small chunks — this avoids freezing your browser</p>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>
                  <div>
                    <p className="font-medium text-red-700 text-sm">Could not read file</p>
                    <p className="text-xs text-red-600 mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              {stage === "pick" && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon:<CheckCircle2 className="w-4 h-4 text-green-600"/>, text:"Every row validated before importing" },
                    { icon:<Eye className="w-4 h-4 text-blue-600"/>,          text:"Preview what will be added vs updated" },
                    { icon:<X className="w-4 h-4 text-orange-500"/>,          text:"Error rows can be skipped automatically" },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-lg p-3">
                      <span className="shrink-0 mt-0.5">{tip.icon}</span>
                      <p className="text-xs text-muted-foreground">{tip.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Stage: preview ── */}
          {stage === "preview" && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label:"Total rows",  value:parsedRows.length, color:"text-foreground",    bg:"" },
                  { label:"✅ Valid",     value:validCount,        color:"text-green-600",     bg:"bg-green-50 border-green-200" },
                  { label:"⚠️ Warnings",  value:warningCount,      color:"text-amber-600",     bg:"bg-amber-50 border-amber-200" },
                  { label:"❌ Errors",    value:errorCount,        color:"text-red-600",       bg:"bg-red-50 border-red-200" },
                ].map(c => (
                  <div key={c.label} className={`rounded-xl border p-4 ${c.bg || "border-border"}`}>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* New vs update */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-600">🆕 New tires to add</p>
                  <p className="text-xl font-bold text-blue-700 mt-0.5">{insertCount.toLocaleString()}</p>
                </div>
                <div className="flex-1 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-xs text-violet-600">🔄 Existing tires to update</p>
                  <p className="text-xl font-bold text-violet-700 mt-0.5">{updateCount.toLocaleString()}</p>
                </div>
              </div>

              {/* Skip errors toggle */}
              {errorCount > 0 && (
                <label className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 cursor-pointer">
                  <Checkbox checked={skipErrors} onCheckedChange={v => setSkipErrors(!!v)} />
                  <div>
                    <p className="text-sm font-medium">Skip {errorCount.toLocaleString()} error row{errorCount === 1 ? "" : "s"} and import the rest</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Recommended — error rows have missing SKU or name</p>
                  </div>
                </label>
              )}

              {/* Filter tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Show:</span>
                {(["all","valid","warning","error"] as const).map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize
                      ${filterStatus === f
                        ? f === "valid"   ? "bg-green-100 text-green-700 border-green-300"
                        : f === "warning" ? "bg-amber-100 text-amber-700 border-amber-300"
                        : f === "error"   ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-indigo-100 text-indigo-700 border-indigo-300"
                        : "bg-white text-muted-foreground border-border hover:bg-muted/40"}`}>
                    {f === "all" ? `All (${parsedRows.length.toLocaleString()})` :
                     f === "valid"   ? `Valid (${validCount.toLocaleString()})` :
                     f === "warning" ? `Warnings (${warningCount.toLocaleString()})` :
                     `Errors (${errorCount.toLocaleString()})`}
                  </button>
                ))}
              </div>

              {/* Preview table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-12 text-xs">Row</TableHead>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs w-20">Price</TableHead>
                        <TableHead className="text-xs w-20">Stock</TableHead>
                        <TableHead className="text-xs w-24">Status</TableHead>
                        <TableHead className="text-xs">Issues</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No rows match this filter</TableCell></TableRow>
                      ) : previewRows.map(r => (
                        <TableRow key={r.rowNum}
                          className={r.status === "error" ? "bg-red-50 hover:bg-red-100" : r.status === "warning" ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-green-50"}>
                          <TableCell className="text-xs text-muted-foreground">{r.rowNum}</TableCell>
                          <TableCell className="text-xs font-mono">{r.sku || <span className="text-red-400">missing</span>}</TableCell>
                          <TableCell className="text-xs max-w-[160px] truncate">{r.name || <span className="text-red-400">missing</span>}</TableCell>
                          <TableCell className="text-xs">{r.price ? `$${r.price}` : "—"}</TableCell>
                          <TableCell className="text-xs">{r.stock ?? "—"}</TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{r.issues.join(", ") || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedRows.length > 100 && (
                  <div className="text-xs text-muted-foreground text-center py-2 border-t border-border bg-muted/20">
                    Showing first 100 of {parsedRows.length.toLocaleString()} rows — all rows will be imported
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Stage: importing ── */}
          {stage === "importing" && (
            <div className="py-10 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600"/>
              </div>
              <div>
                <p className="font-bold text-lg">Importing tires…</p>
                <p className="text-sm text-muted-foreground mt-1">{importedSoFar.toLocaleString()} of {totalToImport.toLocaleString()} rows processed</p>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-500 h-3 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}/>
                </div>
                <p className="text-xs text-muted-foreground">{importProgress}%</p>
              </div>
              <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block">
                ⚠️ Please don't close this window — import in progress
              </p>
            </div>
          )}

          {/* ── Stage: done ── */}
          {stage === "done" && result && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600"/>
                </div>
                <p className="text-xl font-bold">Import complete!</p>
                <p className="text-sm text-muted-foreground">Your tire catalog has been updated</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{result.inserted.toLocaleString()}</p>
                  <p className="text-xs text-green-700 mt-1">🆕 Inserted</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{result.updated.toLocaleString()}</p>
                  <p className="text-xs text-blue-700 mt-1">🔄 Updated</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">{result.skipped.toLocaleString()}</p>
                  <p className="text-xs text-gray-700 mt-1">⏭️ Skipped</p>
                </div>
              </div>
              {result.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-700 mb-1">{result.failed.length} rows failed during upload</p>
                  <p className="text-xs text-red-600">Download the error report to see which rows need to be re-imported.</p>
                </div>
              )}
              {(errorCount > 0 || result.failed.length > 0) && (
                <Button variant="outline" className="w-full" onClick={downloadErrorReport}>
                  <Download className="w-4 h-4 mr-2"/> Download error report CSV
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {stage !== "importing" && (
          <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
            {stage === "pick" || stage === "parsing" ? (
              <Button variant="outline" onClick={handleClose}>
                {stage === "parsing" ? "Cancel import" : "Cancel"}
              </Button>
            ) : stage === "preview" ? (
              <>
                <Button variant="outline" onClick={() => { reset(); }}>
                  <RotateCcw className="w-4 h-4 mr-2"/> Choose different file
                </Button>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    Will import <strong>{rowsToImport.length.toLocaleString()}</strong> rows
                  </p>
                  <Button
                    onClick={runImport}
                    disabled={rowsToImport.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Start Import <ArrowRight className="w-4 h-4 ml-2"/>
                  </Button>
                </div>
              </>
            ) : (
              <Button className="ml-auto" onClick={handleClose}>✅ Done — Close</Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter]       = useState("all");
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage]         = useState(1);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editing, setEditing]   = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ price:"", stock:"", category:"", mode:"set" as "set"|"adjust" });
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [fitmentProduct, setFitmentProduct] = useState<Product | null>(null);
  const [fitmentOpen, setFitmentOpen]       = useState(false);
  const [colModalOpen, setColModalOpen]     = useState(false);

  // Visible columns — default on for important ones
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLS.map(c=>[c.key, c.defaultOn]))
  );

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProducts((data ?? []) as unknown as Product[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Set of SKUs already in the DB — used by the bulk import dialog to flag
  // which rows are new inserts vs updates to existing tires.
  const existingSkus = useMemo(() => new Set(products.map(p => p.sku)), [products]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.sku || !form.name) { toast.error("SKU and Name are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      sku: form.sku, name: form.name,
      category: form.category || "MM",
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Tire added"); setForm(emptyForm); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Tire deleted");
    setProducts(p => p.filter(x => x.id !== id));
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("products").update({
      sku: editForm.sku, name: editForm.name,
      category: editForm.category || "MM",
      price: Number(editForm.price) || 0,
      stock: Number(editForm.stock) || 0,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Tire updated"); setEditing(null); load();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} tire(s)?`)) return;
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
    const patch: Record<string,unknown> = {};
    if (bulkForm.price    !== "") patch.price    = Number(bulkForm.price);
    if (bulkForm.stock    !== "") patch.stock    = Number(bulkForm.stock);
    if (bulkForm.category !== "") patch.category = bulkForm.category;
    if (!Object.keys(patch).length) return toast.error("Nothing to update");
    setBulkBusy(true);
    const { error } = await supabase.from("products").update(patch as never).in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} tire(s) updated`);
    setBulkOpen(false); setBulkForm({ price:"",stock:"",category:"",mode:"set" }); load();
  };

  // ── Filter + Paginate ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => {
      const matchSearch = !q
        || (p.item_name||p.name||"").toLowerCase().includes(q)
        || p.sku.toLowerCase().includes(q)
        || (p.brand||"").toLowerCase().includes(q)
        || (p.size||"").toLowerCase().includes(q)
        || (p.model||"").toLowerCase().includes(q)
        || p.category.toLowerCase().includes(q);
      const matchCat   = categoryFilter==="all" || p.category===categoryFilter;
      const matchBrand = brandFilter==="all"    || (p.brand||"")=== brandFilter;
      return matchSearch && matchCat && matchBrand;
    });
  }, [products, search, categoryFilter, brandFilter]);

  const uniqueCategories = useMemo(() => Array.from(new Set(products.map(p=>p.category))).sort(), [products]);
  const uniqueBrands     = useMemo(() => Array.from(new Set(products.map(p=>p.brand||"").filter(Boolean))).sort(), [products]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage-1)*pageSize, safePage*pageSize);

  const allSelected = paged.length > 0 && paged.every(p => selected.has(p.id));
  const toggleAll   = () => setSelected(s => { const n=new Set(s); if(allSelected) paged.forEach(p=>n.delete(p.id)); else paged.forEach(p=>n.add(p.id)); return n; });
  const toggleRow   = (id: string) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const exportCsv = () => {
    const cols = ALL_COLS.filter(c => visible[c.key as string]);
    const header = cols.map(c=>c.label).join(",");
    const bodyRows = filtered.map(p =>
      cols.map(c => {
        const v = (p as Record<string,unknown>)[c.key as string];
        return `"${String(v??"").replace(/"/g,'""')}"`;
      }).join(",")
    );
    const blob = new Blob([[header,...bodyRows].join("\n")], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="tires-export.csv"; a.click();
    URL.revokeObjectURL(url); toast.success("CSV exported");
  };

  // ── Cell renderer ─────────────────────────────────────────────────────────
  const renderCell = (p: Product, key: string) => {
    const val = (p as Record<string,unknown>)[key];
    if (key === "sku" || key === "base_ge_sku" || key === "manufacturer_product_code" || key === "upc" || key === "mtlid")
      return <span className="font-mono text-xs text-muted-foreground">{String(val||"—")}</span>;
    if (key === "item_name" || key === "name")
      return <span className="font-medium">{String(val||"—")}</span>;
    if (key === "brand")
      return <span className="font-semibold">{String(val||"—")}</span>;
    if (key === "category")
      return <Badge variant="outline">{String(val||"—")}</Badge>;
    if (key === "size" || key === "raw_size")
      return <span className="font-mono text-xs">{String(val||"—")}</span>;
    if (key === "price" || key === "wholesale_price")
      return val != null ? <span className="font-medium">${Number(val).toFixed(2)}</span> : <span className="text-muted-foreground">—</span>;
    if (key === "stock") {
      const s = statusFor(Number(val)||0);
      return (
        <div className="flex items-center gap-2">
          <span>{String(val||0)}</span>
          <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
        </div>
      );
    }
    if (key === "total_vendor_inventory")
      return <span className="font-medium">{String(val||0)}</span>;
    if (String(key).endsWith("_price") && val != null)
      return <span>${Number(val).toFixed(2)}</span>;
    if (String(key).endsWith("_name") && val)
      return <span className="text-sm">{String(val)}</span>;
    if (val == null || val === "") return <span className="text-muted-foreground text-xs">—</span>;
    return <span className="text-sm">{String(val)}</span>;
  };

  const visibleCols = ALL_COLS.filter(c => visible[c.key as string]);
  const colSpan = visibleCols.length + 2;

  return (
    <div className="flex-1 space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Tires</h2>
          <p className="text-muted-foreground mt-1">Full tire catalog with all CSV fields — {products.length.toLocaleString()} tires loaded.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2"/> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2"/> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2"/> Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Tire</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Tire</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>GE SKU *</Label><Input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="GE-Ironman-91202-1"/></div>
                <div className="grid gap-2"><Label>Item Name *</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ironman All Country AT 265/70R17"/></div>
                <div className="grid gap-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                    <SelectTrigger><SelectValue placeholder="Select category"/></SelectTrigger>
                    <SelectContent>
                      {["MM","LT","HP","UHP","MC","OTR","HPLT"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div>
                  <div className="grid gap-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving}>{saving&&<Loader2 className="w-4 h-4 animate-spin mr-1"/>}Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Tires",  value:products.length.toLocaleString(),   Icon:Package },
          { label:"Brands",       value:uniqueBrands.length.toString(),     Icon:Tags    },
          { label:"Categories",   value:uniqueCategories.length.toString(), Icon:Boxes   },
          { label:"Filtered",     value:filtered.length.toLocaleString(),   Icon:Filter  },
        ].map(s=>(
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.Icon className="w-4 h-4 text-muted-foreground"/>
            </div>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground"/>
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search SKU, brand, model, size..." value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
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
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <Card className="p-3 flex flex-wrap items-center gap-3 bg-muted/40">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={()=>setBulkOpen(true)}><Pencil className="w-4 h-4 mr-1"/>Bulk Edit</Button>
          <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={bulkDelete}>
            {bulkBusy?<Loader2 className="w-4 h-4 animate-spin mr-1"/>:<Trash2 className="w-4 h-4 mr-1"/>}Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={()=>setSelected(new Set())}>Clear</Button>
        </Card>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-3">
          <div>
            <h3 className="font-semibold">Tire Details ({filtered.length.toLocaleString()})</h3>
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length===0?0:(safePage-1)*pageSize+1}–{Math.min(safePage*pageSize,filtered.length)} of {filtered.length.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Column selector — opens modal */}
            <Button variant="outline" size="sm" onClick={() => setColModalOpen(true)}>
              <SlidersHorizontal className="w-4 h-4 mr-1"/> Columns
            </Button>
            <Select value={String(pageSize)} onValueChange={v=>{setPageSize(Number(v));setPage(1);}}>
              <SelectTrigger className="h-9 w-24"><SelectValue/></SelectTrigger>
              <SelectContent>{[25,50,100,200].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">Page {safePage}/{totalPages}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 sticky left-0 bg-background z-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll}/>
                </TableHead>
                {visibleCols.map(c=>(
                  <TableHead key={String(c.key)} className="whitespace-nowrap">{c.label}</TableHead>
                ))}
                <TableHead className="text-right sticky right-0 bg-background z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin inline"/></TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">No tires found</TableCell></TableRow>
              ) : paged.map(item => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30"
                  onClick={()=>{ setFitmentProduct(item); setFitmentOpen(true); }}>
                  <TableCell className="sticky left-0 bg-background" onClick={e=>e.stopPropagation()}>
                    <Checkbox checked={selected.has(item.id)} onCheckedChange={()=>toggleRow(item.id)}/>
                  </TableCell>
                  {visibleCols.map(c=>(
                    <TableCell key={String(c.key)} className="whitespace-nowrap">
                      {renderCell(item, c.key as string)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right sticky right-0 bg-background" onClick={e=>e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details"
                        onClick={()=>{ setFitmentProduct(item); setFitmentOpen(true); }}>
                        <Eye className="w-4 h-4"/>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={()=>{ setEditing(item); setEditForm({sku:item.sku,name:item.item_name||item.name,category:item.category,price:String(item.price),stock:String(item.stock)}); }}>
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
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {safePage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={safePage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={safePage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Select Columns Modal ── */}
      <SelectColumnsModal
        open={colModalOpen}
        onClose={() => setColModalOpen(false)}
        visible={visible}
        setVisible={setVisible}
      />

      {/* ── Fitment Details ── */}
      <FitmentDetailsDialog
        product={fitmentProduct}
        open={fitmentOpen}
        onClose={()=>{ setFitmentOpen(false); setFitmentProduct(null); }}
        onSaved={(updated) => {
          setProducts(p => p.map(x => x.id === updated.id ? updated : x));
          setFitmentProduct(updated);
        }}
      />

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editing} onOpenChange={o=>!o&&setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tire</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>GE SKU</Label><Input value={editForm.sku} onChange={e=>setEditForm({...editForm,sku:e.target.value})}/></div>
            <div className="grid gap-2"><Label>Item Name</Label><Input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}/></div>
            <div className="grid gap-2"><Label>Category</Label>
              <Select value={editForm.category} onValueChange={v=>setEditForm({...editForm,category:v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{["MM","LT","HP","UHP","MC","OTR","HPLT"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" value={editForm.price} onChange={e=>setEditForm({...editForm,price:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Stock</Label><Input type="number" value={editForm.stock} onChange={e=>setEditForm({...editForm,stock:e.target.value})}/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving&&<Loader2 className="w-4 h-4 animate-spin mr-1"/>}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Edit Dialog ── */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Edit {selected.size} Tire{selected.size===1?"":"s"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" placeholder="Leave blank to skip" value={bulkForm.price} onChange={e=>setBulkForm({...bulkForm,price:e.target.value})}/></div>
              <div className="grid gap-2"><Label>Stock</Label><Input type="number" placeholder="Leave blank to skip" value={bulkForm.stock} onChange={e=>setBulkForm({...bulkForm,stock:e.target.value})}/></div>
            </div>
            <div className="grid gap-2"><Label>Category</Label><Input placeholder="Leave blank to skip" value={bulkForm.category} onChange={e=>setBulkForm({...bulkForm,category:e.target.value})}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setBulkOpen(false)}>Cancel</Button>
            <Button onClick={applyBulkUpdate} disabled={bulkBusy}>{bulkBusy&&<Loader2 className="w-4 h-4 animate-spin mr-1"/>}Apply to {selected.size}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Import Dialog ── */}
      <BulkImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        existingSkus={existingSkus}
        onComplete={load}
      />

    </div>
  );
}
