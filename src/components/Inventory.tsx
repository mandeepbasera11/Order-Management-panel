import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus } from "lucide-react";

const inventory = [
  { id: "SKU-1001", name: "Wireless Headphones", category: "Electronics", price: "$129.00", stock: 42, status: "In Stock" },
  { id: "SKU-1002", name: "Smart Watch Series 6", category: "Electronics", price: "$249.00", stock: 12, status: "Low Stock" },
  { id: "SKU-1003", name: "Cotton T-Shirt", category: "Apparel", price: "$19.99", stock: 230, status: "In Stock" },
  { id: "SKU-1004", name: "Leather Wallet", category: "Accessories", price: "$59.00", stock: 0, status: "Out of Stock" },
  { id: "SKU-1005", name: "Running Shoes", category: "Footwear", price: "$89.50", stock: 75, status: "In Stock" },
  { id: "SKU-1006", name: "Ceramic Coffee Mug", category: "Home", price: "$14.00", stock: 8, status: "Low Stock" },
  { id: "SKU-1007", name: "Bluetooth Speaker", category: "Electronics", price: "$79.00", stock: 54, status: "In Stock" },
  { id: "SKU-1008", name: "Yoga Mat", category: "Fitness", price: "$34.00", stock: 0, status: "Out of Stock" },
];

const statusVariant = (status: string) => {
  if (status === "In Stock") return "default";
  if (status === "Low Stock") return "secondary";
  return "destructive";
};

export function Inventory() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h2>
          <p className="text-muted-foreground mt-2">Manage your products and stock levels.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9" />
          </div>
          <p className="text-sm text-muted-foreground">{inventory.length} items</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.category}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}