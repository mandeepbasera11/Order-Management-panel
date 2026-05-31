import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Pencil, Trash2, Shield, ShieldCheck, ShieldX,
  User, Users, Key, Eye, EyeOff, Lock, Unlock, Mail, Phone,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "Admin" | "Manager" | "Staff" | "Viewer" | "Custom";
type Status = "Active" | "Inactive" | "Pending";

type Permission = {
  key: string;
  label: string;
  description: string;
};

type PermissionGroup = {
  group: string;
  icon: React.ReactNode;
  permissions: Permission[];
};

type StaffUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: Status;
  lastLogin: string;
  avatar: string;
  permissions: Record<string, boolean>;
};

// ─── Permission definitions ───────────────────────────────────────────────────
const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: "Dashboard",
    icon: <Eye className="w-4 h-4" />,
    permissions: [
      { key: "dashboard.view",   label: "View Dashboard",   description: "See stats, charts and KPIs" },
    ],
  },
  {
    group: "Manage Tires",
    icon: <Key className="w-4 h-4" />,
    permissions: [
      { key: "tires.view",   label: "View Tires",   description: "Browse tire catalog" },
      { key: "tires.add",    label: "Add Tires",    description: "Create new tire listings" },
      { key: "tires.edit",   label: "Edit Tires",   description: "Modify existing tires" },
      { key: "tires.delete", label: "Delete Tires", description: "Remove tires from catalog" },
      { key: "tires.import", label: "Import CSV",   description: "Bulk import via CSV" },
      { key: "tires.export", label: "Export CSV",   description: "Download tire data" },
    ],
  },
  {
    group: "Vehicle Fitment",
    icon: <Key className="w-4 h-4" />,
    permissions: [
      { key: "fitment.view",   label: "View Fitment",   description: "Browse vehicle fitments" },
      { key: "fitment.add",    label: "Add Fitment",    description: "Create new fitments" },
      { key: "fitment.edit",   label: "Edit Fitment",   description: "Modify fitments" },
      { key: "fitment.delete", label: "Delete Fitment", description: "Remove fitments" },
    ],
  },
  {
    group: "Orders",
    icon: <Key className="w-4 h-4" />,
    permissions: [
      { key: "orders.view",    label: "View Orders",    description: "Browse all orders" },
      { key: "orders.edit",    label: "Edit Orders",    description: "Update order status" },
      { key: "orders.refund",  label: "Process Refunds",description: "Issue refunds" },
      { key: "orders.delete",  label: "Delete Orders",  description: "Archive orders" },
    ],
  },
  {
    group: "Marketplace Pricing",
    icon: <Key className="w-4 h-4" />,
    permissions: [
      { key: "pricing.view",   label: "View Pricing",   description: "See marketplace prices" },
      { key: "pricing.edit",   label: "Edit Pricing",   description: "Change prices" },
      { key: "pricing.export", label: "Export Pricing", description: "Download pricing data" },
    ],
  },
  {
    group: "Shopify Products",
    icon: <Key className="w-4 h-4" />,
    permissions: [
      { key: "shopify.view", label: "View Products",  description: "Browse Shopify products" },
      { key: "shopify.sync", label: "Sync Products",  description: "Push products to Shopify" },
      { key: "shopify.edit", label: "Edit Products",  description: "Modify Shopify listings" },
    ],
  },
  {
    group: "Reports",
    icon: <Eye className="w-4 h-4" />,
    permissions: [
      { key: "reports.view",   label: "View Reports",   description: "Access all reports" },
      { key: "reports.export", label: "Export Reports", description: "Download report data" },
    ],
  },
  {
    group: "User Permissions",
    icon: <Shield className="w-4 h-4" />,
    permissions: [
      { key: "users.view",   label: "View Users",   description: "See all staff users" },
      { key: "users.add",    label: "Add Users",    description: "Invite new staff" },
      { key: "users.edit",   label: "Edit Users",   description: "Change roles & permissions" },
      { key: "users.delete", label: "Delete Users", description: "Remove staff accounts" },
    ],
  },
  {
    group: "Settings",
    icon: <Lock className="w-4 h-4" />,
    permissions: [
      { key: "settings.view", label: "View Settings", description: "See system settings" },
      { key: "settings.edit", label: "Edit Settings", description: "Modify system settings" },
      { key: "ftp.manage",    label: "FTP Settings",  description: "Configure FTP feeds" },
    ],
  },
];

const ALL_PERMS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

