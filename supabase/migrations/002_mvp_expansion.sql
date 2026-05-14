-- ============================================================
-- 002_mvp_expansion.sql
-- 경매 분석기 MVP 확장 - 9개 테이블 완성
-- 개발 초기: 기존 테이블 전체 DROP 후 재생성
-- ============================================================

-- ── 기존 테이블 전체 삭제 ─────────────────────────────────
DROP TABLE IF EXISTS feature_requests          CASCADE;
DROP TABLE IF EXISTS profit_calculations       CASCADE;
DROP TABLE IF EXISTS field_records             CASCADE;
DROP TABLE IF EXISTS apartment_rent_monthly_stats CASCADE;
DROP TABLE IF EXISTS apartment_monthly_stats   CASCADE;
DROP TABLE IF EXISTS apartment_rent            CASCADE;
DROP TABLE IF EXISTS apartment_trade           CASCADE;
DROP TABLE IF EXISTS apt_transactions          CASCADE;
DROP TABLE IF EXISTS apartment_alias           CASCADE;
DROP TABLE IF EXISTS apartment_master          CASCADE;
DROP TABLE IF EXISTS analysis_history          CASCADE;
DROP TABLE IF EXISTS complex_cache             CASCADE;
DROP TABLE IF EXISTS backfill_progress         CASCADE;
DROP TABLE IF EXISTS daily_sync_log            CASCADE;

-- ── 1. 단지 마스터 ─────────────────────────────────────────
CREATE TABLE apartment_master (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawd_cd         text        NOT NULL,
  apt_name        text        NOT NULL,
  apt_name_norm   text,
  addr            text,
  total_floors    int,
  total_household int,
  build_year      int,
  dong_name       text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(lawd_cd, apt_name)
);

-- ── 2. 별칭 매핑 ───────────────────────────────────────────
CREATE TABLE apartment_alias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_name        text NOT NULL,
  normalized_name text NOT NULL,
  lawd_cd         text,
  UNIQUE(raw_name, lawd_cd)
);

-- ── 3. 매매 실거래가 ───────────────────────────────────────
CREATE TABLE apartment_trade (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawd_cd        text        NOT NULL,
  apt_name       text        NOT NULL,
  exclusive_area numeric     NOT NULL,
  floor          int,
  deal_amount    int         NOT NULL,
  deal_year      text,
  deal_month     text,
  deal_day       text,
  apt_master_id  uuid        REFERENCES apartment_master(id),
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_apartment_trade_lookup
  ON apartment_trade(lawd_cd, apt_name, exclusive_area);
CREATE INDEX idx_apartment_trade_date
  ON apartment_trade(deal_year, deal_month);

-- ── 4. 전월세 실거래가 ─────────────────────────────────────
CREATE TABLE apartment_rent (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawd_cd        text        NOT NULL,
  apt_name       text        NOT NULL,
  exclusive_area numeric     NOT NULL,
  floor          int,
  rent_type      text        CHECK (rent_type IN ('전세', '월세')),
  deposit        int,
  monthly_rent   int         DEFAULT 0,
  contract_year  text,
  contract_month text,
  apt_master_id  uuid        REFERENCES apartment_master(id),
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_apartment_rent_lookup
  ON apartment_rent(lawd_cd, apt_name, exclusive_area);

-- ── 5. 월별 매매 통계 ──────────────────────────────────────
CREATE TABLE apartment_monthly_stats (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  apt_master_id  uuid    REFERENCES apartment_master(id),
  exclusive_area numeric,
  year_month     text,
  avg_price      int,
  min_price      int,
  max_price      int,
  trade_count    int,
  UNIQUE(apt_master_id, exclusive_area, year_month)
);

-- ── 6. 월별 전세 통계 ──────────────────────────────────────
CREATE TABLE apartment_rent_monthly_stats (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  apt_master_id  uuid    REFERENCES apartment_master(id),
  exclusive_area numeric,
  year_month     text,
  avg_deposit    int,
  trade_count    int,
  UNIQUE(apt_master_id, exclusive_area, year_month)
);

-- ── 7. 임장 기록 (RLS) ────────────────────────────────────
CREATE TABLE field_records (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number    text,
  bid_date       date,
  lawd_cd        text,
  apt_name       text,
  exclusive_area numeric,
  memo           jsonb       DEFAULT '{}'::jsonb,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE field_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "field_records_owner" ON field_records;
CREATE POLICY "field_records_owner"
  ON field_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 8. 수익률 계산 기록 (RLS) ─────────────────────────────
CREATE TABLE profit_calculations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  lawd_cd        text,
  apt_name       text,
  exclusive_area numeric,
  input_data     jsonb,
  result_data    jsonb,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE profit_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profit_calculations_owner" ON profit_calculations;
CREATE POLICY "profit_calculations_owner"
  ON profit_calculations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profit_calculations_anon_insert" ON profit_calculations;
CREATE POLICY "profit_calculations_anon_insert"
  ON profit_calculations FOR INSERT
  WITH CHECK (user_id IS NULL);

-- ── 9. 요청사항 게시판 (RLS) ──────────────────────────────
CREATE TABLE feature_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  body        text,
  category    text        DEFAULT 'feature' CHECK (category IN ('bug', 'feature', 'data', 'other')),
  status      text        DEFAULT 'open'    CHECK (status IN ('open', 'in_progress', 'done')),
  like_count  int         DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_requests_read_all" ON feature_requests;
CREATE POLICY "feature_requests_read_all"
  ON feature_requests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "feature_requests_auth_insert" ON feature_requests;
CREATE POLICY "feature_requests_auth_insert"
  ON feature_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feature_requests_own_update" ON feature_requests;
CREATE POLICY "feature_requests_own_update"
  ON feature_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- ── updated_at 자동 갱신 트리거 ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS field_records_updated_at ON field_records;
CREATE TRIGGER field_records_updated_at
  BEFORE UPDATE ON field_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
