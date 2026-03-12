# 뱅크다(Bankda) 연동 가이드

고객 결제(무통장 입금) 내역을 뱅크다와 연동하여 **자동 입금 확인**이 되도록 설정하는 방법입니다.

---

## 1. 뱅크다 화면에서 할 일

### 1) 설정 > 상점 연동

- **이용여부**: `이용중` 선택 (자동 입금확인을 위해 필수)
- **매치 가능 건수**: 0이면 자동 입금확인 불가 → 필요 시 **충전하기**로 건수 확보

### 2) API URL 입력

우리 사이트에 배포된 API 주소를 아래 세 필드에 **https 포함 전체 URL**로 입력한 뒤 **저장**합니다.

| 항목 | 입력할 URL (예시) |
|------|-------------------|
| **미확인 주문 API URL** | `https://your-domain.com/api/bankda/unconfirmed-orders` |
| **주문 상세 API URL** | `https://your-domain.com/api/bankda/order-detail` |
| **입금 확인 처리 API URL** | `https://your-domain.com/api/bankda/confirm-deposit` |

- **주의**: URL에 슬래시가 두 개 들어가면 안 됩니다. (`https://...com//api/...` ❌ → `https://...com/api/...` ✅)
- **뱅크다 ‘연동 테스트’ 통과:** 테스트는 “미확인 주문이 1건 이상 있어야 성공”으로 동작합니다. 실제 주문이 없을 때 테스트만 통과하려면, **미확인 주문 API URL**에 쿼리만 붙여서 입력하세요.  
  - 테스트용: `https://your-domain.com/api/bankda/unconfirmed-orders?bankda_test=1`  
  - 테스트 성공 후 **저장**한 뒤, 실제 운영 시에는 `?bankda_test=1`을 제거한 URL로 다시 저장해 두는 것을 권장합니다.
- 로컬 테스트 시: `https://your-vercel-app.vercel.app/api/bankda/...` 형태로 배포된 주소 사용
- 각 입력란 옆 **테스트** 버튼으로 호출 가능 여부 확인

### 3) IP 허용 (방화벽 사용 시)

뱅크다 서버에서 우리 API를 호출하므로, 방화벽·IP 제한이 있으면 아래 IP를 허용해야 합니다.

- `13.209.86.108`
- `124.198.76.144/28` (124.198.76.146 ~ 158)

### 4) API 연동 가이드

뱅크다 화면의 **API 연동 가이드 > 보기**에서 요청/응답 스펙을 확인할 수 있습니다. 우리 API는 해당 스펙에 맞춰 구현되어 있습니다.

---

## 2. 우리 사이트에서 제공하는 API

### 2.1 미확인 주문 API (미확인주문리스트)

- **역할**: 입금 확인 전 주문 목록을 뱅크다에 전달
- **메서드**: GET
- **URL**: `/api/bankda/unconfirmed-orders`
- **응답 예시**:
```json
{
  "orders": [
    {
      "order_id": "BS-20260312-XXXXXXXX",
      "buyer_name": "홍길동",
      "billing_name": "홍길동",
      "bank_account_no": "32520322490",
      "bank_code_name": "SC제일",
      "order_price_amount": 649000,
      "order_date": "2026-03-12 09:49:35",
      "items": [{ "product_name": "Growth 20개" }]
    }
  ]
}
```

### 2.2 주문 상세 API

- **역할**: 주문번호 하나에 대한 상세 정보 반환
- **메서드**: POST
- **URL**: `/api/bankda/order-detail`
- **요청 body**: `{ "order_id": "BS-20260312-XXXXXXXX" }`
- **응답**: 뱅크다 스펙에 따라 **`order` 키로 감싼 객체 한 건** 반환. 예: `{ "order": { "order_id": "...", "buyer_name": "...", ... } }` (오류 시 401 등)

### 2.3 입금 확인 처리 API

- **역할**: 뱅크다가 매칭된 주문을 “입금 확인됨”으로 알려주면, 우리 DB에서 해당 주문/캠페인 상태를 갱신
- **메서드**: POST
- **URL**: `/api/bankda/confirm-deposit`
- **요청 body**: `{ "requests": [{"order_id": "BS-20260312-XXX"}, ...] }`
- **동작**: 해당 `order_id`의 주문·캠페인을 입금 확인 상태로 변경 (다음 단계 진행 가능)

---

## 3. 환경 변수 (배포 시)

API에서 Supabase를 사용하므로, **서버(또는 Vercel) 환경 변수**에 다음을 설정해야 합니다.

| 변수명 | 설명 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL (예: `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 (Dashboard > Settings > API에서 확인) |

- **주의**: `SUPABASE_SERVICE_ROLE_KEY`는 브라우저/클라이언트에 노출하면 안 되며, **서버/API 전용**으로만 사용해야 합니다.

---

## 4. 자동 입금 확인 흐름 요약

1. 고객이 결제(무통장) 접수 → 우리 사이트에서 주문/캠페인 생성 (status: 입금 대기)
2. 뱅크다가 주기적으로 **미확인 주문 API**로 입금 대기 주문 목록 조회
3. 뱅크다가 **주문 상세 API**로 필요 시 상세 조회
4. 뱅크다가 은행 입금 내역과 매칭 후, 매칭된 주문에 대해 **입금 확인 처리 API** 호출
5. 우리 사이트에서 해당 주문/캠페인을 입금 확인 상태로 변경 → 대시보드에서 다음 단계(계약 확정 등) 진행 가능

---

## 5. 문제 해결

- **테스트 실패**: URL이 `https`인지, 배포된 도메인에서 실제로 해당 경로가 열리는지, 확인
- **401 인증 오류**: 뱅크다 API 가이드의 인증 방식(헤더 등)이 있다면 동일하게 적용했는지 확인
- **주문이 안 보임**: `orders` 테이블의 `status`가 `pending_payment`인 건만 미확인 주문으로 내려갑니다. 테스트용 주문이 해당 상태인지 확인
- **입금 확인 후에도 대시보드 반영 안 됨**: `confirm-deposit` API가 `orders`와 `campaigns` 모두 업데이트하는지, 로그/DB에서 확인

이 문서는 뱅크다 연동 설정과 우리 API 사용 방법을 정리한 것입니다. 뱅크다 측 스펙이 바뀌면 API 응답 형식을 맞춰 수정해야 할 수 있습니다.
