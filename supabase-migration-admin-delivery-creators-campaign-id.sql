-- admin_delivery_creators: 캠페인별 납품 명단 (권장 연결 키)
-- list_slug 는 기존 공유 풀(BS-US-FARMSKIN 등)용 레거시 컬럼입니다.
-- 엑셀 업로드 시 campaign_id 를 지정하면 해당 캠페인에만 행이 귀속됩니다.

ALTER TABLE admin_delivery_creators
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_admin_delivery_creators_campaign_id
  ON admin_delivery_creators(campaign_id);

COMMENT ON COLUMN admin_delivery_creators.list_slug IS '레거시: 공유 풀 식별자(엑셀/운영 약어). campaign_id 가 있으면 조회·업로드는 캠페인 기준을 우선합니다.';
COMMENT ON COLUMN admin_delivery_creators.campaign_id IS '권장: 이 납품 행이 속한 campaigns.id';
