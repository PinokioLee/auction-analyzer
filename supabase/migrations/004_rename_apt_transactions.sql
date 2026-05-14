-- ============================================================
-- 004_rename_apt_transactions.sql
-- apt_transactions → apartment_trade 통합
-- ============================================================

-- 기존 빈 apartment_trade 삭제 (migration 002에서 만든 다른 스키마)
DROP TABLE IF EXISTS apartment_trade;

-- apt_transactions → apartment_trade 이름 변경
-- (인덱스, 제약조건, 권한 모두 자동 이전됨)
ALTER TABLE apt_transactions RENAME TO apartment_trade;
