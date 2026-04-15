-- admin_delivery_creators: 엑셀 납품으로 새로 반영된 행을 고객 대시보드에서 "신규 교체" 등으로 표시
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE admin_delivery_creators
  ADD COLUMN IF NOT EXISTS is_replacement BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN admin_delivery_creators.is_replacement IS '엑셀 납품 등으로 최근 반영된 인원 표시용(고객 명단 UI)';
