CREATE TABLE public.csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  import_type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  total_rows integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.csv_imports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.csv_imports TO authenticated;
GRANT ALL ON public.csv_imports TO service_role;

ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view csv imports" ON public.csv_imports FOR SELECT USING (true);
CREATE POLICY "Public can insert csv imports" ON public.csv_imports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update csv imports" ON public.csv_imports FOR UPDATE USING (true);
CREATE POLICY "Public can delete csv imports" ON public.csv_imports FOR DELETE USING (true);

CREATE TRIGGER set_csv_imports_updated_at
  BEFORE UPDATE ON public.csv_imports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_csv_imports_started_at ON public.csv_imports (started_at DESC);