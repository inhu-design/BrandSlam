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
