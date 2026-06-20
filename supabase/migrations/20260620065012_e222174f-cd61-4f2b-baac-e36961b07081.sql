
ALTER TABLE public.tires ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tires FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tires TO authenticated;
GRANT ALL ON public.tires TO service_role;
CREATE POLICY "Authenticated can view tires" ON public.tires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can insert tires" ON public.tires FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Editors can update tires" ON public.tires FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Editors can delete tires" ON public.tires FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Public can view products" ON public.products;
REVOKE SELECT ON public.products FROM anon;
CREATE POLICY "Authenticated can view products" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins/managers can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY "Inventory bucket admins/managers select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'inventory' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Inventory bucket admins/managers insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventory' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Inventory bucket admins/managers update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'inventory' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Inventory bucket admins delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'inventory' AND has_role(auth.uid(), 'admin'::app_role));
