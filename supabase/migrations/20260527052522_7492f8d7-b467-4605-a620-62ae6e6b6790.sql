CREATE TABLE public.vehicle_fitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  submodel TEXT,
  fg_fmk TEXT,
  region TEXT DEFAULT 'United States',
  drive_type TEXT,
  body_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fitments TO anon, authenticated;
GRANT ALL ON public.vehicle_fitments TO service_role;

ALTER TABLE public.vehicle_fitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view vehicle fitments" ON public.vehicle_fitments FOR SELECT USING (true);
CREATE POLICY "Public can insert vehicle fitments" ON public.vehicle_fitments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update vehicle fitments" ON public.vehicle_fitments FOR UPDATE USING (true);
CREATE POLICY "Public can delete vehicle fitments" ON public.vehicle_fitments FOR DELETE USING (true);

CREATE INDEX idx_vehicle_fitments_year ON public.vehicle_fitments(year);
CREATE INDEX idx_vehicle_fitments_make ON public.vehicle_fitments(make);
CREATE INDEX idx_vehicle_fitments_model ON public.vehicle_fitments(model);

CREATE TRIGGER set_vehicle_fitments_updated_at
BEFORE UPDATE ON public.vehicle_fitments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();