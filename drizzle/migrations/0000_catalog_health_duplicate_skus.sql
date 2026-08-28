CREATE OR REPLACE FUNCTION public.catalog_duplicate_skus(_limit integer DEFAULT 50)
RETURNS TABLE (sku text, occurrences bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.sku, count(*)::bigint AS occurrences
  FROM public.products p
  GROUP BY p.sku
  HAVING count(*) > 1
  ORDER BY count(*) DESC
  LIMIT greatest(1, least(coalesce(_limit, 50), 500))
$$;

REVOKE ALL ON FUNCTION public.catalog_duplicate_skus(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalog_duplicate_skus(integer) TO authenticated;
