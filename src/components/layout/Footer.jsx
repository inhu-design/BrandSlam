import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Users, X } from 'lucide-react';
import logoImg from '../../assets/logo.png';

// --- [수정] 법적 고지 데이터 업데이트 ---
const LEGAL_CONTENTS = {
  terms: {
    title: "이용약관 (취소 및 환불 정책)",
    content: `제1조 (취소 및 환불 기준)

1. 결제 후 7일 이내 취소
계약 체결일(결제일)로부터 7일 이내이며, 인플루언서 리스트가 A(고객사)에게 전달되기 전인 경우에 한하여, 단순 변심에 의한 계약 취소가 가능하며 이 경우 결제 금액 전액을 환불합니다.

2. 결제 후 30일 이내 & 리스트 전달 전
계약 체결일(결제일)로부터 30일 이내이며, 인플루언서 리스트가 A(고객사)에게 전달되기 전인 경우, 단순 변심에 의한 계약 취소 시 결제 금액의 50%를 환불합니다.
해당 환불 비율은 이미 투입된 기획, 분석, 운영 리소스 비용을 고려한 것입니다.

3. 인플루언서 리스트 전달 이후
인플루언서 리스트가 A(고객사)에게 전달된 시점부터는 본 계약에 따른 서비스가 실질적으로 개시된 것으로 간주하며, 그 이후에는 서비스 진행 여부, 콘텐츠 업로드 여부와 관계없이 계약 취소 및 환불은 불가합니다.


제2조 (환불 불가 사유)

다음 각 호의 사유에 해당하는 경우에는 본 조 제1항과 관계없이 환불이 불가합니다.

1. A(고객사)의 내부 사정 변경 또는 담당자 변경
2. 기대치 불일치 또는 성과에 대한 주관적 판단
3. 가이드라인 변경, 일정 지연, 피드백 미이행
4. 콘텐츠 스타일, 톤앤매너, 인플루언서 성향에 대한 불만


제3조 (콘텐츠 미업로드 및 사후 관리)

본 계약은 성과 보장형 계약이 아니며, 콘텐츠 미업로드 또는 회수율 관련 이슈 발생 시, 환불, 감액 또는 손해배상을 청구할 수 없습니다.

해당 경우 B(브랜드슬램)는 계약서 및 별도 가이드에 따라 교환·재매칭 또는 추가 모집(A/S)을 합리적인 범위 내에서 제공하며, 이는 본 계약상 유일한 보완 조치로 합니다.`
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
    title: "결제 및 환불 규정 (서비스 운영 정책)",
    content: `1. 결제 및 환불 규정
- 결제 단위: 브랜드슬램의 서비스는 효율적인 애셋 구축과 관리를 위해 3개월 단위로만 결제가 가능합니다.
- 취소 및 환불 불가 기준: 결제 후 최초 인플루언서 리스팅(1개월 차)이 진행된 시점부터는 취소 및 환불이 절대 불가합니다. 이는 브랜드 상품 분석, 내러티브 생성, 전담 팀 구성 등 사전 투입되는 리소스 비용을 고려한 조치입니다.
- 단, 브랜드사가 입력한 정보가 서비스 목적과 현저히 맞지 않다고 판단될 경우, 저희 측에서 먼저 취소를 제안하거나 적합한 새로운 서비스를 제안해 드려 리스크를 최소화해 드립니다.

2. 브랜드사 정보 입력 및 가이드라인
- 정확한 정보 제공: 만족도 높은 결과를 위해 캠페인 전략, 인플루언서 소통 메시지, 주의사항 및 중요 포인트를 최대한 명확하게 작성해 주셔야 합니다.
- 가이드라인 변경: 최초 제공된 '밈(Meme) 기반 내러티브 가이드'에서 최초 1회에 한해 변경 가능합니다.
- 난이도 조절: 제조사 헤리티지 반영 등 KOC가 수행하기 어려운 고난도 요청은 회수율 저하의 원인이 됩니다. 이 경우 캠페인 종료 후 KOL 전용 서비스로의 전환을 권장합니다.

3. 콘텐츠 교환 (거절 및 재매칭) 기한
- 교환 기한: 대시보드에 인플루언서 리스트 업로드 알림 발송 후 3일 이내(발송일 포함 3일째 자정까지) 확정 혹은 거절을 완료해야 합니다.
- 기한 엄수: 인플루언서와의 소통 지연은 업로드율에 직결되므로, 3일 경과 시 리스트는 자동 확정되어 이후 교환이 불가합니다.
- 교환 범위: 1차(발주 수량의 30% 이내), 2차(잔여 수량의 30% 이내)로 최대 2회까지 가능합니다.

4. 품질 및 회수율 보장 (AS)
- 품질 인식: 본 서비스는 KOC의 자발적 창작물이므로, 결과물이 가이드라인과 100% 일치하지 않을 수 있음을 사전 인지 바랍니다.
- 회수율 보장: 결제 후 3개월 내 회수율이 85% 미만일 경우, 가이드라인 완화를 조건으로 최초 발주 수량의 25%를 재모집하여 최종 회수율을 100%에 근접하도록 관리해 드립니다.

5. 고객 중심 소통 약속
브랜드슬램은 브랜드사가 직접 운영하는 것보다 압도적인 품질과 소통 관리를 제공하겠다는 강력한 의지를 가지고 있습니다. 모든 팀원이 캠페인을 실시간으로 모니터링하고 있으니, 궁금하신 점이나 개선 사항은 언제든 고객센터를 통해 적극적으로 소통해 주시기 바랍니다.`
  }
};

