-- ===========================================
-- BrandSlam: CPM 라인 — Supabase SQL Editor에서 실행하거나 CLI로 적용하세요.
-- 공개 레이트카드 조회와 로그인 사용자 주문 cpm_orders 를 분리(RLS).
-- ===========================================

-- Rate cards (공개 카탈로그)
CREATE TABLE IF NOT EXISTS public.cpm_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'KR',
  channel TEXT NOT NULL DEFAULT 'mixed',
  creative_format TEXT NOT NULL DEFAULT 'feed_video',
  cpm_floor_krw NUMERIC NOT NULL CHECK (cpm_floor_krw > 0),
  summary TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  external_tenant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cpm_rate_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published cpm_rate_cards"
  ON public.cpm_rate_cards;
CREATE POLICY "Anyone can read published cpm_rate_cards"
  ON public.cpm_rate_cards FOR SELECT
  USING (
    is_published = true
    AND (effective_to IS NULL OR effective_to > NOW())
    AND (effective_from IS NULL OR effective_from <= NOW())
  );

-- 관리 카드 작성은 서비스 롤 또는 SQL Editor에서 수행 (anon 인서트 없음)

-- Orders
CREATE TABLE IF NOT EXISTS public.cpm_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES public.cpm_rate_cards (sku),
  budget_krw BIGINT NOT NULL CHECK (budget_krw > 0),
  quoted_cpm_krw NUMERIC NOT NULL CHECK (quoted_cpm_krw > 0),
  estimated_impressions BIGINT NOT NULL CHECK (estimated_impressions > 0),
  currency TEXT NOT NULL DEFAULT 'KRW',
  status TEXT NOT NULL DEFAULT 'draft',
  reviewer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cpm_orders_status_chk CHECK (
    status IN (
      'draft',
      'pending_payment',
      'paid',
      'creatives_submitted',
      'review_pending',
      'review_passed',
      'review_failed',
      'cleared',
      'cancelled'
    )
  )
);

CREATE INDEX IF NOT EXISTS cpm_orders_user_id_idx ON public.cpm_orders (user_id);
CREATE INDEX IF NOT EXISTS cpm_orders_status_idx ON public.cpm_orders (status);

ALTER TABLE public.cpm_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own cpm_orders"
  ON public.cpm_orders;
CREATE POLICY "Users read own cpm_orders"
  ON public.cpm_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own cpm_orders"
  ON public.cpm_orders;
CREATE POLICY "Users insert own cpm_orders"
  ON public.cpm_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own draft cpm_orders"
  ON public.cpm_orders;
CREATE POLICY "Users update own draft cpm_orders"
  ON public.cpm_orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'pending_payment'))
  WITH CHECK (auth.uid() = user_id);

-- Review hook audit (본인 오더 조회 허용; 서버 콜백은 service role 로 기록 권장)
CREATE TABLE IF NOT EXISTS public.cpm_review_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.cpm_orders (id) ON DELETE CASCADE,
  correlation_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'webhook',
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cpm_review_hooks_order_id_idx ON public.cpm_review_hooks (order_id);

ALTER TABLE public.cpm_review_hooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read review hooks on own orders"
  ON public.cpm_review_hooks;
CREATE POLICY "Users read review hooks on own orders"
  ON public.cpm_review_hooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cpm_orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- Attribution (MVP 저장소; 추후 플랫폼 1번과 통합 가능)
CREATE TABLE IF NOT EXISTS public.attribution_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  label TEXT,
  domain TEXT,
  pixel_id TEXT,
  utm_template JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attribution_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own attribution_assets"
  ON public.attribution_assets;
CREATE POLICY "Users manage own attribution_assets"
  ON public.attribution_assets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 시드 카드 (예시 SKU)
INSERT INTO public.cpm_rate_cards (sku, country_code, channel, creative_format, cpm_floor_krw, summary, is_published)
VALUES
  ('CPM-KR-TT-FEED-V1', 'KR', 'tiktok', 'feed_video', 18500,
   '한국 TikTok 피드 성과 기준 CPM (예시 플로어)', true),
  ('CPM-KR-IG-STORY-V1', 'KR', 'instagram', 'story', 22000,
   'Instagram 스토리 플레이스먼트 (예시)', true),
  ('CPM-US-TT-FEED-V1', 'US', 'tiktok', 'feed_video', 12500,
   'US TikTok 피드 예시 카드', true)
ON CONFLICT (sku) DO NOTHING;
