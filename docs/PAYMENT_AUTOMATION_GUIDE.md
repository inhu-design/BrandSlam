# 입금/결제 자동화 가이드 (KG 이니시스 전용)

목표: **KG 이니시스**로 카드 결제와 실시간 계좌이체를 처리

---

## 현재 사이트 상태

- **결제 흐름**: Checkout에서 주문 제출 시 `orders`(status: `pending_payment`), `campaigns`(status: `PAYMENT_PENDING`) 생성
- **카드 결제**: 결제 완료 시 `payment-callback`에서 `paid`/`KICKOFF`로 갱신 → 대시보드 착수 화면
- **실시간 계좌이체**: 결제 완료 시 `payment-callback`에서 `paid`/`KICKOFF`로 갱신 → 대시보드 착수 화면 (카드와 동일)

---

## KG 이니시스 연동

### 결제 방식

| 방식 | 특징 | 처리 흐름 |
|------|------|---------------------------|
| **카드 결제** | 결제 시점에 즉시 승인 | payment-callback → paid/KICKOFF |
| **실시간 계좌이체** | 결제창에서 은행 선택 후 즉시 이체 | payment-callback → paid/KICKOFF |

### 법인계좌 연동

실시간 계좌이체 시 **KG 이니시스 가맹점 계약**에 등록된 법인계좌(SC제일은행 325-20-322490)로 입금됩니다.  
가맹점관리자에서 정산 계좌가 설정되어 있으면 별도 코드 연동 없이 자동 처리됩니다.

### API 엔드포인트

| API | 용도 |
|-----|------|
| `/api/inicis/payment-params` | 결제창 호출용 파라미터 생성 |
| `/api/inicis/payment-callback` | 결제 결과 수신 (returnUrl). 카드·계좌이체 성공 시 paid/KICKOFF |

---

## DB 반영

- 결제 확인 시:
  - `orders.status` → `paid`
  - 해당 `campaigns.status` → `KICKOFF`
- 대시보드: `PAYMENT_PENDING` → 송장 발급/캠페인 세팅, `KICKOFF` → 착수 화면

---

## 참고 링크

- KG 이니시스 매뉴얼: https://manual.inicis.com
- 가맹점관리자: https://iniweb.inicis.com
