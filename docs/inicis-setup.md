# KG이니시스 결제 연동 가이드

KG이니시스에 결제 신청 후 발급받은 **MID(상점아이디)** 와 **웹결제 Sign Key**를 환경 변수로 설정하면 **신용카드** 및 **실시간 계좌이체** 결제가 동작합니다.  
**키는 반드시 Vercel(또는 호스팅) 환경 변수에만 넣고, 코드/저장소에는 넣지 마세요.**

---

## 1. 이니시스에서 쓰는 키 정리

| 이니시스 관리자 항목 | 우리 연동에서 사용 | 비고 |
|---------------------|-------------------|------|
| **상점ID (MID)** | `INICIS_MID` | 계약정보/상점정보에서 확인 |
| **웹결제 Sign Key** | `INICIS_SIGNKEY` | 결제 요청 서명·검증에 필수 |
| 모바일 금액위변조 Hash Key | 사용 안 함 | 현재 웹 표준결제만 사용 |
| INIAPI Key / iv | 사용 안 함 | 필요 시 추후 연동 |

---

## 2. 지금 할 일 – Vercel 환경 변수

1. **Vercel** → 해당 프로젝트 → **Settings** → **Environment Variables**
2. 아래 두 개 추가 (Production·Preview 등 필요한 환경에 체크)

| Name | Value |
|------|--------|
| `INICIS_MID` | 이니시스 관리자 **계약정보/상점정보**에서 확인한 **상점ID** (MID) |
| `INICIS_SIGNKEY` | 이니시스 **KEY 정보** → **웹결제 Sign Key** 조회해서 복사한 값 |

3. (선택) 결제 결과 리다이렉트 기준 URL이 `https://www.slam-global.com` 이 아니면  
   `INICIS_RETURN_BASE_URL` = `https://실제도메인` 추가
4. **저장** 후 **Deployments**에서 **Redeploy** (최신 배포 기준으로 재배포)

---

## 3. Supabase에서 할 일

- **없음.** 이니시스 연동만으로는 Supabase에 추가 설정할 것은 없습니다.  
  (주문/캠페인은 기존 `orders`, `campaigns` 테이블 그대로 사용)

---

## 3. 사이트 동작 흐름

1. **결제 단계**에서 결제 수단을 **실시간 계좌이체** / **신용카드** 중 선택
2. 선택한 수단에 따라 **계좌이체 결제하기** 또는 **신용카드 결제** 클릭  
   → 주문·캠페인 생성 후 이니시스 결제창(팝업) 오픈
3. 이니시스 결제창에서 카드 정보 입력 또는 은행 선택 후 인증 진행
4. 결제 완료 시 이니시스가 우리 서버 **`/api/inicis/payment-callback`** 으로 결과 전송  
   → 주문/캠페인 상태를 결제 완료로 갱신 후 **`/checkout/result`** 로 리다이렉트
5. **결제 완료** 페이지에서 대시보드 이동 또는 메인으로 이동

---

## 4. 카드 승인 테스트 (1,000원)

배포된 사이트에서 로그인 후 아래 주소로 이동합니다.

- `https://www.slam-global.com/checkout?plan=PgTest`

결제 금액은 **VAT 포함 1,000원**이며, 일반 요금제 선택 화면에는 노출되지 않습니다. **신용카드**로 결제한 뒤 이니시스 관리자·Supabase `orders`(paid)·Vercel `/api/inicis/payment-callback` 로그를 확인하세요.

---

## 5. 테스트 환경(스테이징)

- 이니시스 **테스트 MID**를 쓰는 경우 결제창 요청 URL이 **스테이징**일 수 있습니다.
- 현재 코드는 **운영** URL 기준: `https://stdpay.inicis.com/stdpay/INIStdPay.php`
- 스테이징용 URL로 바꿔야 하면 `src/pages/Checkout.jsx` 안 `handleCardPayment`의 `formEl.action` 값을 스테이징 주소로 수정하면 됩니다. (이니시스 매뉴얼 참고)

---

## 5. 문제 해결

- **결제창이 안 뜨거나 "결제 정보 생성에 실패했습니다"**  
  - `INICIS_MID`, `INICIS_SIGNKEY` 환경 변수 설정 여부 확인  
  - 재배포 후 다시 시도
- **"signature 값이 잘못되었습니다" (V021)**  
  - 전달하는 `oid`, `price`, `timestamp`와 서명 생성 시 사용한 값이 일치하는지 확인  
  - `api/inicis/payment-params.js`에서 서명 생성 로직 확인
- **결제는 됐는데 주문/캠페인 상태가 안 바뀜**  
  - 이니시스가 호출하는 **returnUrl**이 `https://도메인/api/inicis/payment-callback` 인지 확인  
  - 방화벽/리버스프록시에서 해당 경로 차단 여부 확인  
  - Vercel 로그에서 `payment-callback` 호출 및 에러 로그 확인

---

이 문서는 키 발급 후 환경 변수만 넣으면 연동이 완료되도록 정리한 것입니다. 이니시스 쪽 스펙이 바뀌면 API·결제창 요청 형식을 맞춰 수정해야 할 수 있습니다.
