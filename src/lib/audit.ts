import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "inventory.stock_changed"
  | "inventory.price_changed"
  | "inventory.bulk_updated"
  | "inventory.created"
  | "inventory.deleted"
  | "order.cancelled"
  | "order.status_changed"
  | "order.created";

export type AuditEntry = {
  action: AuditAction | string;
  entity_type: "product" | "order" | string;
  entity_id?: string | null;
  entity_label?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

/**
 * Record an audit log entry. Silently no-ops if not authenticated.
 * Failures are logged to console but never thrown.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      entity_label: entry.entity_label ?? null,
      before_value: (entry.before ?? null) as never,
      after_value: (entry.after ?? null) as never,
      metadata: (entry.metadata ?? null) as never,
    });
    if (error) console.warn("[audit] insert failed:", error.message);
  } catch (e) {
    console.warn("[audit] unexpected error", e);
  }
}

/** Diff two records and return only the changed fields. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  keys: (keyof T)[],
): { before: Partial<T>; after: Partial<T>; changed: (keyof T)[] } {
  const b: Partial<T> = {};
  const a: Partial<T> = {};
  const changed: (keyof T)[] = [];
  for (const k of keys) {
    const bv = before?.[k];
    const av = after?.[k];
    const same = bv === av || (bv == null && av == null) || Number(bv) === Number(av);
    if (!same) {
      b[k] = bv as T[keyof T];
      a[k] = av as T[keyof T];
      changed.push(k);
    }
  }
  return { before: b, after: a, changed };
}