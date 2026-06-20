import { useState } from "react";
import { ShoppingCart, Building2, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Status = "Active" | "Inactive" | "Pending";

type BasicListing = {
  status: Status;
  sellerSku: string;   // Amazon: Seller SKU, Walmart: Walmart SKU, eBay: Old SKU
  sku: string;
  asin: string;        // Amazon/eBay: ASIN, Walmart: GTIN
  price: string;
  quantity: string;
};

type AdvancedSettings = {
  listingId: string;
  itemName: string;
  imageUrl: string;
  productId: string;
  productIdType: string;
  oldSku: string;
  openDate: string;
  itemDescription: string;
  businessPrice: string;
  quantityPriceType: string;
  pendingQuantity: string;
  itemCondition: string;
  fulfillmentChannel: string;
  isMarketplaceItem: boolean;
  zshopShippingFee: string;
  merchantShippingGroup: string;
  shipInternationally: boolean;
  expeditedShipping: boolean;
  zshopCategory: string;
  browsePath: string;
  storefrontFeature: string;
  addDelete: string;
  boldText: boolean;
  featuredPlacement: boolean;
  asins: string[]; // length 10
  itemNote: string;
};

const emptyAdvanced = (): AdvancedSettings => ({
  listingId: "", itemName: "", imageUrl: "", productId: "", productIdType: "",
  oldSku: "", openDate: "", itemDescription: "", businessPrice: "",
  quantityPriceType: "", pendingQuantity: "", itemCondition: "",
  fulfillmentChannel: "", isMarketplaceItem: false, zshopShippingFee: "",
  merchantShippingGroup: "", shipInternationally: false, expeditedShipping: false,
  zshopCategory: "", browsePath: "", storefrontFeature: "", addDelete: "",
  boldText: false, featuredPlacement: false,
  asins: Array.from({ length: 10 }, () => ""), itemNote: "",
});

const PLATFORMS = [
  { key: "amazon",  label: "Amazon",  icon: ShoppingCart, skuLabel: "Seller SKU",  idLabel: "ASIN" },
  { key: "walmart", label: "Walmart", icon: Building2,    skuLabel: "Walmart SKU", idLabel: "GTIN" },
  { key: "ebay",    label: "eBay",    icon: Globe,        skuLabel: "Old SKU",     idLabel: "ASIN" },
] as const;

type PlatformKey = typeof PLATFORMS[number]["key"];

const emptyBasic = (): BasicListing => ({
  status: "Inactive", sellerSku: "", sku: "", asin: "", price: "0.00", quantity: "0",
});

export default function PlatformListings() {
  const [basics, setBasics] = useState<Record<PlatformKey, BasicListing>>({
    amazon: emptyBasic(), walmart: emptyBasic(), ebay: emptyBasic(),
  });
  const [advanced, setAdvanced] = useState<Record<PlatformKey, AdvancedSettings>>({
    amazon: emptyAdvanced(), walmart: emptyAdvanced(), ebay: emptyAdvanced(),
  });
  const [openAdv, setOpenAdv] = useState<PlatformKey | null>(null);

  const updateBasic = (k: PlatformKey, patch: Partial<BasicListing>) =>
    setBasics(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLATFORMS.map(p => {
          const Icon = p.icon;
          const b = basics[p.key];
          return (
            <div key={p.key} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Icon className="w-4 h-4" /> {p.label}
              </div>

              <Row label="Status:">
                <Select value={b.status} onValueChange={(v) => updateBasic(p.key, { status: v as Status })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </Row>

              <Row label={`${p.skuLabel}:`}>
                <Input className="h-8" value={b.sellerSku} placeholder={p.skuLabel}
                  onChange={(e) => updateBasic(p.key, { sellerSku: e.target.value })} />
              </Row>
              <Row label="SKU:">
                <Input className="h-8" value={b.sku} placeholder="SKU"
                  onChange={(e) => updateBasic(p.key, { sku: e.target.value })} />
              </Row>
              <Row label={`${p.idLabel}:`}>
                <Input className="h-8" value={b.asin} placeholder={p.idLabel}
                  onChange={(e) => updateBasic(p.key, { asin: e.target.value })} />
              </Row>
              <Row label="Price:">
                <Input className="h-8" type="number" step="0.01" value={b.price}
                  onChange={(e) => updateBasic(p.key, { price: e.target.value })} />
              </Row>
              <Row label="Quantity:">
                <Input className="h-8" type="number" value={b.quantity}
                  onChange={(e) => updateBasic(p.key, { quantity: e.target.value })} />
              </Row>

              <Button variant="outline" className="w-full h-8"
                onClick={() => setOpenAdv(p.key)}>
                <Settings className="w-4 h-4 mr-2" /> Advanced Settings
              </Button>
            </div>
          );
        })}
      </div>

      <AdvancedDialog
        openKey={openAdv}
        onClose={() => setOpenAdv(null)}
        value={openAdv ? advanced[openAdv] : null}
        onChange={(v) => openAdv && setAdvanced(prev => ({ ...prev, [openAdv]: v }))}
        onSave={() => { toast.success("Advanced settings saved"); setOpenAdv(null); }}
      />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-2">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function AdvancedDialog({
  openKey, onClose, value, onChange, onSave,
}: {
  openKey: PlatformKey | null;
  onClose: () => void;
  value: AdvancedSettings | null;
  onChange: (v: AdvancedSettings) => void;
  onSave: () => void;
}) {
  const platform = PLATFORMS.find(p => p.key === openKey);
  if (!value || !platform) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const set = <K extends keyof AdvancedSettings>(k: K, v: AdvancedSettings[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <Dialog open={!!openKey} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> {platform.label} Advanced Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Section title="Product Details">
            <Grid2>
              <Field label="Listing ID"><Input value={value.listingId} onChange={(e) => set("listingId", e.target.value)} placeholder="Listing ID" /></Field>
              <Field label="Item Name"><Input value={value.itemName} onChange={(e) => set("itemName", e.target.value)} placeholder="Item Name" /></Field>
              <Field label="Image URL"><Input value={value.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="Image URL" /></Field>
              <Field label="Product ID"><Input value={value.productId} onChange={(e) => set("productId", e.target.value)} placeholder="Product ID" /></Field>
              <Field label="Product ID Type">
                <Select value={value.productIdType} onValueChange={(v) => set("productIdType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPC">UPC</SelectItem>
                    <SelectItem value="EAN">EAN</SelectItem>
                    <SelectItem value="GTIN">GTIN</SelectItem>
                    <SelectItem value="ASIN">ASIN</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Old SKU"><Input value={value.oldSku} onChange={(e) => set("oldSku", e.target.value)} placeholder="Old SKU" /></Field>
              <Field label="Open Date"><Input type="date" value={value.openDate} onChange={(e) => set("openDate", e.target.value)} /></Field>
            </Grid2>
            <Field label="Item Description">
              <Textarea value={value.itemDescription} onChange={(e) => set("itemDescription", e.target.value)} placeholder="Item Description" />
            </Field>
          </Section>

          <Section title="Pricing">
            <Grid2>
              <Field label="Business Price"><Input type="number" step="0.01" value={value.businessPrice} onChange={(e) => set("businessPrice", e.target.value)} placeholder="0.00" /></Field>
              <Field label="Quantity Price Type"><Input value={value.quantityPriceType} onChange={(e) => set("quantityPriceType", e.target.value)} placeholder="Quantity Price Type" /></Field>
            </Grid2>
          </Section>

          <Section title="Inventory">
            <Field label="Pending Quantity"><Input type="number" value={value.pendingQuantity} onChange={(e) => set("pendingQuantity", e.target.value)} placeholder="0" /></Field>
          </Section>

          <Section title="Marketplace Settings">
            <Grid2>
              <Field label="Item Condition">
                <Select value={value.itemCondition} onValueChange={(v) => set("itemCondition", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Condition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Used">Used</SelectItem>
                    <SelectItem value="Refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fulfillment Channel">
                <Select value={value.fulfillmentChannel} onValueChange={(v) => set("fulfillmentChannel", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FBA">FBA</SelectItem>
                    <SelectItem value="FBM">FBM</SelectItem>
                    <SelectItem value="Merchant">Merchant</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Grid2>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={value.isMarketplaceItem} onCheckedChange={(c) => set("isMarketplaceItem", !!c)} />
              Is Marketplace Item
            </label>
          </Section>

          <Section title="Shipping">
            <Grid2>
              <Field label="ZShop Shipping Fee"><Input type="number" step="0.01" value={value.zshopShippingFee} onChange={(e) => set("zshopShippingFee", e.target.value)} placeholder="0.00" /></Field>
              <Field label="Merchant Shipping Group"><Input value={value.merchantShippingGroup} onChange={(e) => set("merchantShippingGroup", e.target.value)} placeholder="Shipping Group" /></Field>
            </Grid2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={value.shipInternationally} onCheckedChange={(c) => set("shipInternationally", !!c)} />
                Ship Internationally
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={value.expeditedShipping} onCheckedChange={(c) => set("expeditedShipping", !!c)} />
                Expedited Shipping
              </label>
            </div>
          </Section>

          <Section title="Categories & Navigation">
            <Field label="ZShop Category"><Input value={value.zshopCategory} onChange={(e) => set("zshopCategory", e.target.value)} placeholder="ZShop Category" /></Field>
            <Field label="Browse Path"><Input value={value.browsePath} onChange={(e) => set("browsePath", e.target.value)} placeholder="Browse Path" /></Field>
            <Field label="Storefront Feature"><Input value={value.storefrontFeature} onChange={(e) => set("storefrontFeature", e.target.value)} placeholder="Storefront Feature" /></Field>
          </Section>

          <Section title="Advanced Features">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
              <Field label="Add/Delete">
                <Select value={value.addDelete} onValueChange={(v) => set("addDelete", v)}>
                  <SelectTrigger><SelectValue placeholder="Select Action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Add">Add</SelectItem>
                    <SelectItem value="Delete">Delete</SelectItem>
                    <SelectItem value="Update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm pb-2">
                <Checkbox checked={value.boldText} onCheckedChange={(c) => set("boldText", !!c)} />
                Bold Text
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={value.featuredPlacement} onCheckedChange={(c) => set("featuredPlacement", !!c)} />
              Featured Placement
            </label>
          </Section>

          <Section title="Additional ASINs">
            <div className="grid grid-cols-3 gap-3">
              {value.asins.map((a, i) => (
                <Field key={i} label={`ASIN ${i + 1}`}>
                  <Input value={a} placeholder={`ASIN ${i + 1}`}
                    onChange={(e) => {
                      const next = [...value.asins]; next[i] = e.target.value;
                      set("asins", next);
                    }} />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Notes">
            <Field label="Item Note">
              <Textarea value={value.itemNote} onChange={(e) => set("itemNote", e.target.value)} placeholder="Item notes or comments" />
            </Field>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <Separator className="mt-1" />
      </div>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}