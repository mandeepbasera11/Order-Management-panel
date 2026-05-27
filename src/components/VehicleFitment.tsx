import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Upload, Download, Search as SearchIcon, Filter, Columns3,
  Pencil, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Vehicle = Tables<"vehicle_fitments">;

const ALL_COLUMNS = [
  { key: "year", label: "Year" },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "submodel", label: "Submodel" },
  { key: "fg_fmk", label: "FG FMK" },
  { key: "region", label: "Region" },
  { key: "drive_type", label: "Drive Type" },
  { key: "body_type", label: "Body Type" },
] as const;

const emptyForm: TablesInsert<"vehicle_fitments"> = {
  year: new Date().getFullYear(),
  make: "",
  model: "",
  submodel: "",
  fg_fmk: "",
  region: "United States",
  drive_type: "",
  body_type: "",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let val = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { val += '"'; i++; }
      else if (c === '"') inQ = false;
      else val += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { cur.push(val); val = ""; }
      else if (c === "\n" || c === "\r") {
        if (val.length || cur.length) { cur.push(val); rows.push(cur); cur = []; val = ""; }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else val += c;
    }
  }
  if (val.length || cur.length) { cur.push(val); rows.push(cur); }
  return rows;
}

const pick = (row: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (found && row[found] != null && row[found] !== "") return row[found];
  }
  return "";
};

