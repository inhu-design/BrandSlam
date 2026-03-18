-- ===========================================
-- 결제 완료 후 캠페인 생성용 orders 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.
-- ===========================================

-- orders 테이블에 user_id, client_address, client_biz_reg_no, order_items 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_biz_reg_no TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]';

-- order_items 형식: [{ plan_name, qty, unit_price, content_count, is_visit }, ...]
-- 결제 완료 시 이 데이터로 campaigns 생성
