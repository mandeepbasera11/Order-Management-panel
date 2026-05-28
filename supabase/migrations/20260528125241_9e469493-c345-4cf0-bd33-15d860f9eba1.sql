
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can view vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Public can insert vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Public can update vehicle fitments" ON public.vehicle_fitments;
DROP POLICY IF EXISTS "Public can delete vehicle fitments" ON public.vehicle_fitments;

-- Revoke any anon access; restrict to authenticated + service_role
REVOKE ALL ON public.vehicle_fitments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fitments TO authenticated;
GRANT ALL ON public.vehicle_fitments TO service_role;

-- Authenticated-only policies
CREATE POLICY "Authenticated can view vehicle fitments"
ON public.vehicle_fitments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert vehicle fitments"
ON public.vehicle_fitments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update vehicle fitments"
ON public.vehicle_fitments
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete vehicle fitments"
ON public.vehicle_fitments
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);
