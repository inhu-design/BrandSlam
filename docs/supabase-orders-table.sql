-- ===========================================
-- orders 테이블 (뱅크다 연동 및 결제 대기 주문용)
-- Checkout에서 이미 사용 중이면 테이블이 있을 수 있습니다.
-- 없을 때만 Supabase SQL Editor에서 실행하세요.
-- ===========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  plan_name TEXT,
  plan_price INTEGER,
  content_count INTEGER,
  email TEXT,
  name TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'pending_payment',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뱅크다 API는 서비스 롤로 조회/수정하므로 RLS 정책은 선택 사항입니다.
-- (서버에서만 접근 시 RLS 없이도 됩니다.)
