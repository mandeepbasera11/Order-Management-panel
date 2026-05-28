
DROP POLICY IF EXISTS "Authenticated can view vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Authenticated can insert vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Authenticated can update vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Authenticated can delete vehicle fitments" ON public.vehicle_fitments;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fitments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fitments TO authenticated;
GRANT ALL ON public.vehicle_fitments TO service_role;

CREATE POLICY "Public can view vehicle fitments" ON public.vehicle_fitments FOR SELECT USING (true);
CREATE POLICY "Public can insert vehicle fitments" ON public.vehicle_fitments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update vehicle fitments" ON public.vehicle_fitments FOR UPDATE USING (true);
CREATE POLICY "Public can delete vehicle fitments" ON public.vehicle_fitments FOR DELETE USING (true);
