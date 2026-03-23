-- ===========================================
-- Visit / Visit Content 착수 일정 수동 덮어쓰기 (nullable)
-- (기존 schedule_* 컬럼 마이그레이션 후 실행)
-- ===========================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_content_guide_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_reannounce_1_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_reannounce_2_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_notice_start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_notice_end_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_festival_start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_visit_festival_end_date DATE;

COMMENT ON COLUMN campaigns.schedule_visit_content_guide_date IS 'Visit: 콘텐츠 가이드 제작·소통 (명단+7일 템플릿)';
COMMENT ON COLUMN campaigns.schedule_visit_reannounce_1_date IS 'Visit: 인플루언서 재공지 1차';
COMMENT ON COLUMN campaigns.schedule_visit_reannounce_2_date IS 'Visit: 인플루언서 재공지 2차';
COMMENT ON COLUMN campaigns.schedule_visit_notice_start_date IS 'Visit: 개별 일정 안내 시작';
COMMENT ON COLUMN campaigns.schedule_visit_notice_end_date IS 'Visit: 개별 일정 안내 종료';
COMMENT ON COLUMN campaigns.schedule_visit_festival_start_date IS 'Visit: 현장 방문(행사·촬영 등) 시작일';
COMMENT ON COLUMN campaigns.schedule_visit_festival_end_date IS 'Visit: 현장 방문 종료일';
