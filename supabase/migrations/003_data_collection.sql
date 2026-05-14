-- ============================================================
-- 003_data_collection.sql
-- 데이터 수집 인프라 테이블 추가 / apartment_master 컬럼 확장
-- ============================================================

-- ── apt_transactions (매매 실거래가 - 백필 스크립트 호환) ──────
CREATE TABLE IF NOT EXISTS apt_transactions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawd_cd        text        NOT NULL,
  deal_ymd       text        NOT NULL,
  apt_name       text        NOT NULL,
  exclusive_area numeric     NOT NULL,
  deal_amount    int         NOT NULL,
  floor          int,
  build_year     int,
  dong           text,
  jibun          text,
  deal_date      text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(lawd_cd, apt_name, exclusive_area, floor, deal_date, deal_amount)
);

CREATE INDEX IF NOT EXISTS idx_apt_tx_lookup
  ON apt_transactions(lawd_cd, apt_name, exclusive_area);
CREATE INDEX IF NOT EXISTS idx_apt_tx_date
  ON apt_transactions(deal_date);

-- ── backfill_progress ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backfill_progress (
  lawd_cd       text        NOT NULL,
  deal_ymd      text        NOT NULL,
  status        text        NOT NULL DEFAULT 'pending',
  row_count     int         DEFAULT 0,
  fetched_at    timestamptz,
  error_message text,
  PRIMARY KEY (lawd_cd, deal_ymd)
);

-- ── daily_sync_log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_sync_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date         text        NOT NULL,
  target_ymds      text[],
  total_calls      int,
  total_rows       int,
  failed_regions   text[],
  duration_seconds int,
  created_at       timestamptz DEFAULT now()
);

-- ── apartment_master 컬럼 확장 ────────────────────────────────
ALTER TABLE apartment_master ADD COLUMN IF NOT EXISTS kapt_code  text UNIQUE;
ALTER TABLE apartment_master ADD COLUMN IF NOT EXISTS bjd_code   text;
ALTER TABLE apartment_master ADD COLUMN IF NOT EXISTS road_addr  text;
ALTER TABLE apartment_master ADD COLUMN IF NOT EXISTS use_date   text;
ALTER TABLE apartment_master ADD COLUMN IF NOT EXISTS total_dong int;

-- ── apartment_rent: deal_date 컬럼 + upsert용 unique constraint ─
ALTER TABLE apartment_rent ADD COLUMN IF NOT EXISTS deal_date text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'apartment_rent_uq'
  ) THEN
    ALTER TABLE apartment_rent
    ADD CONSTRAINT apartment_rent_uq
    UNIQUE(lawd_cd, apt_name, exclusive_area, floor, deal_date, deposit, monthly_rent);
  END IF;
END $$;

-- ── apt_transactions RLS 없음 (서비스 롤로만 write) ──────────
-- apartment_rent도 서비스 롤로만 write
