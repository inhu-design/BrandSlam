# BS-US-FARMSKIN 엑셀 임포트

## 1. 엑셀 → JSON (로컬)

```bash
npm run import:farmskin -- "C:\Users\...\Downloads\BS-US-FARMSKIN.xlsx"
```

또는

```bash
node scripts/import-farmskin-excel.js "C:\경로\BS-US-FARMSKIN.xlsx"
```

- `src/data/test-influencers.json` 이 자동으로 갱신됩니다.
- Supabase `admin_delivery_creators` 테이블이 있으면, `SUPABASE_SERVICE_ROLE_KEY` 환경변수 설정 시 업로드됩니다.

## 2. Supabase 업로드

환경변수 설정 후 실행:

```bash
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run import:farmskin -- "C:\경로\BS-US-FARMSKIN.xlsx"
```

## 3. Supabase 마이그레이션

`supabase-migration-delivery-creators.sql` 을 Supabase SQL Editor에서 실행하세요.

- `admin_delivery_creators`: 엑셀 원본 데이터 저장
- `creator_drops`: 고객 드랍 내역 저장
