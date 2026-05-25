
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Public can insert products"
  ON public.products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update products"
  ON public.products FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete products"
  ON public.products FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.products (sku, name, category, price, stock) VALUES
  ('SKU-1001', 'Wireless Headphones', 'Electronics', 129.00, 42),
  ('SKU-1002', 'Smart Watch Series 6', 'Electronics', 249.00, 12),
  ('SKU-1003', 'Cotton T-Shirt', 'Apparel', 19.99, 230),
  ('SKU-1004', 'Leather Wallet', 'Accessories', 59.00, 0),
  ('SKU-1005', 'Running Shoes', 'Footwear', 89.50, 75),
  ('SKU-1006', 'Ceramic Coffee Mug', 'Home', 14.00, 8),
  ('SKU-1007', 'Bluetooth Speaker', 'Electronics', 79.00, 54),
  ('SKU-1008', 'Yoga Mat', 'Fitness', 34.00, 0);
