
-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "Public can insert products" ON public.products;
DROP POLICY IF EXISTS "Public can update products" ON public.products;
DROP POLICY IF EXISTS "Public can delete products" ON public.products;

CREATE POLICY "Editors can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Editors can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Editors can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;

-- ============ VEHICLE FITMENTS ============
DROP POLICY IF EXISTS "Public can insert vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Public can update vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Public can delete vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Public can view vehicle fitments" ON public.vehicle_fitments;

CREATE POLICY "Authenticated can view vehicle fitments" ON public.vehicle_fitments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can insert vehicle fitments" ON public.vehicle_fitments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Editors can update vehicle fitments" ON public.vehicle_fitments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Editors can delete vehicle fitments" ON public.vehicle_fitments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fitments FROM anon;

-- ============ CSV IMPORTS ============
DROP POLICY IF EXISTS "Public can insert csv imports" ON public.csv_imports;
DROP POLICY IF EXISTS "Public can update csv imports" ON public.csv_imports;
DROP POLICY IF EXISTS "Public can delete csv imports" ON public.csv_imports;
DROP POLICY IF EXISTS "Public can view csv imports" ON public.csv_imports;

CREATE POLICY "Authenticated can view csv imports" ON public.csv_imports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can insert csv imports" ON public.csv_imports
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Editors can update csv imports" ON public.csv_imports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete csv imports" ON public.csv_imports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.csv_imports FROM anon;

-- ============ ORDERS: restrict SELECT to admin/manager ============
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.orders;
CREATE POLICY "Editors can view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP POLICY IF EXISTS "Authenticated can view order items" ON public.order_items;
CREATE POLICY "Editors can view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP POLICY IF EXISTS "Authenticated can view returns" ON public.returns;
CREATE POLICY "Editors can view returns" ON public.returns
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- ============ AUDIT LOGS: restrict SELECT to admin ============
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============ SECURITY DEFINER function EXECUTE grants ============
-- has_role, set_updated_at, handle_new_user are only used by RLS/triggers — revoke API exec
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
-- claim_first_admin must remain callable by authenticated users to bootstrap the first admin
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
