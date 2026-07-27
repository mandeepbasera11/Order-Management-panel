import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const BUCKET = "inventory";

// ── CSV helpers (mirrors the client-side mapping) ────────────────────────────
const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
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

const normalizeHeader = (h: string) =>
  h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const pickVal = (row: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) { const v = row[k]; if (v != null && String(v).trim() !== "") return String(v).trim(); }
  return "";
};

const SKU_ALIASES = ["ge_sku","sku","item_sku","product_sku","tire_sku","part_number","partnumber","base_ge_sku","upc","mtlid","manufacturer_product_code"];
const NAME_ALIASES = ["item_name","name","product_name","title","tire_name","description","item"];

const num = (v: string) => { const n = parseFloat(String(v).replace(/[$,]/g, "")); return isNaN(n) ? null : n; };
const int = (v: string) => { const n = parseInt(String(v).replace(/[$,]/g, "")); return isNaN(n) ? null : n; };

function buildRecord(r: Record<string, string>, allowMissingSku: boolean): Record<string, unknown> | null {
  let sku = pickVal(r, ...SKU_ALIASES);
  let name = pickVal(r, ...NAME_ALIASES);
  if (!sku || !name) {
    if (!allowMissingSku) return null;
    if (!sku) sku = `AUTO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    if (!name) name = sku;
  }

  let lowestVendorPrice: number | null = null;
  for (let i = 1; i <= 21; i++) {
    const vp = num(r[`vendor${i}_price`] || "");
    if (vp != null && (lowestVendorPrice === null || vp < lowestVendorPrice)) lowestVendorPrice = vp;
  }
  const wp = num(pickVal(r, "wholesale_price", "price", "cost", "unit_price", "our_price", "retail_price", "map_price"));

  const rec: Record<string, unknown> = {
    sku, name,
    category: pickVal(r, "category", "type") || "MM",
    price: wp ?? lowestVendorPrice ?? 0,
    stock: int(pickVal(r, "stock", "quantity", "qty", "on_hand", "available", "inventory")) ?? int(pickVal(r, "total_vendor_inventory")) ?? 0,
    aspect: r.aspect || null,
    base_ge_sku: r.base_ge_sku || null,
    brand: r.brand || null,
    brand_logo: r.brand_logo || null,
    description: r.description || null,
    features_and_benefits: r.features_and_benefits || null,
    images: r.images || null,
    item_name: r.item_name || name || null,
    manufacturer_product_code: r.manufacturer_product_code || null,
    master_brand_id: r.master_brand_id || null,
    master_model_id: r.master_model_id || null,
    max_inflation_press: r.max_inflation_press || null,
    max_load: r.max_load || null,
    meas_rim_width: r.meas_rim_width || null,
    model: r.model || null,
    mtlid: r.mtlid || null,
    overall_diam: r.overall_diam || null,
    p_metric: r.p_metric || null,
    ply: r.ply || null,
    ply_rating: r.ply_rating || null,
    raw_size: r.raw_size || null,
    revs_per_mile: r.revs_per_mile || null,
    rim: r.rim || null,
    rim_width_max: r.rim_width_max || null,
    rim_width_min: r.rim_width_min || null,
    rim_width_range: r.rim_width_range || null,
    run_flat: r.run_flat || null,
    section: r.section || null,
    sidewall_abr: r.sidewall_abr || null,
    size: r.size || null,
    tire_load: r.tire_load || null,
    tire_speed: r.tire_speed || null,
    tire_weight: r.tire_weight || null,
    tread_depth: r.tread_depth || null,
    tread_type: r.tread_type || null,
    upc: r.upc || null,
    utqg: r.utqg || null,
    warranty: r.warranty || null,
    wholesale_price: num(pickVal(r, "wholesale_price", "cost", "unit_price", "map_price")),
    total_vendor_inventory: int(pickVal(r, "total_vendor_inventory", "total_inventory", "total_qty")),
  };
  for (let i = 1; i <= 21; i++) {
    rec[`vendor${i}_name`] = r[`vendor${i}_name`] || null;
    rec[`vendor${i}_quantity`] = int(r[`vendor${i}_quantity`] || "");
    rec[`vendor${i}_price`] = num(r[`vendor${i}_price`] || "");
  }
  return rec;
}

// ── Background worker ────────────────────────────────────────────────────────
async function runImport(
  admin: ReturnType<typeof createClient>,
  importId: string,
  path: string,
  skipErrors: boolean,
) {
  const BATCH = 500;
  let success = 0, failed = 0, totalRows = 0;
  const sentSkus = new Set<string>();
  const errors: string[] = [];

  const flush = async (records: Record<string, unknown>[]) => {
    if (!records.length) return;
    const { error } = await admin.from("products").upsert(records, { onConflict: "sku" });
    if (!error) { success += records.length; return; }
    // Batch failed — retry each row so one bad record can't sink the batch.
    for (const rec of records) {
      const { error: e2 } = await admin.from("products").upsert([rec], { onConflict: "sku" });
      if (e2) {
        failed++;
        if (errors.length < 10) errors.push(`SKU ${rec.sku}: ${e2.message}`);
      } else success++;
    }
  };

  try {
    const { data: file, error: dlErr } = await admin.storage.from(BUCKET).download(path);
    if (dlErr || !file) throw new Error(dlErr?.message ?? "Could not read uploaded file");

    const totalBytes = file.size || 1;
    let bytesRead = 0;
    let leftover = "";
    let headers: string[] | null = null;
    let batch: Record<string, unknown>[] = [];
    let lastReport = Date.now();

    const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();

    const handleLine = async (line: string) => {
      if (!line.length) return;
      const cells = parseCsvLine(line);
      if (!headers) { headers = cells.map(normalizeHeader); return; }
      const r: Record<string, string> = {};
      headers.forEach((h, i) => { r[h] = (cells[i] ?? "").trim(); });
      totalRows++;

      const rec = buildRecord(r, !skipErrors);
      if (!rec) { failed++; return; }
      const sku = String(rec.sku);
      if (sentSkus.has(sku)) {
        // Duplicate within the file — send on its own so Postgres doesn't
        // reject the whole batch ("cannot affect row a second time").
        await flush([rec]);
        return;
      }
      sentSkus.add(sku);
      batch.push(rec);

      if (batch.length >= BATCH) {
        const b = batch; batch = [];
        await flush(b);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytesRead += value.length;
      const lines = (leftover + value).split(/\r\n|\n|\r/);
      leftover = lines.pop() ?? "";
      for (const line of lines) await handleLine(line);

      if (Date.now() - lastReport > 1500) {
        lastReport = Date.now();
        await admin.from("csv_imports").update({
          progress: Math.min(99, Math.round((bytesRead / totalBytes) * 100)),
          total_rows: totalRows,
          success_count: success,
          failed_count: failed,
        }).eq("id", importId);
      }
    }

    if (leftover.trim().length) await handleLine(leftover);
    await flush(batch);

    await admin.from("csv_imports").update({
      status: "completed",
      progress: 100,
      total_rows: totalRows,
      success_count: success,
      failed_count: failed,
      error_message: errors.length ? errors.join(" | ") : null,
      completed_at: new Date().toISOString(),
    }).eq("id", importId);
  } catch (err) {
    await admin.from("csv_imports").update({
      status: "failed",
      total_rows: totalRows,
      success_count: success,
      failed_count: failed,
      error_message: err instanceof Error ? err.message : "Unknown error",
      completed_at: new Date().toISOString(),
    }).eq("id", importId);
  } finally {
    await admin.storage.from(BUCKET).remove([path]);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id);
    const allowed = (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "manager");
    if (!allowed) return json({ error: "You need an admin or manager role to import tires" }, 403);

    const body = await req.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path : "";
    const filename = typeof body?.filename === "string" ? body.filename.slice(0, 255) : "import.csv";
    const skipErrors = body?.skipErrors !== false;
    if (!path || !path.startsWith("imports/")) return json({ error: "Invalid file path" }, 400);

    const { data: row, error: insErr } = await admin.from("csv_imports").insert({
      filename,
      import_type: "tires",
      status: "running",
      progress: 0,
      started_at: new Date().toISOString(),
    }).select("id").single();
    if (insErr || !row) return json({ error: insErr?.message ?? "Could not create import job" }, 500);

    // Kick off processing in the background so the HTTP request returns
    // immediately — large files can no longer hit a request timeout.
    // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
    EdgeRuntime.waitUntil(runImport(admin, row.id as string, path, skipErrors));

    return json({ importId: row.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
