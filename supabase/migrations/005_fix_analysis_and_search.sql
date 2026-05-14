-- ============================================================
-- 005_fix_analysis_and_search.sql
-- Review fixes: analysis history, apartment search RPC, RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS analysis_history (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_name     text        NOT NULL,
  area               numeric     NOT NULL,
  floor              int         NOT NULL,
  total_floors       int         NOT NULL,
  bid_price          int         NOT NULL,
  acquisition_tax    int,
  legal_fee          int,
  eviction_cost      int,
  unpaid_maintenance int,
  interior_cost      int,
  loan_amount        int,
  loan_interest      int,
  loan_fee           int,
  prepayment_penalty int,
  enforcement_cost   int,
  total_cost         int,
  price_analysis     jsonb,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_history_read_all" ON analysis_history;
CREATE POLICY "analysis_history_read_all"
  ON analysis_history FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "analysis_history_insert_all" ON analysis_history;
CREATE POLICY "analysis_history_insert_all"
  ON analysis_history FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION search_apartments(
  p_lawd_cd text,
  p_query text DEFAULT ''
)
RETURNS TABLE(name text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    apartment_trade.apt_name AS name,
    count(*) AS count
  FROM apartment_trade
  WHERE apartment_trade.lawd_cd = p_lawd_cd
    AND (
      coalesce(trim(p_query), '') = ''
      OR apartment_trade.apt_name ILIKE '%' || trim(p_query) || '%'
    )
  GROUP BY apartment_trade.apt_name
  ORDER BY count(*) DESC, apartment_trade.apt_name ASC
  LIMIT 20;
$$;

ALTER TABLE apartment_trade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apartment_trade_read_all" ON apartment_trade;
CREATE POLICY "apartment_trade_read_all"
  ON apartment_trade FOR SELECT
  USING (true);

ALTER TABLE apartment_rent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apartment_rent_read_all" ON apartment_rent;
CREATE POLICY "apartment_rent_read_all"
  ON apartment_rent FOR SELECT
  USING (true);

GRANT SELECT ON analysis_history TO anon, authenticated;
GRANT INSERT ON analysis_history TO anon, authenticated;
GRANT SELECT ON apartment_trade TO anon, authenticated;
GRANT SELECT ON apartment_rent TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_apartments(text, text) TO anon, authenticated;
