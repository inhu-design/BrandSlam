-- 개인 결제창(관리자 생성): 시딩/방문 수량·단가·라벨·부가세율 커스텀
-- Supabase SQL Editor에서 서비스 역할로 실행하거나 마이그레이션 파이프라인에 포함하세요.

create table if not exists public.custom_payment_offers (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  title text,
  seeding_qty integer not null default 0 check (seeding_qty >= 0),
  seeding_unit_price bigint not null default 0 check (seeding_unit_price >= 0),
  seeding_line_label text not null default '시딩(건당)',
  visit_qty integer not null default 0 check (visit_qty >= 0),
  visit_unit_price bigint not null default 0 check (visit_unit_price >= 0),
  visit_line_label text not null default '방문형 시딩(건당)',
  vat_rate numeric(8, 6) not null default 0.1 check (vat_rate >= 0 and vat_rate <= 1),
  is_active boolean not null default true,
  created_by_admin_email text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_payment_offers_line_check check (
    (seeding_qty > 0 and seeding_unit_price > 0)
    or (visit_qty > 0 and visit_unit_price > 0)
  )
);

create index if not exists custom_payment_offers_customer_email_idx
  on public.custom_payment_offers (lower(trim(customer_email)));

create index if not exists custom_payment_offers_created_at_idx
  on public.custom_payment_offers (created_at desc);

comment on table public.custom_payment_offers is '관리자가 고객 이메일별 맞춤 결제 금액·라인을 정의. API는 service role만 사용.';

alter table public.custom_payment_offers enable row level security;

-- 클라이언트 직접 접근 없음 (서버리스가 service role로만 접근)
create policy "custom_payment_offers_no_anon"
  on public.custom_payment_offers
  for all
  using (false)
  with check (false);
