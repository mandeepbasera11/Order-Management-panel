import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRODUCT_COLS =
  "sku,item_name,name,brand,model,category,size,raw_size,section,aspect,rim,tire_load,tire_speed,ply_rating,utqg,tread_type,tread_depth,run_flat,warranty,max_load,max_inflation_press,revs_per_mile,tire_weight,upc,price,wholesale_price,stock,total_vendor_inventory,description,features_and_benefits";

function keywords(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9./\- ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !["the", "what", "which", "how", "for", "and", "you", "with", "tire", "tires", "have", "any", "show", "list", "many", "much", "price", "stock"].includes(w))
    .slice(0, 6);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI is not configured (missing API key)." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";

    // ── Gather product context ────────────────────────────────────────────
    const words = keywords(String(lastUser));
    let rows: Record<string, unknown>[] = [];

    if (words.length) {
      const orFilter = words
        .flatMap((w) => [`sku.ilike.%${w}%`, `item_name.ilike.%${w}%`, `name.ilike.%${w}%`, `brand.ilike.%${w}%`, `model.ilike.%${w}%`, `size.ilike.%${w}%`, `raw_size.ilike.%${w}%`, `category.ilike.%${w}%`])
        .join(",");
      const { data } = await supabase.from("products").select(PRODUCT_COLS).or(orFilter).limit(40);
      rows = data ?? [];
    }
    if (rows.length === 0) {
      const { data } = await supabase.from("products").select(PRODUCT_COLS).order("stock", { ascending: false }).limit(25);
      rows = data ?? [];
    }

    const { count: totalProducts } = await supabase.from("products").select("id", { count: "exact", head: true });
    const { data: lowStock } = await supabase
      .from("products")
      .select("sku,item_name,brand,stock,price")
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(10);

    const compact = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        if (v === null || v === "" || v === undefined) continue;
        o[k] = typeof v === "string" && v.length > 400 ? v.slice(0, 400) + "…" : v;
      }
      return o;
    });

    const context = [
      `Catalog size: ${totalProducts ?? "unknown"} products.`,
      `Matching products (JSON):\n${JSON.stringify(compact)}`,
      lowStock?.length ? `Low stock items (JSON):\n${JSON.stringify(lowStock)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const system = `You are the DmTire Hub product assistant for a US tire distributor.
Answer any question about products: specs (size, load index, speed rating, ply, UTQG, tread depth, run-flat, warranty), pricing (retail vs wholesale, margins), stock and vendor inventory, comparisons, fitment guidance and recommendations.
Use ONLY the catalog data provided below when giving specific SKUs, prices, or stock numbers. If the data does not contain the answer, say so plainly and suggest how to refine the search (brand, size, SKU).
General tire knowledge (how to read a sidewall, season types, load/speed tables) may be answered from your own knowledge.
Be concise, use short bullet lists, and always show SKU + price + stock when naming a product. Prices are in USD.

CATALOG DATA
${context}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: system }, ...messages.slice(-10)],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      const message =
        res.status === 429
          ? "Rate limit reached. Please try again in a moment."
          : res.status === 402
          ? "AI credits exhausted. Please add credits to continue."
          : `AI request failed: ${text.slice(0, 300)}`;
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? "I couldn't generate an answer. Please rephrase your question.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
