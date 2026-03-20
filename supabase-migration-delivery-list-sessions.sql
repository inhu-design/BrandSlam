-- ===========================================
-- 납품 리스트 세션: 3일 드랍 기한, 드랍 확정 추적
--
-- ⚠️ 리스트 확정 시 "delivery_list_sessions not in schema cache" 오류가 나면
--    이 파일 전체를 Supabase → SQL Editor → New query 에 붙여넣고 Run 하세요.
--    자세한 단계: docs/supabase-setup-ko.md
-- ===========================================

CREATE TABLE IF NOT EXISTS delivery_list_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_type TEXT NOT NULL,   -- 'campaign' | 'admin_preview'
  reference_id TEXT NOT NULL,    -- campaign_id 또는 'BS-US-FARMSKIN'
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- 리스트 제공일 (3일 기한 시작)
  drop_confirmed_at TIMESTAMPTZ,                -- 드랍 확정일 (null = 미확정)
  status TEXT NOT NULL DEFAULT 'sent',          -- 'sent' | 'drop_confirmed' | 'final_delivered'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reference_type, reference_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_list_sessions_user ON delivery_list_sessions(user_id, reference_type, reference_id);

ALTER TABLE delivery_list_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own delivery sessions" ON delivery_list_sessions;
CREATE POLICY "Users can manage own delivery sessions"
  ON delivery_list_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 최종 납품 리스트용 배송정보 (드랍 확정 후 대체 인원 포함)
CREATE TABLE IF NOT EXISTS final_delivery_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES delivery_list_sessions(id) ON DELETE CASCADE,
  creator_identifier TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  platform TEXT,
  sns_url TEXT,
  followers TEXT,
  shipping_country TEXT,
  shipping_address TEXT,
  shipping_zip_code TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_final_delivery_creators_session ON final_delivery_creators(session_id);

ALTER TABLE final_delivery_creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read final delivery via session" ON final_delivery_creators;
CREATE POLICY "Users can read final delivery via session"
  ON final_delivery_creators FOR SELECT
  TO authenticated
  USING (
    session_id IN (SELECT id FROM delivery_list_sessions WHERE user_id = auth.uid())
  );
