-- ===========================================
-- 팜스킨 납품 리스트 + 드랍 추적
-- Supabase SQL Editor에서 실행하세요.
-- ===========================================

-- 1) admin_delivery_creators: 엑셀 원본 데이터 저장 (캠페인 무관 풀)
CREATE TABLE IF NOT EXISTS admin_delivery_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_slug TEXT NOT NULL DEFAULT 'BS-US-FARMSKIN',
  name TEXT,
  shipping_country TEXT,
  tiktok_url TEXT,
  tiktok_follower TEXT,
  instagram_url TEXT,
  instagram_follower TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_delivery_creators_slug ON admin_delivery_creators(list_slug);

-- RLS: 인증된 사용자 읽기 허용 (관리자 대시보드용)
ALTER TABLE admin_delivery_creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read admin_delivery_creators" ON admin_delivery_creators;
CREATE POLICY "Allow authenticated read admin_delivery_creators"
  ON admin_delivery_creators FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE는 service_role로만 (scripts/import-farmskin-excel.js)
-- 2) creator_drops: 고객이 드랍한 인플루언서 추적
CREATE TABLE IF NOT EXISTS creator_drops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_type TEXT NOT NULL,  -- 'campaign' | 'admin_preview'
  reference_id TEXT NOT NULL,    -- campaign_id (UUID) 또는 'BS-US-FARMSKIN' 등
  creator_id UUID,               -- creators.id (있을 경우)
  creator_name TEXT NOT NULL,
  creator_identifier TEXT,       -- name + platform 등 고유 식별
  dropped_at TIMESTAMPTZ DEFAULT NOW(),
  dropped_by_user_id UUID REFERENCES auth.users(id),
  dropped_by_email TEXT
);

CREATE INDEX IF NOT EXISTS idx_creator_drops_reference ON creator_drops(reference_type, reference_id);

-- RLS: 본인 캠페인 드랍만 읽기, 본인만 INSERT
ALTER TABLE creator_drops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own campaign drops" ON creator_drops;
CREATE POLICY "Users can read own campaign drops"
  ON creator_drops FOR SELECT
  TO authenticated
  USING (
    (reference_type = 'campaign' AND reference_id IN (SELECT id::text FROM campaigns WHERE user_id = auth.uid()))
    OR (reference_type = 'admin_preview')
  );

DROP POLICY IF EXISTS "Users can insert own drops" ON creator_drops;
CREATE POLICY "Users can insert own drops"
  ON creator_drops FOR INSERT
  TO authenticated
  WITH CHECK (
    dropped_by_user_id = auth.uid()
    AND (
      (reference_type = 'campaign' AND reference_id IN (SELECT id::text FROM campaigns WHERE user_id = auth.uid()))
      OR (reference_type = 'admin_preview')
    )
  );

DROP POLICY IF EXISTS "Users can delete own drops" ON creator_drops;
CREATE POLICY "Users can delete own drops"
  ON creator_drops FOR DELETE
  TO authenticated
  USING (dropped_by_user_id = auth.uid());