export function VehicleFitment() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [make, setMake] = useState("all");
  const [model, setModel] = useState("all");
  const [submodel, setSubmodel] = useState("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true]))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<TablesInsert<"vehicle_fitments">>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importBusy, setImportBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from("vehicle_fitments")
      .select("*", { count: "exact" })
      .order("year", { ascending: false })
      .limit(5000);
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setRows(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = useMemo(() => Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a), [rows]);
  const makes = useMemo(() => Array.from(new Set(rows.map((r) => r.make).filter(Boolean))).sort(), [rows]);
  const models = useMemo(() => {
    const filtered = rows.filter((r) => make === "all" || r.make === make);
    return Array.from(new Set(filtered.map((r) => r.model).filter(Boolean))).sort();
  }, [rows, make]);
  const submodels = useMemo(() => {
    const filtered = rows.filter(
      (r) => (make === "all" || r.make === make) && (model === "all" || r.model === model)
    );
    return Array.from(new Set(filtered.map((r) => r.submodel).filter(Boolean) as string[])).sort();
  }, [rows, make, model]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (year !== "all" && r.year !== Number(year)) return false;
      if (make !== "all" && r.make !== make) return false;
      if (model !== "all" && r.model !== model) return false;
      if (submodel !== "all" && r.submodel !== submodel) return false;
      if (!q) return true;
      return [r.year, r.make, r.model, r.submodel, r.fg_fmk, r.region, r.drive_type, r.body_type]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [rows, search, year, make, model, submodel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [search, year, make, model, submodel, pageSize]);

  const visibleCols = ALL_COLUMNS.filter((c) => visible[c.key]);

  const resetFilters = () => {
    setSearch(""); setYear("all"); setMake("all"); setModel("all"); setSubmodel("all");
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setAddOpen(true); };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      year: v.year, make: v.make, model: v.model,
      submodel: v.submodel ?? "", fg_fmk: v.fg_fmk ?? "",
      region: v.region ?? "United States",
      drive_type: v.drive_type ?? "", body_type: v.body_type ?? "",
    });
    setAddOpen(true);
  };

  const save = async () => {
    if (!form.make || !form.model || !form.year) {
      toast({ title: "Missing fields", description: "Year, Make and Model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, year: Number(form.year) };
    const res = editing
      ? await supabase.from("vehicle_fitments").update(payload).eq("id", editing.id)
      : await supabase.from("vehicle_fitments").insert(payload);
    setSaving(false);
    if (res.error) {
      toast({ title: "Save failed", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Vehicle updated" : "Vehicle added" });
    setAddOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("vehicle_fitments").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    toast({ title: "Vehicle deleted" });
    load();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("vehicle_fitments").delete().in("id", ids);
    if (error) return toast({ title: "Bulk delete failed", description: error.message, variant: "destructive" });
    toast({ title: `Deleted ${ids.length} vehicles` });
    setSelected(new Set()); load();
  };

  const toggleRow = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    const ids = pageRows.map((r) => r.id);
    const all = ids.every((i) => selected.has(i));
    setSelected((s) => {
      const n = new Set(s);
      if (all) ids.forEach((i) => n.delete(i));
      else ids.forEach((i) => n.add(i));
      return n;
    });
  };

  const exportCsv = () => {
    const cols = visibleCols.map((c) => c.key);
    const header = visibleCols.map((c) => c.label).join(",");
    const body = filtered.map((r) =>
      cols.map((k) => {
        const v = (r as Record<string, unknown>)[k];
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vehicle-fitments-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    setImportBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("CSV must have a header row and at least one row of data");
      const headers = rows[0].map((h) => h.trim());
      const payload: TablesInsert<"vehicle_fitments">[] = [];
      for (let i = 1; i < rows.length; i++) {
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => (obj[h] = (rows[i][idx] ?? "").trim()));
        const yr = parseInt(pick(obj, "year"), 10);
        const mk = pick(obj, "make");
        const md = pick(obj, "model");
        if (!yr || !mk || !md) continue;
        payload.push({
          year: yr, make: mk, model: md,
          submodel: pick(obj, "submodel", "sub_model", "trim") || null,
          fg_fmk: pick(obj, "fg_fmk", "fg fmk", "fgfmk") || null,
          region: pick(obj, "region") || "United States",
          drive_type: pick(obj, "drive_type", "drive type", "drivetype") || null,
          body_type: pick(obj, "body_type", "body type", "bodytype") || null,
        });
      }
      if (!payload.length) throw new Error("No valid rows found");
      const chunkSize = 500;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const { error } = await supabase.from("vehicle_fitments").insert(payload.slice(i, i + chunkSize));
        if (error) throw error;
      }
      toast({ title: `Imported ${payload.length} vehicles` });
      load();
    } catch (e) {
      toast({ title: "Import failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setImportBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const stats = [
    { label: "Total Vehicles", value: totalCount.toLocaleString(), sub: "Total in database" },
    { label: "Makes", value: makes.length, sub: "Unique makes" },
    { label: "Models", value: new Set(rows.map((r) => r.model)).size, sub: "Unique models" },
    {
      label: "Filtered Results",
      value: filtered.length === rows.length ? "All" : filtered.length.toLocaleString(),
      sub: filtered.length === rows.length ? "No filters applied" : "Matching current filters",
    },
  ];

  const activeFilters = [year, make, model, submodel].filter((v) => v !== "all").length + (search ? 1 : 0);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vehicle Fitment</h1>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importBusy}>
            <Upload className="w-4 h-4 mr-2" />
            {importBusy ? "Importing..." : "Import Vehicles"}
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="text-3xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h2 className="font-semibold">Filters</h2>
          {activeFilters > 0 && (
            <Badge variant="secondary">{activeFilters} active</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search year, make, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={make} onValueChange={(v) => { setMake(v); setModel("all"); setSubmodel("all"); }}>
            <SelectTrigger><SelectValue placeholder="All Makes" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Makes</SelectItem>
              {makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={model} onValueChange={(v) => { setModel(v); setSubmodel("all"); }}>
            <SelectTrigger><SelectValue placeholder="All Models" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Models</SelectItem>
              {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={submodel} onValueChange={setSubmodel}>
            <SelectTrigger><SelectValue placeholder="All Submodels" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Submodels</SelectItem>
              {submodels.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
        )}
      </Card>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <Card className="p-3 flex items-center gap-3 bg-muted/40">
          <span className="text-sm">{selected.size} selected</span>
          <Button size="sm" variant="destructive" onClick={bulkDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </Card>
      )}

      {/* Table */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Vehicles ({filtered.length.toLocaleString()})</h2>
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()} vehicles
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Columns:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="w-4 h-4 mr-2" /> Select Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key} checked={visible[c.key]}
                    onCheckedChange={(v) => setVisible((s) => ({ ...s, [c.key]: !!v }))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-muted-foreground">View Results:</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 200].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                {visibleCols.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={visibleCols.length + 2} className="text-center text-muted-foreground py-10">Loading...</TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow><TableCell colSpan={visibleCols.length + 2} className="text-center text-muted-foreground py-10">No vehicles found</TableCell></TableRow>
              ) : pageRows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggleRow(v.id)} />
                  </TableCell>
                  {visibleCols.map((c) => {
                    const val = (v as Record<string, unknown>)[c.key];
                    if (c.key === "submodel" && val) {
                      return <TableCell key={c.key}><Badge variant="outline">{String(val)}</Badge></TableCell>;
                    }
                    if (c.key === "region" && val) {
                      return <TableCell key={c.key}><Badge variant="secondary">{String(val)}</Badge></TableCell>;
                    }
                    return (
                      <TableCell key={c.key} className={c.key === "make" ? "font-medium" : ""}>
                        {val == null || val === "" ? <span className="text-muted-foreground">N/A</span> : String(val)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="outline" onClick={() => openEdit(v)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => remove(v.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year *</Label>
              <Input type="number" value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Make *</Label>
              <Input value={form.make}
                onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <Input value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Submodel</Label>
              <Input value={form.submodel ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, submodel: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>FG FMK</Label>
              <Input value={form.fg_fmk ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, fg_fmk: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={form.region ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Drive Type</Label>
              <Input value={form.drive_type ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, drive_type: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Body Type</Label>
              <Input value={form.body_type ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, body_type: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}