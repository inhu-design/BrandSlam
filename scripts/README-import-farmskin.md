# BS-US-FARMSKIN 엑셀 임포트

## 1. 엑셀 → JSON (로컬)

```bash
npm run import:farmskin -- "C:\Users\...\Desktop\BS-US-FARMSKIN.xlsx"
```

또는

```bash
node scripts/import-farmskin-excel.js "C:\경로\BS-US-FARMSKIN.xlsx"
```

- `src/data/test-influencers.json` 이 자동으로 갱신됩니다. (TikTok·인스타 각각 `sns_channels` + URL/팔로워 원본 필드 포함 — 대시보드에서 둘 다 노출)
- Supabase `admin_delivery_creators` 테이블이 있으면, `SUPABASE_SERVICE_ROLE_KEY` 환경변수 설정 시 업로드됩니다.

## 2. Supabase 업로드

환경변수 설정 후 실행:

```bash
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run import:farmskin -- "C:\경로\BS-US-FARMSKIN.xlsx"
```

PowerShell (Windows):

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="서비스롤-키"; npm run import:farmskin -- "C:\Users\...\팜스킨 4명수정.xlsx"
```

스크립트는 `list_slug = BS-US-FARMSKIN` 행을 **전부 삭제한 뒤** 엑셀 내용으로 다시 채웁니다.

## 3. Supabase 마이그레이션

**리스트 확정 / 드랍 기한** 기능: `supabase-migration-delivery-list-sessions.sql` 을 반드시 실행하세요. (미실행 시 `delivery_list_sessions` 테이블 오류) — 단계는 `docs/supabase-setup-ko.md` 참고.

`supabase-migration-delivery-creators.sql` 을 Supabase SQL Editor에서 실행하세요.

- `admin_delivery_creators`: 엑셀 원본 데이터 저장
- `creator_drops`: 고객 드랍 내역 저장

선택: BS-US-FARMSKIN 드랍 상한(15명)을 DB에서도 강제하려면 `supabase-migration-creator-drops-limit.sql` 을 실행하세요.

---

## BS-MX-WELCOS (웰코스 KWAILNARA Visit)

1. Supabase에서 **`supabase-migration-admin-delivery-visit-date.sql`** 실행 (`visit_date` 컬럼).
2. 서비스 롤 키 설정 후:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="서비스롤-키"; npm run import:welcos -- "C:\Users\...\Downloads\BS-MX-웰코스.xlsx"
```

- `list_slug = BS-MX-WELCOS` 행만 삭제 후 다시 삽입합니다. (`test-influencers.json` 은 건드리지 않습니다.)
- 게시 URL·동반자·Spark ads 등: **`supabase-migration-admin-delivery-posting-metrics.sql`** 와 **`supabase-migration-admin-delivery-companion-spark.sql`** 적용 후 임포트하세요.

---

## 팜스킨 heather 2차 (드랍 11명 교체 + Visit 1명)

엑셀 **`팜스킨 2차 추가.xlsx`**: 시트 `scale50(2026.03) Delivery`(11명), `visit(2026.03) `(1명).

1. `SUPABASE_SERVICE_ROLE_KEY` 설정
2. 실행:

```powershell
npm run import:farmskin-phase2 -- "C:\Users\...\Desktop\팜스킨 2차 추가.xlsx"
```

- 주문 **`BS-20260316-BEF0DBCE`**: 해당 캠페인 `creator_drops` 삭제 → 드랍됐던 이름과 일치하는 `BS-US-FARMSKIN` 행 삭제 → 시트 11명 insert → `delivery_list_sessions` 확정 되돌림  
- 주문 **`BS-20260324-FC62D99F` (Visit)**: `BS-US-FARMSKIN-VISIT` 전체 삭제 후 visit 시트 1명 insert, 드랍·세션 정리  

대시보드는 `BS-US-FARMSKIN-VISIT` 을 주문번호·Visit 플랜으로 자동 연동합니다.

검증만: `node scripts/farmskin-heather-phase2.js "경로.xlsx" --dry-run`

**드랍이 DB에서 이미 지워진 경우** 제거할 11명 이름을 쉼표로:

```powershell
$env:FARMSKIN_NAMES_TO_REMOVE="이름1,이름2,..."; npm run import:farmskin-phase2 -- "...\팜스킨 2차 추가.xlsx"
```

엑셀 scale 시트에 **`드롭 인원` = true** 인 행을 두면, 그 행의 `name`도 제거 대상에 합쳐집니다. (교체 11명 행은 `false`/비움)

**Visit에 50명이 보이던 이유:** `BS-US-FARMSKIN-VISIT` 행이 없을 때 예전 코드가 `test-influencers`(50명)로 채웠음 → 대시보드 수정됨. 스크립트로 visit 시트 1명 insert 필요.
