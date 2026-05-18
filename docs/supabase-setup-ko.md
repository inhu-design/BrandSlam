# Supabase 설정 (드랍·납품 리스트)

대시보드에서 **리스트 확정**, **3일 드랍 기한**을 쓰려면 `delivery_list_sessions` 테이블이 필요합니다.

## 오류: `Could not find the table 'public.delivery_list_sessions' in the schema cache`

프로젝트에 있는 SQL을 Supabase에 **한 번 실행**하면 해결됩니다.

### 실행 방법

1. [Supabase 대시보드](https://supabase.com/dashboard) → 본인 프로젝트 선택  
2. 왼쪽 **SQL Editor**  
3. **New query**  
4. 저장소 루트의 **`supabase-migration-delivery-list-sessions.sql`** 파일 내용을 **전부 복사**해 붙여넣기  
5. **Run** (또는 Ctrl+Enter)

같은 화면에서 아래도 필요하면 순서대로 실행하세요.

| 파일 | 용도 |
|------|------|
| `supabase-migration-delivery-creators.sql` | 납품 인플루언서 풀 + `creator_drops` |
| `supabase-migration-admin-delivery-visit-date.sql` | `admin_delivery_creators.visit_date` (웰코스 MX Visit 리스트 등) |
| `supabase-migration-admin-delivery-posting-metrics.sql` | `admin_delivery_creators` 게시 URL(TT/IG)·Views 등 (업로드·트래킹 대시보드) |
| `supabase-migration-creator-drops-limit.sql` | (선택) BS-US-FARMSKIN 드랍 15명 DB 제한 |
| `supabase-migration-checkout-drafts.sql` | 카드 결제: 결제 전 `orders` 대신 임시 저장용 `checkout_drafts` (결제 API 필수) |

실행 후 **잠시 기다렸다가** 브라우저를 새로고침하세요. (스키마 캐시 반영 지연 시 1~2분 걸릴 수 있습니다.)

## 특정 고객 캠페인에 BS-US-FARMSKIN 납품 리스트 연결

`Dashboard.jsx`에서 **이메일·제품명 키워드**로 매칭되는 캠페인에 `admin_delivery_creators`(동일 `list_slug`) 데이터를 붙이고, 착수(KICKOFF) 단계에서 **「인플루언서 납품 리스트 받아보기」**로 동일 드랍·세션 로직을 씁니다. 드랍·세션은 `reference_type: campaign`, `reference_id: 해당 캠페인 UUID`로 저장되어 관리자 미리보기(`admin_preview`)와 분리됩니다.

- 제품명/브랜드명이 바뀌면 안 되는 경우, Vercel(또는 로컬) 환경 변수 **`VITE_LINKED_DELIVERY_CAMPAIGN_ID`**에 Supabase `campaigns.id`(UUID)만 넣으면 이메일·키워드 없이 해당 캠페인만 연결할 수 있습니다. 이때 **`VITE_LINKED_DELIVERY_LIST_SLUG`**로 `list_slug`를 지정합니다 (예: `BS-US-FARMSKIN`, `BS-MX-WELCOS`).
- **웰코스 `mkt01@welcos.com` · KWAILNARA · Visit 플랜**: `list_slug = BS-MX-WELCOS` 행을 `npm run import:welcos -- "…BS-MX-웰코스.xlsx"` 로 넣습니다. (`visit_date`·게시 URL 컬럼용 SQL은 위 표의 `supabase-migration-admin-delivery-visit-date.sql`, `supabase-migration-admin-delivery-posting-metrics.sql` 참고.)
