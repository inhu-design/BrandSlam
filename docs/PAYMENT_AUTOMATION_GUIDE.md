# 입금/결제 자동화 구축 가이드

목표: **1단계 뱅크다(입금 자동 확인)** → **2단계 KG 이니시스(카드 결제)** 순으로 연동

---

## 현재 사이트 상태

- **결제 흐름**: Checkout에서 주문 제출 시 `orders`(status: `pending_payment`), `campaigns`(status: `PAYMENT_PENDING`) 생성
- **입금 확인**: 수동(DB 직접 수정) 또는 사용자 클릭 없음. 자동화 미구축
- **백엔드**: Supabase만 사용 중, 별도 Node 서버/Edge Function 없음

---

## 1단계: 뱅크다 — 계좌입금 자동 확인

### 1.1 뱅크다란?

- **뱅크다**: 은행 계좌 입출금 내역을 자동 수집·매칭해 주는 서비스
- **뱅크다A** (a.bankda.com): 개인/소규모용, 월 요금제
- 입금자명·금액을 주문 정보와 비교해 **자동 입금완료** 처리 (5~10분 주기)
- SC제일은행 등 20개 이상 은행 지원 (사이트에서 사용 중인 SC제일은행 확인 필요)

### 1.2 데이터 수신 방식 (택 1)

| 방식 | 설명 | 우리 사이트에 필요한 것 |
|------|------|---------------------------|
| **REST API** | 주기적으로 뱅크다 API로 입출금 내역 조회 | 백엔드(또는 Edge Function)에서 주기 호출 |
| **DB 전송** | 뱅크다가 우리 DB로 입출금 내역 INSERT | DB 테이블 + 뱅크다 측 DB 연동 설정 |
| **Webhook** | 입금 발생 시 뱅크다 → 우리 서버 URL 호출 | **공개 URL이 있는 서버** (또는 Edge Function) |

- **Webhook**이 있으면 실시간에 가깝게 처리 가능. 없으면 **REST API 주기 조회** 또는 **DB 전송**으로 구현.

### 1.3 구현 시 필요한 것