// ─── Role presets ─────────────────────────────────────────────────────────────
const ROLE_PRESETS: Record<Role, Record<string, boolean>> = {
  Admin: Object.fromEntries(ALL_PERMS.map(k => [k, true])),
  Manager: Object.fromEntries(ALL_PERMS.map(k => [k,
    !["users.delete", "settings.edit", "ftp.manage"].includes(k)
  ])),
  Staff: Object.fromEntries(ALL_PERMS.map(k => [k,
    ["dashboard.view","tires.view","tires.add","tires.edit","tires.import","tires.export",
     "fitment.view","fitment.add","fitment.edit","orders.view","orders.edit",
     "pricing.view","shopify.view"].includes(k)
  ])),
  Viewer: Object.fromEntries(ALL_PERMS.map(k => [k,
    ["dashboard.view","tires.view","fitment.view","orders.view","pricing.view",
     "shopify.view","reports.view"].includes(k)
  ])),
  Custom: Object.fromEntries(ALL_PERMS.map(k => [k, false])),
};

// ─── Sample users ─────────────────────────────────────────────────────────────
const AVATARS = ["SC","JD","MR","TK","AL","PB","RW","NF"];
const initUsers = (): StaffUser[] => [
  { id:"1", name:"Sarah Chen",     email:"sarah@dmtire.com",   phone:"(555) 001-0001", role:"Admin",   status:"Active",   lastLogin:"2026-05-30 09:14", avatar:"SC", permissions:{...ROLE_PRESETS.Admin}   },
  { id:"2", name:"James Dowell",   email:"james@dmtire.com",   phone:"(555) 001-0002", role:"Manager", status:"Active",   lastLogin:"2026-05-29 16:42", avatar:"JD", permissions:{...ROLE_PRESETS.Manager} },
  { id:"3", name:"Maria Reyes",    email:"maria@dmtire.com",   phone:"(555) 001-0003", role:"Staff",   status:"Active",   lastLogin:"2026-05-30 08:05", avatar:"MR", permissions:{...ROLE_PRESETS.Staff}   },
  { id:"4", name:"Tom Keller",     email:"tom@dmtire.com",     phone:"(555) 001-0004", role:"Staff",   status:"Inactive", lastLogin:"2026-05-10 11:30", avatar:"TK", permissions:{...ROLE_PRESETS.Staff}   },
  { id:"5", name:"Amy Lin",        email:"amy@dmtire.com",     phone:"(555) 001-0005", role:"Viewer",  status:"Active",   lastLogin:"2026-05-28 14:20", avatar:"AL", permissions:{...ROLE_PRESETS.Viewer}  },
  { id:"6", name:"Paul Brewer",    email:"paul@dmtire.com",    phone:"(555) 001-0006", role:"Custom",  status:"Active",   lastLogin:"2026-05-27 10:00", avatar:"PB", permissions:{...ROLE_PRESETS.Custom}  },
  { id:"7", name:"Rachel Wong",    email:"rachel@dmtire.com",  phone:"(555) 001-0007", role:"Manager", status:"Pending",  lastLogin:"Never",            avatar:"RW", permissions:{...ROLE_PRESETS.Manager} },
  { id:"8", name:"Nate Ford",      email:"nate@dmtire.com",    phone:"(555) 001-0008", role:"Staff",   status:"Active",   lastLogin:"2026-05-29 13:55", avatar:"NF", permissions:{...ROLE_PRESETS.Staff}   },
];

const ROLE_COLORS: Record<Role, string> = {
  Admin:   "bg-red-100 text-red-700 border-red-200",
  Manager: "bg-blue-100 text-blue-700 border-blue-200",
  Staff:   "bg-green-100 text-green-700 border-green-200",
  Viewer:  "bg-gray-100 text-gray-600 border-gray-200",
  Custom:  "bg-purple-100 text-purple-700 border-purple-200",
};

const STATUS_CONFIG: Record<Status, { icon: React.ReactNode; cls: string }> = {
  Active:   { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "text-green-600" },
  Inactive: { icon: <XCircle      className="w-3.5 h-3.5" />, cls: "text-gray-400"  },
  Pending:  { icon: <Clock        className="w-3.5 h-3.5" />, cls: "text-amber-500" },
};

const emptyForm = { name:"", email:"", phone:"", role:"Staff" as Role, status:"Active" as Status };

