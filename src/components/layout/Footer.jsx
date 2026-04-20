import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import logoImg from '../../assets/logo.png';

// --- 법적 고지 데이터 ---
const LEGAL_CONTENTS = {
  terms: {
    title: "이용약관",
    content: `제1조 (목적)

본 약관은 주식회사 브랜드슬램(이하 "B")이 운영하는 플랫폼 기반 인플루언서 매니지먼트 시스템(이하 "SLAM GLOBAL")의 이용 조건, 절차, 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.


제2조 (서비스의 성격)

1. SLAM GLOBAL은 단순 상품 판매가 아닌 무형의 콘텐츠 기획·운영 대행 서비스입니다.

2. 결제 완료 즉시 다음 업무가 자동 개시됩니다.
  - 캠페인 구조 설계
  - 콘텐츠 내러티브 기획
  - 브랜드 가이드라인 정리
  - 인플루언서 풀 분석 및 매칭 준비
  - 운영 리소스 배정

3. 본 서비스는 전문 인력 및 시스템이 투입되는 용역으로서, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따른 청약철회 제한 용역에 해당할 수 있습니다.


제3조 (계약 성립 및 서비스 개시)

1. 계약은 브랜드사(이하 "A")가 서비스 신청 및 결제를 완료한 시점에 성립됩니다.

2. 계약 성립과 동시에 운영 리소스가 배정되며, 이를 서비스 개시로 간주합니다.


제4조 (서비스 운영 및 Replacement Content)

1. 본 서비스는 성과 보장형 계약이 아닙니다. 업로드 수, 조회수, 매출, 전환율 등은 보장되지 않습니다.

2. 캠페인 진행 중 콘텐츠 미업로드가 발생할 경우, 금전 환불이 아닌 Replacement Content(동일 수량 대체 제공) 방식으로 처리됩니다.

3. Replacement Content는 다음 기준을 따릅니다.
  - 동일 또는 유사 유형의 콘텐츠 서비스
  - 현금 환불 또는 금전 크레딧 전환 불가
  - 업로드 기한 종료 후 산정

4. Replacement Content는 본 계약상 유일한 사후 보완 조치입니다.


제5조 (업로드 정책)

1. 모든 크리에이터의 업로드 기한은 제품 배송일로부터 90일입니다.

2. 배송일은 B의 출고·전달 리스트 기준으로 산정됩니다.

3. 브랜드가 과도한 추가 가이드 또는 복잡한 수정 요청을 요구할 경우, 업로드율(회수율)이 저하될 수 있으며 이 경우 Replacement Content 제공 대상에서 제외될 수 있습니다.


제6조 (책임의 제한)

B는 다음 사항에 대해 책임을 지지 않습니다.
  - 크리에이터의 표현 방식 및 콘텐츠 톤
  - 플랫폼 정책 변경에 따른 노출 제한
  - 시장 환경 변화에 따른 성과 차이
  - 브랜드 내부 사정에 따른 일정 변경

본 서비스는 마케팅 운영 지원 서비스이며, 최종 매출 및 성과 책임은 A에게 귀속됩니다.


제7조 (콘텐츠 레퍼런스 활용)

1. 캠페인 수행 과정에서 인플루언서(크리에이터)가 제작·업로드한 콘텐츠는 SLAM GLOBAL의 서비스 소개, 포트폴리오, 마케팅 자료 등 레퍼런스 목적으로 활용될 수 있습니다.

2. 레퍼런스 활용 범위는 다음을 포함합니다.
  - SLAM GLOBAL 웹사이트, 소셜 미디어, 제안서 등에서의 사례 소개
  - 잠재 고객 대상 서비스 설명 시 캠페인 결과물 예시로 사용
  - 기타 SLAM GLOBAL의 서비스 홍보 및 브랜드 신뢰도 구축을 위한 활용

3. 본 조항에 따른 레퍼런스 활용에 대해 별도의 비용은 발생하지 않으며, A는 서비스 이용 신청 시 이에 동의한 것으로 간주합니다.

4. A가 레퍼런스 활용을 원하지 않는 경우, 서면(이메일 포함)으로 B에게 통보할 수 있으며, B는 합리적인 기간 내에 해당 콘텐츠의 레퍼런스 사용을 중단합니다.`
  },
  privacy: {
    title: "개인정보처리방침",
    content: `1. 개인정보의 처리 목적
주식회사 브랜드슬램(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
- 서비스 제공: 콘텐츠 마케팅 자동화 서비스 제공, 계약서 작성, 요금 결제 및 정산
- 고객 관리: 서비스 이용에 따른 본인확인, 개인식별, 가입의사 확인, 문의사항 처리
- 마케팅 및 광고 활용: 신규 서비스 개발, 이벤트 정보 및 참여기회 제공

2. 수집하는 개인정보의 항목
회사는 서비스 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.
- 필수항목: 회사명, 담당자 이름, 연락처(휴대전화번호), 이메일 주소, 웹사이트 주소
- 자동수집항목: 쿠키(Cookie), 서비스 이용 기록, 접속 로그, 접속 IP 정보

3. 개인정보의 보유 및 이용 기간
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
- 서비스 가입 및 이용 기간: 서비스 종료 시까지
- 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지

4. 개인정보의 제3자 제공
회사는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.

5. 쿠키(Cookie)의 운용 및 거부
회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 이용자는 웹브라우저 옵션 설정을 통해 쿠키 허용 여부를 선택할 수 있습니다.`
  },
  refund: {
    title: "결제 및 환불 규정",
    content: `제1조 (결제 방식)

  - 서비스는 선결제 방식입니다.
  - 결제 완료 시 계약이 성립됩니다.
  - 서비스 결제와 동시에 기획·분석·운영 리소스가 투입됩니다.


제2조 (환불 기준)

1) 결제 후 3일 이내 & 인플루언서 리스트 전달 전
  → 전액 환불 가능

2) 리스트 전달 이후
  → 환불 불가
  → Replacement Content 규정 적용


제3조 (Replacement Content 규정 — 거절 및 재매칭 포함)

1. 인플루언서 리스트 확정 및 교환 기한
  - 대시보드에 인플루언서 리스트 업로드 알림 발송 시점을 기준으로, 발송일 포함 3일째 자정(23:59)까지 확정 또는 거절 의사를 완료해야 합니다.

2. 기한 경과 시 자동 확정
  - 3일 경과 시 리스트는 자동 확정되며, 이후 교환은 불가합니다.

  ※ 인플루언서와의 초기 소통 지연은 업로드율에 직접적인 영향을 미치므로 기한 엄수를 원칙으로 합니다.

3. 교환 가능 범위
  - 최초 발주 수량의 30% 이내에서 교환 가능합니다.
  - 30% 초과 교환은 불가합니다.


제4조 (콘텐츠 미업로드 및 Replacement Content)

1. 콘텐츠 업로드 기한은 제품 배송일 기준 90일입니다.

2. 90일 이내 업로드되지 않은 콘텐츠는 금전 환불이 아닌 동일 수량 Replacement Content(대체 제공)로 처리됩니다.

3. Replacement Content 산정 시점
  - 각 크리에이터의 90일 업로드 기한 종료 후, 익월 말 일괄 산정

4. 사용 방식
  - 차기 캠페인 또는 동일 서비스 유형 내 재사용 가능
  - 현금 환불 또는 금전 크레딧 전환 불가


제5조 (Performance Recovery Program)

1. 품질 인식 고지
  - 본 서비스는 KOC 기반 자발적 창작물입니다.
  - 가이드라인과 100% 동일한 결과물 제공을 보장하지 않습니다.
  - 플랫폼 특성상 크리에이터 고유의 표현 방식이 존중됩니다.

2. 회수율 관리 기준
  - 기본 목표 회수율: 85% 이상
  - 산정 기준: 배송일 기준 90일 경과 시점, 실제 업로드 완료 수량 ÷ 발주 수량

3. Performance Recovery 조건
  결제 후 3개월 이내, 최초 발주 수량 기준 회수율이 85% 미만일 경우 다음 조건 충족 시 Recovery 적용:
  - 브랜드 가이드라인을 단순화 또는 완화할 것
  - 추가 수정 요청 최소화
  - 일정 내 피드백 완료

  위 조건 충족 시:
  - 최초 발주 수량의 최대 25% 범위 내 재모집 진행
  - 이를 통해 최종 회수율 95% 이상 도달을 목표로 관리

  ※ 100% 절대 보장은 아닙니다.
  ※ 브랜드의 과도한 가이드 변경 시 적용 제외 가능합니다.


고객 중심 소통 약속

BrandSlam은 브랜드사가 직접 운영하는 것보다 더 체계적이고 밀도 높은 운영 품질을 제공하는 것을 목표로 합니다.

  - 모든 캠페인은 실시간 모니터링됩니다.
  - 업로드 현황은 대시보드에서 투명하게 확인 가능합니다.
  - 개선 요청 및 전략 수정은 고객센터를 통해 즉시 반영됩니다.

우리는 단순 실행자가 아니라, 브랜드의 글로벌 운영 파트너입니다.`
  }
};

