CREATE OR REPLACE VIEW public.brand_summary
WITH (security_invoker = true) AS
SELECT
  brand,
  COUNT(*)::int AS skus,
  ROUND(AVG(price)::numeric, 2) AS avg_price,
  COALESCE(SUM(qty_on_hand), 0)::int AS units,
  COALESCE(SUM(qty_on_hand * price), 0) AS value,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE qty_on_hand > 0) / NULLIF(COUNT(*), 0),
    1
  ) AS in_stock_pct
FROM public.tires
WHERE brand IS NOT NULL
GROUP BY brand
ORDER BY skus DESC;

GRANT SELECT ON public.brand_summary TO authenticated;
GRANT SELECT ON public.brand_summary TO service_role;