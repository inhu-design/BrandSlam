-- admin_delivery_creators: 업로드·트래킹 단계용 게시 URL 및 엑셀 지표
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE admin_delivery_creators
  ADD COLUMN IF NOT EXISTS posting_tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS posting_instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS metric_views TEXT,
  ADD COLUMN IF NOT EXISTS metric_likes TEXT,
  ADD COLUMN IF NOT EXISTS metric_comments TEXT,
  ADD COLUMN IF NOT EXISTS metric_saves TEXT,
  ADD COLUMN IF NOT EXISTS metric_shares TEXT;

COMMENT ON COLUMN admin_delivery_creators.posting_tiktok_url IS '게시물 URL (TikTok) — 엑셀 Posting URL (TT)';
COMMENT ON COLUMN admin_delivery_creators.posting_instagram_url IS '게시물 URL (Instagram) — 엑셀 Posting URL (IG)';
COMMENT ON COLUMN admin_delivery_creators.metric_views IS '엑셀 Views (표시용 문자열)';
COMMENT ON COLUMN admin_delivery_creators.metric_likes IS '엑셀 Likes 등';
COMMENT ON COLUMN admin_delivery_creators.metric_comments IS '엑셀 Comments';
COMMENT ON COLUMN admin_delivery_creators.metric_saves IS '엑셀 Saves';
COMMENT ON COLUMN admin_delivery_creators.metric_shares IS '엑셀 share';
