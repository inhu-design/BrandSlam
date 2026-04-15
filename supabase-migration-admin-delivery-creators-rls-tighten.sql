-- ===========================================
-- admin_delivery_creators: SELECT RLS 강화
-- 기존 정책은 "인증된 사용자 전체 읽기"라 타 계정 명단(인플루언서 정보)이 유출될 수 있었습니다.
--
-- 실행 순서(이 파일 하나로 가능):
-- 1) 아래 campaign_id 컬럼이 없으면 추가 (이미 있으면 IF NOT EXISTS 로 건너뜀)
-- 2) RLS 정책 교체
--
-- 실행 전: campaign_admin_settings 테이블 존재 권장
--   (없으면 supabase-migration-campaign-admin-settings.sql 먼저 실행)
-- 레거시: 코드만으로 list_slug 를 붙이고 DB에 linked_list_slug 가 없는 캠페인은,
--         campaign_admin_settings 에 linked_list_slug 를 넣거나 admin_delivery_creators 에 campaign_id 를 채워 주세요.
-- ===========================================

-- 0) RLS가 campaign_id 를 참조하므로, 아직 없으면 추가 (supabase-migration-admin-delivery-creators-campaign-id.sql 과 동일)
ALTER TABLE admin_delivery_creators
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_admin_delivery_creators_campaign_id
  ON admin_delivery_creators(campaign_id);

COMMENT ON COLUMN admin_delivery_creators.list_slug IS '레거시: 공유 풀 식별자(엑셀/운영 약어). campaign_id 가 있으면 조회·업로드는 캠페인 기준을 우선합니다.';
COMMENT ON COLUMN admin_delivery_creators.campaign_id IS '권장: 이 납품 행이 속한 campaigns.id';

-- 1) 기존 전체 읽기 정책 제거 후 제한 정책 생성
DROP POLICY IF EXISTS "Allow authenticated read admin_delivery_creators" ON admin_delivery_creators;

CREATE POLICY "Users read delivery rows for own campaigns or linked slug"
  ON admin_delivery_creators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM campaigns c
      WHERE c.user_id = auth.uid()
        AND (
          admin_delivery_creators.campaign_id = c.id
          OR (
            admin_delivery_creators.campaign_id IS NULL
            AND admin_delivery_creators.list_slug IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM campaign_admin_settings cas
              WHERE cas.campaign_id = c.id
                AND cas.linked_list_slug IS NOT NULL
                AND trim(cas.linked_list_slug) = trim(admin_delivery_creators.list_slug)
            )
          )
        )
    )
  );

COMMENT ON POLICY "Users read delivery rows for own campaigns or linked slug" ON admin_delivery_creators IS
  '본인 캠페인에 붙은 campaign_id 행, 또는 본인 캠페인 런타임 linked_list_slug 와 일치하는 list_slug 행만 SELECT';
