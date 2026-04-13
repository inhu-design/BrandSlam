-- =============================================================================
-- The Frameless (suyoungkim@theframeless.co) 계약 조정
--   기존: 시딩(건당) 300건 + 방문형 시딩 10건 → 신규: 시딩(건당) 150건만
--
-- 결제 금액(부가세 포함): 5,250,000(공급) + 525,000(VAT) = 5,775,000원
-- order_items 1행: supply_amount 5,250,000, content_count 150, is_visit false
--
-- ⚠️ Supabase → SQL Editor 에서 실행하세요.
-- ⚠️ 먼저 아래 「1. 사전 조회」만 실행해 결과를 확인한 뒤, 「2. 적용」을 실행하세요.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 사전 조회 (이메일·캠페인·주문이 맞는지 확인)
-- -----------------------------------------------------------------------------
-- SELECT id, plan, product_name, target_creators, content_count, plan_price, order_number, status, customer_email
-- FROM campaigns
-- WHERE lower(trim(customer_email)) = 'suyoungkim@theframeless.co'
-- ORDER BY created_at;

-- SELECT id, order_number, plan_name, plan_price, content_count, status, email, order_items
-- FROM orders
-- WHERE lower(trim(email)) = 'suyoungkim@theframeless.co'
-- ORDER BY created_at;

-- -----------------------------------------------------------------------------
-- 2. 적용 (확인 후 한 번에 실행)
-- -----------------------------------------------------------------------------
BEGIN;

-- 방문형 캠페인 id 수집 (플랜/상품명/10건 Visit 행)
CREATE TEMP TABLE _frameless_visit_campaign_ids ON COMMIT DROP AS
SELECT c.id
FROM campaigns c
WHERE lower(trim(c.customer_email)) = 'suyoungkim@theframeless.co'
  AND (
    lower(coalesce(c.plan, '')) LIKE '%방문%'
    OR lower(coalesce(c.product_name, '')) LIKE '%방문%'
    OR lower(coalesce(c.plan, '')) LIKE '%visit%'
    OR lower(coalesce(c.product_name, '')) LIKE '%visit%'
    OR (
      coalesce(c.target_creators, 0) = 10
      AND coalesce(c.content_count, 0) = 10
    )
  );

-- 납품·드랍 세션은 campaign id 문자열 참조 — FK 없음, 수동 삭제
DELETE FROM creator_drops
WHERE reference_type = 'campaign'
  AND reference_id IN (SELECT id::text FROM _frameless_visit_campaign_ids);

DELETE FROM delivery_list_sessions
WHERE reference_type = 'campaign'
  AND reference_id IN (SELECT id::text FROM _frameless_visit_campaign_ids);

-- creators/contents 는 campaigns ON DELETE CASCADE 가 있으면 자동 삭제됨
DELETE FROM campaigns
WHERE id IN (SELECT id FROM _frameless_visit_campaign_ids);

-- 시딩(대량) 캠페인: 300·310 등 → 150건, 금액 VAT포함 5,775,000원
UPDATE campaigns
SET
  target_creators = 150,
  content_count = 150,
  matched_creators = LEAST(coalesce(matched_creators, 0), 150),
  plan_price = 5775000,
  plan = '시딩(건당) x150',
  product_name = '시딩(건당) x150'
WHERE lower(trim(customer_email)) = 'suyoungkim@theframeless.co'
  AND (
    coalesce(target_creators, 0) IN (300, 310)
    OR coalesce(content_count, 0) IN (300, 310)
  );

-- 위 조건에 안 잡히는 시딩 행(수동으로 숫자만 바꾼 경우 등): 시딩(건당) 문구가 있고 Visit 가 아닌 행
UPDATE campaigns
SET
  target_creators = 150,
  content_count = 150,
  matched_creators = LEAST(coalesce(matched_creators, 0), 150),
  plan_price = 5775000,
  plan = '시딩(건당) x150',
  product_name = '시딩(건당) x150'
WHERE lower(trim(customer_email)) = 'suyoungkim@theframeless.co'
  AND id NOT IN (SELECT id FROM _frameless_visit_campaign_ids)
  AND (
    lower(coalesce(plan, '')) LIKE '%시딩(건당)%'
    OR lower(coalesce(product_name, '')) LIKE '%시딩(건당)%'
  )
  AND lower(coalesce(plan, '')) NOT LIKE '%방문%'
  AND lower(coalesce(product_name, '')) NOT LIKE '%방문%'
  AND coalesce(target_creators, 0) > 150;

-- orders: 합산 주문 1건 기준 (이메일 일치 행 전부 갱신 — 보통 1건)
-- paid 주문만 바꾸려면 WHERE 절에 AND lower(coalesce(status,'')) = 'paid' 추가
UPDATE orders
SET
  content_count = 150,
  plan_price = 5775000,
  plan_name = '시딩(건당) x150',
  order_items = '[{"plan_name":"시딩(건당) x150","qty":1,"unit_price":0,"content_count":150,"is_visit":false,"supply_amount":5250000}]'::jsonb
WHERE lower(trim(email)) = 'suyoungkim@theframeless.co';

COMMIT;

-- =============================================================================
-- 3. 실행 후 검증
-- =============================================================================
-- SELECT id, plan, product_name, target_creators, content_count, plan_price, customer_email
-- FROM campaigns
-- WHERE lower(trim(customer_email)) = 'suyoungkim@theframeless.co';

-- SELECT order_number, plan_name, plan_price, content_count, order_items
-- FROM orders
-- WHERE lower(trim(email)) = 'suyoungkim@theframeless.co';