// --- 모달 컴포넌트 ---
const LegalModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        
        {/* 모달 내용 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed whitespace-pre-wrap h-full">
          {content}
        </div>

        {/* 모달 푸터 */}
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
  // 모달 상태 관리
  const [activeModal, setActiveModal] = useState(null);

  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeModal]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const footerSections = [
    {
      title: "Product",
      items: [
        { name: "캠페인", path: "/pricing" },
        { name: "고객 사례", path: "/customers" },
        { name: "프로세스 소개", path: "/features" }
      ]
    },
    {
      title: "Company",
      items: [
        { name: "회사 소개", path: "#" },
        { name: "인플루언서 매니지먼트 시스템", path: "#" },
        { name: "문의하기", path: "#" }
      ]
    },
    {
      title: "Legal",
      items: [
        // modalKey를 사용하여 구분
        { name: "이용약관", modalKey: "terms" },
        { name: "개인정보처리방침", modalKey: "privacy" },
        { name: "결제 및 환불 규정", modalKey: "refund" }
      ]
    }
  ];

  return (
    <>
      <footer className="bg-white pt-20 pb-10 border-t border-gray-100 text-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            
            {/* 왼쪽 브랜드 설명 영역 */}
            <div className="col-span-2 lg:col-span-2 space-y-4">
              <Link to="/" onClick={scrollToTop} className="inline-block">
                 {logoImg ? (
                   <img 
                     src={logoImg} 
                     alt="Brand Slam" 
                     className="h-24 w-auto object-contain" 
                   />
                 ) : (
                   <span className="font-bold text-xl tracking-tighter text-blue-900">BRAND SLAM</span>
                 )}
              </Link>

              <p className="text-gray-500 text-sm max-w-xs leading-relaxed mt-2">
                Brand Slam은 글로벌 뷰티 브랜드를 위한 <br className="hidden md:block" />
                <span className="font-bold text-gray-900">올인원 인플루언서 마케팅 자동화 솔루션</span> 입니다. 
              </p>
              <div className="flex gap-4 pt-4">
             </div>
            </div>
            
            {/* 오른쪽 링크 섹션 */}
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-gray-900 mb-6">{section.title}</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  {section.items.map((item, i) => (
                    <li key={i}>
                      {/* 모달 키가 있으면 버튼으로, 없으면 링크로 렌더링 */}
                      {item.modalKey ? (
                        <button
                          onClick={() => setActiveModal(item.modalKey)}
                          className="hover:text-indigo-600 cursor-pointer transition-colors text-left"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <Link 
                          to={item.path} 
                          onClick={scrollToTop}
                          className="hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {item.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* 하단 정보 영역 (사업자 정보) */}
          <div className="pt-8 border-t border-gray-100">
            <div className="flex flex-col gap-6">
              {/* 사업자 정보 텍스트 */}
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
              </div>

              {/* Copyright */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-gray-400 mt-2">
                <p>© 2026 Brand Slam Inc. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 법적 고지 모달 렌더링 */}
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