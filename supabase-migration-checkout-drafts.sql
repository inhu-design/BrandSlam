-- 카드 결제: 결제 완료 전 orders 행을 만들지 않고, 임시 초안만 저장합니다.
-- Supabase SQL Editor에서 실행하세요.

CREATE TABLE IF NOT EXISTS checkout_drafts (
  oid TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_drafts_created_at ON checkout_drafts (created_at);

ALTER TABLE checkout_drafts ENABLE ROW LEVEL SECURITY;
-- API는 service_role만 사용 (클라이언트 직접 접근 없음)
