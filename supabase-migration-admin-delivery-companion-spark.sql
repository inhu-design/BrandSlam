-- admin_delivery_creators: 웰코스 엑셀 동반자 정보 · Spark ads
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE admin_delivery_creators
  ADD COLUMN IF NOT EXISTS companion_info TEXT,
  ADD COLUMN IF NOT EXISTS spark_ads TEXT;

COMMENT ON COLUMN admin_delivery_creators.companion_info IS '엑셀 동반자 정보';
COMMENT ON COLUMN admin_delivery_creators.spark_ads IS '엑셀 spark ads (URL 또는 문구)';
