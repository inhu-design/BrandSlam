-- admin_delivery_creators: Visit 플랜 납품 리스트용 방문일 (엑셀 `visit date` 등)
-- Supabase SQL Editor에서 한 번 실행하세요.

ALTER TABLE admin_delivery_creators
  ADD COLUMN IF NOT EXISTS visit_date TEXT;

COMMENT ON COLUMN admin_delivery_creators.visit_date IS '방문일(표시용 문자열, 예: May 13, 2026)';