// --- 모달 컴포넌트 ---
const LegalModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed whitespace-pre-wrap h-full">
          {content}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeModal]);

  const handleSectionClick = (e, path) => {
    if (path.startsWith('/#')) {
      e.preventDefault();
      const id = path.replace('/#', '');
      
      const scrollToElement = () => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      };

      if (location.pathname === '/') {
        scrollToElement();
      } else {
        navigate('/');
        setTimeout(scrollToElement, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const footerSections = [
    {
      title: "Product",
      items: [
        { name: "고객 사례", path: "/#cases" },
        { name: "프로세스", path: "/#process" },
        { name: "요금제", path: "/#pricing" }
      ]
    },
    {
      title: "Company",
      items: [
        { name: "회사 소개", path: "/about" },
        { name: "인플루언서 매니지먼트 시스템", path: "/management" },
        { name: "문의하기", path: "/consulting" },
        { name: "FAQ", href: "https://spiral-playground-cff.notion.site/306259eb52488045a8b1f4ec3b64dfe9" }
      ]
    },
    {
      title: "Legal",
      items: [
        { name: "이용약관", modalKey: "terms" },
        { name: "개인정보처리방침", modalKey: "privacy" },
        { name: "결제 및 환불 규정", modalKey: "refund" }
      ]
    }
  ];

  return (
    <>
      <footer className="bg-white pt-20 pb-10 border-t border-gray-100 text-sans relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            
            <div className="col-span-2 lg:col-span-2 space-y-4">
              <Link to="/" onClick={scrollToTop} className="inline-block">
                 {logoImg ? (
                   <img 
                     src={logoImg} 
                     alt="slam-global" 
                     className="h-16 w-auto object-contain" 
                   />
                 ) : (
                   <span className="font-bold text-xl tracking-tighter text-blue-900">slam-global</span>
                 )}
              </Link>

              <p className="text-gray-500 text-sm max-w-xs leading-relaxed mt-2">
                slam-global은 글로벌 뷰티 브랜드를 위한 <br className="hidden md:block" />
                <span className="font-bold text-gray-900">올인원 인플루언서 마케팅 자동화 솔루션</span> 입니다. 
              </p>
            </div>
            
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-gray-900 mb-6">{section.title}</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  {section.items.map((item, i) => (
                    <li key={i}>
                      {item.modalKey ? (
                        <button
                          onClick={() => setActiveModal(item.modalKey)}
                          className="hover:text-indigo-600 cursor-pointer transition-colors text-left"
                        >
                          {item.name}
                        </button>
                      ) : item.href ? (
                        <a 
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.path.startsWith('/#') ? (
                          <a 
                            href={item.path} 
                            onClick={(e) => handleSectionClick(e, item.path)}
                            className="hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {item.name}
                          </a>
                        ) : (
                          <Link 
                            to={item.path} 
                            onClick={scrollToTop}
                            className="hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {item.name}
                          </Link>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-gray-100">
            <div className="flex flex-col gap-6">
              <div className="text-[11px] md:text-xs text-gray-400 space-y-1.5 leading-relaxed">
                <p className="font-bold text-gray-500 mb-2">주식회사 브랜드슬램 (Brand Slam Inc.)</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>대표자: 장현우</span>
                  <span className="hidden md:inline">|</span>
                  <span>사업자등록번호: 284-88-03016</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>주소: 서울시 용산구 한강대로 366, 트윈시티 8층</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>이메일: contact@slam-global.com</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>대표전화번호 : 070-8027-2323</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-gray-400 mt-2">
                <p>© 2024 Brand Slam Inc. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <LegalModal 
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal ? LEGAL_CONTENTS[activeModal].title : ""}
        content={activeModal ? LEGAL_CONTENTS[activeModal].content : ""}
      />
    </>
  );
};

export default Footer;