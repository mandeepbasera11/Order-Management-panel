import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitMerge, Save } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["Admin","Manager","Sales","Warehouse","Viewer"] as const;
type Role = typeof ROLES[number];

const MODULES = [
  "Orders","POS","Inventory","Vendors","Pricing","Shopify",
  "Customers","Reports","Audit Logs","User Permissions","FTP Settings",
];

const DEFAULTS: Record<string, Record<Role, boolean>> = Object.fromEntries(
  MODULES.map(m => [m, {
    Admin: true,
    Manager: !["User Permissions","FTP Settings"].includes(m),
    Sales: ["Orders","POS","Customers","Inventory"].includes(m),
    Warehouse: ["Inventory","Vendors","Orders"].includes(m),
    Viewer: ["Reports"].includes(m),
  } as Record<Role, boolean>])
);

export function PermissionMatrix() {
  const [matrix, setMatrix] = useState(DEFAULTS);

  const toggle = (mod: string, role: Role) =>
    setMatrix(m => ({ ...m, [mod]: { ...m[mod], [role]: !m[mod][role] } }));

  const save = () => toast.success("Permission matrix saved");

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitMerge className="w-7 h-7 text-primary"/>Permission Matrix
          </h2>
          <p className="text-muted-foreground mt-1">Cross-reference roles against modules and toggle access in one grid.</p>
        </div>
        <Button onClick={save}><Save className="w-4 h-4 mr-2"/>Save matrix</Button>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              {ROLES.map(r => <TableHead key={r} className="text-center">{r}</TableHead>)}
              <TableHead className="text-right">Coverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map(mod => {
              const granted = ROLES.filter(r => matrix[mod][r]).length;
              return (
                <TableRow key={mod}>
                  <TableCell className="font-medium">{mod}</TableCell>
                  {ROLES.map(r => (
                    <TableCell key={r} className="text-center">
                      <Checkbox checked={matrix[mod][r]} onCheckedChange={()=>toggle(mod,r)}/>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Badge variant={granted>=4?"default":granted>=2?"secondary":"outline"}>
                      {granted}/{ROLES.length}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}