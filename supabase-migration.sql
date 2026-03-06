-- ===========================================
-- BrandSlam: campaigns / creators / contents
-- Supabase SQL Editor에서 이 스크립트를 실행하세요.
-- ===========================================

-- 1) campaigns 테이블
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  order_number TEXT,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'PAYMENT_PENDING',
  brand_name TEXT,
  product_name TEXT,
  start_date DATE,
  end_date DATE,
  target_creators INTEGER DEFAULT 0,
  matched_creators INTEGER DEFAULT 0,
  kpi_views TEXT DEFAULT '-',
  kpi_likes TEXT DEFAULT '-',
  kpi_comments TEXT DEFAULT '-',
  kpi_shares TEXT DEFAULT '-',
  plan_price INTEGER,
  content_count INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2) creators 테이블 (캠페인 진행 시 관리자가 데이터 입력)
CREATE TABLE creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  platform TEXT,
  status TEXT,
  link TEXT,
  engagement TEXT,
  views TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own creators"
  ON creators FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- 3) contents 테이블 (캠페인 진행 시 관리자가 데이터 입력)
CREATE TABLE contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  views TEXT,
  creator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contents"
  ON contents FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- ===========================================
-- 추가 마이그레이션: 고객 정보 칼럼 (인보이스용)
-- 이미 campaigns 테이블이 생성된 경우 아래만 실행하세요.
-- ===========================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_biz_reg_no TEXT;

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- 캠페인 세팅 제출 (Campaign Setup 폼 저장)
-- ===========================================
CREATE TABLE campaign_setup_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaign_setup_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own campaign setup"
  ON campaign_setup_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can read own campaign setup"
  ON campaign_setup_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- ===========================================
-- 뷰: 캠페인 세팅 제출 데이터를 항목별 컬럼으로 보기
-- Table Editor에서 campaign_setup_submissions_view 선택하면 항목별로 구분되어 보입니다.
-- (기존 뷰가 있을 때 컬럼 추가/변경 시 Supabase SQL Editor에서 DROP VIEW campaign_setup_submissions_view; 실행 후 아래 CREATE VIEW 실행)
-- ===========================================
DROP VIEW IF EXISTS campaign_setup_submissions_view;
CREATE VIEW campaign_setup_submissions_view AS
SELECT
  s.id,
  s.campaign_id,
  s.user_id,
  s.created_at,
  s.form_data->>'companyName'        AS 회사명,
  s.form_data->>'contactName'        AS 담당자명,
  s.form_data->>'contactTitle'       AS 직함,
  s.form_data->>'contactPhone'       AS 연락처,
  s.form_data->>'contactEmail'       AS 담당자이메일,
  s.form_data->>'productName'        AS 캠페인제품명,
  s.form_data->>'uspAndLinks'        AS 제품USP_링크_참고숏폼,
  s.form_data->>'countryRange'       AS 거주국가범위,
  s.form_data->>'deliveryTime'       AS 배송예상기간,
  s.form_data->>'deliveryOther'      AS 배송기간_기타,
  s.form_data->>'targetAudienceCountry' AS 타겟오디언스국가,
  s.form_data->>'signature'          AS 담당자서명,
  s.form_data->>'writtenDate'        AS 작성일,
  s.form_data->'productPhotoUrls'    AS 제품사진_URL목록,
  s.form_data                         AS form_data_전체,
  s.form_data->>'eventName'          AS 행사명,
  CASE
    WHEN s.form_data->'eventSchedule' IS NOT NULL AND jsonb_typeof(s.form_data->'eventSchedule') = 'array'
    THEN (SELECT string_agg(elem, ', ' ORDER BY elem) FROM jsonb_array_elements_text(s.form_data->'eventSchedule') AS elem)
    ELSE s.form_data->>'eventSchedule'
  END                                 AS 행사일정,
  s.form_data->>'eventVenue'         AS 행사장소,
  s.form_data->>'eventGift'          AS 브랜드사_증정선물
FROM campaign_setup_submissions s;

-- 뷰 조회 권한: 원본 테이블과 동일하게 본인 제출만
ALTER VIEW campaign_setup_submissions_view SET (security_invoker = on);

-- (선택) RLS가 뷰에 상속되려면 뷰를 통한 조회 시 underlying table RLS가 적용됩니다.
-- Supabase Table Editor에서 이 뷰를 열면 form_data가 항목별 컬럼으로 보입니다.

-- ===========================================
-- Storage: 캠페인 세팅 제품 사진 업로드용 버킷
-- 버킷이 이미 있으면 Dashboard > Storage에서 'campaign-photos' 이름으로
-- public 버킷을 만들고, 아래 두 정책만 SQL로 추가하세요.
-- ===========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-photos', 'campaign-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 업로드: 로그인 사용자만 자신의 경로에 업로드 가능
CREATE POLICY "Users can upload campaign photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 공개 읽기: 버킷이 public이므로 URL만 있으면 누구나 조회 가능 (담당자 확인용)
CREATE POLICY "Public read campaign photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'campaign-photos');
