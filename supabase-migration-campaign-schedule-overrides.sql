-- ===========================================
-- 캠페인 착수 일정: 템플릿 자동 산출 대신 덮어쓸 날짜 (nullable)
-- Supabase SQL Editor에서 실행하세요.
-- ===========================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_list_delivery_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_shipping_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_upload_start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_upload_deadline_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_tracking_end_date DATE;

COMMENT ON COLUMN campaigns.schedule_list_delivery_date IS '명단 납품일 (수동 지정 시 템플릿 대신 사용)';
COMMENT ON COLUMN campaigns.schedule_shipping_date IS '배송일';
COMMENT ON COLUMN campaigns.schedule_upload_start_date IS '업로드 시작일';
COMMENT ON COLUMN campaigns.schedule_upload_deadline_date IS '업로드 마감일';
COMMENT ON COLUMN campaigns.schedule_tracking_end_date IS '트래킹 종료일 (미지정 시 업로드 시작+90일 규칙은 병합 로직에서 처리)';
