
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_label TEXT,
  before_value JSONB,
  after_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Admins can delete audit logs"
  ON public.audit_logs FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
