# 입금/결제 자동화 가이드 (KG 이니시스 전용)

목표: **KG 이니시스**로 카드 결제와 실시간 계좌이체를 처리

---

## 현재 사이트 상태

- **결제 흐름**: Checkout에서 주문 제출 시 `orders`(status: `pending_payment`), `campaigns`(status: `PAYMENT_PENDING`) 생성
- **카드 결제**: 결제 완료 시 `payment-callback`에서 `orders`만 `paid`로 갱신 → 대시보드 송장·캠페인 세팅 → 세팅 완료 시 착수
- **무통장 입금**: `confirm-bank-transfer`에서 `orders`를 `pending_payment`로 생성 → 관리자 입금 확인 후 `paid` → 송장·캠페인 세팅

---

## KG 이니시스 연동

### 결제 방식

| 방식 | 특징 | 처리 흐름 |
|------|------|---------------------------|
| **카드 결제** | 결제 시점에 즉시 승인 | payment-callback → orders paid (campaigns PAYMENT_PENDING 유지) |
| **계좌이체** | 법인계좌 입금 후 결제 완료 버튼 | confirm-bank-transfer → orders paid (campaigns PAYMENT_PENDING 유지) |

### 법인계좌 (계좌이체)

계좌이체 선택 시 법인계좌(SC제일은행 325-20-322490) 정보가 표시됩니다. 고객이 직접 입금 후 결제 완료 버튼을 누릅니다.

### API 엔드포인트

| API | 용도 |
|-----|------|
| `/api/inicis/payment-params` | 결제창 호출용 파라미터 생성 |
| `/api/inicis/payment-callback` | 결제 결과 수신 (returnUrl). 카드 성공 시 orders만 paid |
| `/api/checkout/confirm-bank-transfer` | 무통장 입금 신청. orders pending_payment (관리자가 paid로 전환) |

---

## DB 반영

- 결제 확인 시: `orders.status` → `paid` (campaigns는 PAYMENT_PENDING 유지)
- 캠페인 세팅 완료 시: `campaigns.status` → `KICKOFF` (CampaignSetup에서 처리)
- 대시보드: `PAYMENT_PENDING` → 송장 발급·캠페인 세팅, `KICKOFF` → 착수 화면

---

## 참고 링크

- KG 이니시스 매뉴얼: https://manual.inicis.com
- 가맹점관리자: https://iniweb.inicis.com
