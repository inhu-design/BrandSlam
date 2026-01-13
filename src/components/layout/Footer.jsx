import React from 'react';
import { Link } from 'react-router-dom'; // 페이지 이동을 위해 Link 컴포넌트 사용
import { Globe, Users } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const Footer = () => {
  // 클릭 시 페이지 최상단으로 이동하는 헬퍼 함수
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' }); // 페이지 이동 시에는 즉시 이동이 자연스러움
  };

  // [Modification] 링크 데이터 구조화 (이름 + 경로)
  const footerSections = [
    {
      title: "Product",
      items: [
        // Navbar와 동일한 경로
        { name: "캠페인", path: "/pricing" },
        { name: "고객 사례", path: "/customers" },
        { name: "프로세스 소개", path: "/features" }
      ]
    },
    {
      title: "Company",
      items: [
        { name: "회사 소개", path: "#" },       // 아직 페이지가 없다면 '#' 처리
        { name: "디스코드 채널", path: "#" },
        { name: "문의하기", path: "#" }
      ]
    },
    {
      title: "Legal",
      items: [
        { name: "이용약관", path: "#" },
        { name: "개인정보처리방침", path: "#" },
        { name: "보안 정책", path: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2 space-y-4">
            
            {/* 로고 영역 */}
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
              Brand Slam은 글로벌 뷰티 브랜드를 위한 올인원 인플루언서 마케팅 자동화 솔루션입니다. 
            </p>
            <div className="flex gap-4 pt-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><Globe size={16}/></div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><Users size={16}/></div>
            </div>
          </div>
          
          {/* Footer Links Section (수정됨) */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-gray-900 mb-6">{section.title}</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                {section.items.map((item, i) => (
                  <li key={i}>
                    {/* [Modification] Link 컴포넌트로 감싸서 페이지 이동 구현 */}
                    <Link 
                      to={item.path} 
                      onClick={scrollToTop}
                      className="hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© 2025 Brand Slam Inc. All rights reserved.</p>
          <div className="flex gap-8 flex-wrap justify-center">
            <span>서울시 용산구 한강대로 366, 트윈시티 8층</span>
            <span>contact@brandslam.io</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;