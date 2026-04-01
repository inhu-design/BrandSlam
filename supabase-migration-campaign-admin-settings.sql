-- ===========================================
-- 캠페인 런타임 설정 (관리자 UI에서 즉시 변경)
-- - 코드 재배포 없이 가이드라인/리스트 연결/운영 플래그를 관리
-- ===========================================

CREATE TABLE IF NOT EXISTS campaign_admin_settings (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  linked_list_slug TEXT,
  notion_guideline_url TEXT,
  notion_guideline_title TEXT,
  notion_guideline_description TEXT,
  force_drop_complete_message BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_admin_settings_updated_at
  ON campaign_admin_settings(updated_at DESC);

ALTER TABLE campaign_admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own campaign admin settings" ON campaign_admin_settings;
CREATE POLICY "Users can read own campaign admin settings"
  ON campaign_admin_settings FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users cannot write campaign admin settings directly" ON campaign_admin_settings;
CREATE POLICY "Users cannot write campaign admin settings directly"
  ON campaign_admin_settings FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "Users cannot update campaign admin settings directly" ON campaign_admin_settings;
CREATE POLICY "Users cannot update campaign admin settings directly"
  ON campaign_admin_settings FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "Users cannot delete campaign admin settings directly" ON campaign_admin_settings;
CREATE POLICY "Users cannot delete campaign admin settings directly"
  ON campaign_admin_settings FOR DELETE
  TO authenticated
  USING (FALSE);