1. **뱅크다 가입 및 계약**
   - [뱅크다A](https://a.bankda.com/) 또는 [개발자/파트너](https://dev-a.bankda.com/customer) 문의
   - 사용 중인 **SC제일은행 계좌** 연동 가능 여부 확인

2. **입금 알림을 받을 서버(엔드포인트)**
   - Supabase만 쓰는 경우 → **Supabase Edge Functions**로 Webhook/API 수신 권장  
     - 예: `https://<project>.supabase.co/functions/v1/bankda-deposit`
   - 별도 서버(Node, Spring 등)가 있으면 그쪽에 Webhook URL 구현

3. **주문·캠페인과 매칭할 정보**
   - 뱅크다에서 오는 데이터: 입금자명, 금액, 입금일시 등  
   - 우리 DB: `orders.order_number`, `orders.plan_price`(또는 총액), `orders.name`(입금자명과 비교)
   - **매칭 로직**: 입금금액 + 입금자명(또는 order_number 등)으로 `orders` 1건 특정 후 상태 변경

4. **DB 업데이트**
   - 입금 확인 시:
     - `orders.status`: `pending_payment` → `paid`(또는 `payment_confirmed`)
     - 해당 주문의 `order_number`로 연결된 `campaigns.status`: `PAYMENT_PENDING` → `KICKOFF`
   - Supabase Client 권한으로는 Webhook에서 직접 DB 수정이 어려우므로, **Edge Function**에서 `service_role`로 Supabase에 update 하거나, RLS 정책을 열어둔 뒤 Webhook 핸들러에서 update

### 1.4 뱅크다 연동 체크리스트

- [ ] 뱅크다 가입 및 SC제일은행 계좌 연동
- [ ] 입금 알림 수신 방식 결정: Webhook / API 주기 조회 / DB 전송
- [ ] Supabase Edge Function(또는 자체 서버)에 **입금 알림 수신 URL** 구현
- [ ] 뱅크다에서 전달하는 필드 확인(입금자명, 금액, 메모 등) 후 **orders와 매칭 로직** 작성
- [ ] 매칭 성공 시 `orders.status`, `campaigns.status` 업데이트
- [ ] (선택) 입금 확인 시 이메일/알림 발송

---

## 2단계: KG 이니시스 — 카드 결제 자동화

### 2.1 KG 이니시스란?

- 국내 대표 PG사. **카드 결제** + **가상계좌(무통장)** 모두 지원
- **INI API**로 모듈 없이 REST API 연동 가능 (공식 매뉴얼: https://manual.inicis.com)

### 2.2 결제 방식 선택

| 방식 | 특징 | 우리 사이트 적용 |
|------|------|-------------------|
| **카드 결제** | 결제 시점에 즉시 승인, 자동 확정 | 최종 목표에 적합 |
| **가상계좌** | 주문 시 가상계좌 발급 → 입금 후 **입금통보(noti)** 로 자동 확인 | 뱅크다 대신 또는 병행 가능 |

- **최종 목표가 카드 결제**이므로, 이니시스 연동 시 **카드 결제 플로우**를 메인으로 설계
- 필요하면 **가상계좌**도 추가해 “카드 or 무통장” 선택 가능하게 구성

### 2.3 KG 이니시스 연동 준비

1. **KG 이니시스 가맹점 계약**
   - MID(상점아이디), INIAPI Key 발급
   - 테스트(스테이징) / 운영 환경 구분

2. **결제 요청 플로우 (카드)**
   - 프론트(React): 결제창 호출 또는 API로 결제 요청 파라미터 전달
   - 이니시스 측에서 결제 완료 후 **인증/승인 결과**를 우리 서버로 보냄 → **승인 API 호출** 후 DB 반영

3. **백엔드 필요**
   - **인증/승인 결과 수신 URL** (카드 결제 완료 콜백)
   - **가상계좌** 사용 시: **입금통보 URL**(P_NOTI_URL 또는 가맹점관리자 설정)
   - 두 URL 모두 **공개 도메인 + HTTPS** 필요 → Supabase Edge Function 또는 자체 서버

4. **DB 반영**
   - 결제(또는 입금통보) 확인 시:
     - `orders.status` → `paid`
     - 해당 `campaigns.status` → `KICKOFF`
   - (선택) `orders`에 결제일시, PG 거래번호 등 저장 컬럼 추가

### 2.4 이니시스 연동 체크리스트

- [ ] KG 이니시스 가맹점 계약 및 MID, INIAPI Key 확보
- [ ] 공식 매뉴얼에서 **카드 결제 요청/승인/취소** API 스펙 확인
- [ ] 결제 결과 수신 URL(Edge Function 또는 자체 서버) 구현
- [ ] 프론트(Checkout)에서 이니시스 결제창 또는 API 호출 연동
- [ ] 결제 성공 시 `orders`/`campaigns` 상태 업데이트
- [ ] (선택) 가상계좌 사용 시 입금통보 URL 설정 및 동일한 상태 업데이트 로직

---

## 권장 진행 순서

1. **뱅크다 (입금 자동화)**
   - 뱅크다 가입 및 계좌 연동
   - Supabase Edge Function으로 “입금 알림 수신 → orders/campaigns 업데이트” 구현
   - Checkout은 현재처럼 “계좌이체 안내”만 하고, **입금 완료 버튼 제거**  
     → 입금 확인은 뱅크다 연동으로만 처리
   - 대시보드: `campaigns.status === 'KICKOFF'`일 때만 “캠페인 세팅하기” 노출 (이미 반영 권장)

2. **KG 이니시스 (카드 결제)**
   - 이니시스 계약 및 테스트 환경 구성
   - Edge Function(또는 서버)에 결제 결과/입금통보 URL 구현
   - Checkout에 “카드 결제” 플로우 추가 (이니시스 결제창 또는 API)
   - 결제 성공 시 동일하게 `orders`/`campaigns` 상태 업데이트

3. **UI 정리**
   - “입금 완료” 버튼 제거
   - “캠페인 세팅하기”는 **입금/결제 확인된 경우에만** 노출되도록 로직 통일

---

## Supabase Edge Function 예시 (개념)

입금 알림을 받을 때 campaigns를 KICKOFF로 바꾸는 예시(의사 코드):

```text
// Supabase Edge Function: bankda-deposit (또는 inicis-noti)
// 1. 뱅크다/이니시스에서 POST로 입금 정보 수신
// 2. order_number 또는 (금액+입금자명)으로 orders 행 조회
// 3. 해당 order의 order_number로 campaigns 조회
// 4. orders.status = 'paid', campaigns.status = 'KICKOFF' 로 update
// 5. (선택) 이메일 발송
```

실제 구현 시에는 각 PG/뱅크다 문서의 **요청 형식, 서명 검증, 중복 처리**를 반드시 확인해야 합니다.

---

## 참고 링크

- 뱅크다: https://a.bankda.com , 개발자: https://dev-a.bankda.com
- KG 이니시스 매뉴얼: https://manual.inicis.com
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

이 가이드를 기준으로 1단계(뱅크다)부터 적용한 뒤, 2단계(KG 이니시스 카드)로 확장하면 됩니다.