// ─── Main Component ───────────────────────────────────────────────────────────
export function UserPermissions() {
  const [users, setUsers]         = useState<StaffUser[]>(initUsers);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter]     = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs
  const [addOpen,  setAddOpen]  = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [permUser, setPermUser] = useState<StaffUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm]           = useState(emptyForm);
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [showPass,  setShowPass]  = useState(false);
  const [password,  setPassword]  = useState("");

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = roleFilter   === "all" || u.role   === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalActive  = users.filter(u => u.status === "Active").length;
  const totalAdmin   = users.filter(u => u.role === "Admin").length;
  const totalPending = users.filter(u => u.status === "Pending").length;

  // ── Add user ───────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    const newUser: StaffUser = {
      id:          String(Date.now()),
      name:        form.name,
      email:       form.email,
      phone:       form.phone,
      role:        form.role,
      status:      form.status,
      lastLogin:   "Never",
      avatar:      form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
      permissions: {...ROLE_PRESETS[form.role]},
    };
    setUsers(u => [newUser, ...u]);
    toast.success(`${form.name} added successfully`);
    setForm(emptyForm); setPassword(""); setAddOpen(false);
  };

  // ── Edit user ──────────────────────────────────────────────────────────────
  const handleEdit = () => {
    if (!editUser) return;
    setUsers(u => u.map(x => x.id === editUser.id ? { ...editUser } : x));
    toast.success("User updated");
    setEditUser(null);
  };

  // ── Save permissions ───────────────────────────────────────────────────────
  const handleSavePerms = () => {
    if (!permUser) return;
    setUsers(u => u.map(x => x.id === permUser.id
      ? { ...x, permissions: permState, role: "Custom" }
      : x
    ));
    toast.success(`Permissions saved for ${permUser.name}`);
    setPermUser(null);
  };

  const applyRolePreset = (role: Role) => {
    setPermState({...ROLE_PRESETS[role]});
  };

  const openPermissions = (u: StaffUser) => {
    setPermUser(u);
    setPermState({...u.permissions});
  };

  // ── Toggle status ──────────────────────────────────────────────────────────
  const toggleStatus = (id: string) => {
    setUsers(u => u.map(x => x.id === id
      ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" }
      : x
    ));
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deleteId) return;
    const u = users.find(x => x.id === deleteId);
    setUsers(u => u.filter(x => x.id !== deleteId));
    toast.success(`${u?.name} removed`);
    setDeleteId(null);
  };

  // ── Permission count ───────────────────────────────────────────────────────
  const permCount = (u: StaffUser) =>
    Object.values(u.permissions).filter(Boolean).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff roles and access levels for DmTire Hub</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setPassword(""); setAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Users",    value: users.length,  sub:"All staff accounts",   Icon: Users,      cls:"text-blue-600"   },
          { label:"Active",         value: totalActive,   sub:"Currently active",     Icon: ShieldCheck,cls:"text-green-600"  },
          { label:"Admins",         value: totalAdmin,    sub:"Full access users",    Icon: Shield,     cls:"text-red-500"    },
          { label:"Pending",        value: totalPending,  sub:"Awaiting first login",  Icon: Clock,      cls:"text-amber-500"  },
        ].map(s => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.Icon className={`w-4 h-4 ${s.cls}`} />
            </div>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {(["Admin","Manager","Staff","Viewer","Custom"] as Role[]).map(r =>
                <SelectItem key={r} value={r}>{r}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(["Active","Inactive","Pending"] as Status[]).map(s =>
                <SelectItem key={s} value={s}>{s}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ── Users Table ── */}
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Staff Users ({filtered.length})</h2>
            <p className="text-xs text-muted-foreground">Click "Permissions" to manage individual access</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : filtered.map(u => {
                const sc = STATUS_CONFIG[u.status];
                const count = permCount(u);
                return (
                  <TableRow key={u.id}>
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {u.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    {/* Role */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role]}`}>
                        {u.role === "Admin"   && <ShieldCheck className="w-3 h-3"/>}
                        {u.role === "Manager" && <Shield      className="w-3 h-3"/>}
                        {u.role === "Custom"  && <Key         className="w-3 h-3"/>}
                        {u.role}
                      </span>
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${sc.cls}`}>
                        {sc.icon} {u.status}
                      </span>
                    </TableCell>
                    {/* Permissions */}
                    <TableCell>
                      <button
                        onClick={() => openPermissions(u)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        <Key className="w-3.5 h-3.5" />
                        {count}/{ALL_PERMS.length} permissions
                      </button>
                    </TableCell>
                    {/* Last Login */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{u.lastLogin}</span>
                    </TableCell>
                    {/* Contact */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3"/>{u.email}
                        </span>
                        {u.phone && (
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3"/>{u.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-8 text-xs px-2"
                          onClick={() => openPermissions(u)}>
                          <Key className="w-3.5 h-3.5 mr-1"/> Permissions
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8"
                          title={u.status === "Active" ? "Deactivate" : "Activate"}
                          onClick={() => toggleStatus(u.id)}>
                          {u.status === "Active"
                            ? <Lock   className="w-3.5 h-3.5" />
                            : <Unlock className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8"
                          onClick={() => setEditUser({...u})}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8"
                          onClick={() => setDeleteId(u.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD USER DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Add New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={form.name} placeholder="e.g. John Smith"
                  onChange={e => setForm({...form, name:e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input className="pl-9" type="email" value={form.email} placeholder="john@dmtire.com"
                    onChange={e => setForm({...form, email:e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input className="pl-9" value={form.phone} placeholder="(555) 000-0000"
                    onChange={e => setForm({...form, phone:e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Temporary Password</Label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} value={password}
                    placeholder="Set a temporary password"
                    onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm({...form, role:v as Role})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Admin","Manager","Staff","Viewer","Custom"] as Role[]).map(r =>
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status:v as Status})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Active","Inactive","Pending"] as Status[]).map(s =>
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Role preview */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Role: {form.role}</p>
              <p>{
                form.role === "Admin"   ? "Full access to all features and settings." :
                form.role === "Manager" ? "Can manage tires, orders, pricing. Cannot delete users or change system settings." :
                form.role === "Staff"   ? "Can view and edit tires, fitments and orders. No admin access." :
                form.role === "Viewer"  ? "Read-only access to most sections. Cannot edit anything." :
                "No permissions by default. You can customize after adding."
              }</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT USER DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!editUser} onOpenChange={o => !o && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edit User
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={editUser.name}
                  onChange={e => setEditUser({...editUser, name:e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input className="pl-9" type="email" value={editUser.email}
                    onChange={e => setEditUser({...editUser, email:e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                  <Input className="pl-9" value={editUser.phone}
                    onChange={e => setEditUser({...editUser, phone:e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={editUser.role}
                    onValueChange={v => setEditUser({...editUser, role:v as Role})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Admin","Manager","Staff","Viewer","Custom"] as Role[]).map(r =>
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editUser.status}
                    onValueChange={v => setEditUser({...editUser, status:v as Status})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Active","Inactive","Pending"] as Status[]).map(s =>
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          PERMISSIONS DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!permUser} onOpenChange={o => !o && setPermUser(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 bg-background z-10 px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {permUser?.avatar}
              </div>
              <div>
                <h2 className="text-lg font-bold">{permUser?.name}</h2>
                <p className="text-sm text-muted-foreground">{permUser?.email} · {permUser?.role}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-5">
            {/* Role preset buttons */}
            <div>
              <p className="text-sm font-semibold mb-2">Apply Role Preset</p>
              <div className="flex flex-wrap gap-2">
                {(["Admin","Manager","Staff","Viewer","Custom"] as Role[]).map(r => (
                  <Button key={r} size="sm" variant="outline"
                    className={`text-xs border ${ROLE_COLORS[r]}`}
                    onClick={() => applyRolePreset(r)}>
                    {r}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" className="text-xs ml-auto"
                  onClick={() => setPermState(Object.fromEntries(ALL_PERMS.map(k=>[k,true])))}>
                  Check All
                </Button>
                <Button size="sm" variant="ghost" className="text-xs"
                  onClick={() => setPermState(Object.fromEntries(ALL_PERMS.map(k=>[k,false])))}>
                  Uncheck All
                </Button>
              </div>
            </div>

            <Separator />

            {/* Permission groups */}
            {PERMISSION_GROUPS.map(g => {
              const allOn = g.permissions.every(p => permState[p.key]);
              const someOn = g.permissions.some(p => permState[p.key]);
              return (
                <div key={g.group}>
                  {/* Group header with toggle-all checkbox */}
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={allOn}
                      className={someOn && !allOn ? "opacity-60" : ""}
                      onCheckedChange={v =>
                        setPermState(s => {
                          const n = {...s};
                          g.permissions.forEach(p => { n[p.key] = !!v; });
                          return n;
                        })
                      }
                    />
                    <div className="flex items-center gap-2">
                      {g.icon}
                      <span className="text-sm font-semibold">{g.group}</span>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {g.permissions.filter(p => permState[p.key]).length}/{g.permissions.length}
                    </span>
                  </div>
                  {/* Permission checkboxes — 2 column grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                    {g.permissions.map(p => (
                      <label key={p.key}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors">
                        <Checkbox
                          checked={!!permState[p.key]}
                          onCheckedChange={v => setPermState(s => ({...s, [p.key]:!!v}))}
                          className="mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium leading-tight">{p.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {Object.values(permState).filter(Boolean).length} of {ALL_PERMS.length} permissions enabled
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPermUser(null)}>Cancel</Button>
              <Button onClick={handleSavePerms}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldX className="w-5 h-5" /> Remove User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to remove <strong>{users.find(u=>u.id===deleteId)?.name}</strong>?
            This will revoke all their access immediately.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
