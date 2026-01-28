import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, LogOut } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { supabase } from '../../lib/supabase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // 현재 경로 확인용

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') setUser(session.user);
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // [수정] 섹션 이동 핸들러 (메인 페이지 내 스크롤 vs 타 페이지에서 이동)
  const handleSectionClick = (e, path) => {
    // 1. 해시 링크(/#id)인 경우 처리
    if (path.startsWith('/#')) {
      e.preventDefault();
      const id = path.replace('/#', '');
      
      const scrollToElement = () => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80; // 고정 헤더 높이만큼 보정
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      };

      if (location.pathname === '/') {
        // 이미 메인 페이지라면 바로 스크롤
        scrollToElement();
      } else {
        // 다른 페이지라면 메인으로 이동 후 스크롤
        navigate('/');
        setTimeout(scrollToElement, 100); // DOM 로드 대기
      }
      setIsOpen(false);
    } else {
      // 2. 일반 링크인 경우
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("로그아웃 하시겠습니까?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      setUser(null);
      alert("로그아웃 되었습니다.");
      navigate('/');
      setIsOpen(false);
    }
  };

  // [수정] 경로를 ID 앵커로 변경
  const navLinks = [
    
    { name: '고객 사례', path: '/#cases'}, // Success Stories Section ID
    { name: '프로세스 소개', path: '/#process' }, // (필요 시 /#process 등으로 변경 가능)
    { name: '캠페인', path: '/#pricing'} // Pricing Section ID
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 shadow-sm' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center">
          
          {/* 1. Logo (Left) */}
          <Link to="/" onClick={(e) => handleSectionClick(e, '/')} className="flex items-center gap-2 cursor-pointer z-10">
              {logoImg ? (
                <img src={logoImg} alt="Brand Slam" className="h-16 w-auto object-contain" />
              ) : (
                <span className="font-bold text-2xl tracking-tighter text-blue-900">BRAND SLAM</span>
              )}
          </Link>

          {/* 2. Desktop Menu (Center) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center gap-8">
            {navLinks.map((link) => (
              link.path.startsWith('/#') ? (
                // 해시 링크인 경우 button 혹은 a 태그 사용하되 onClick 핸들러 연결
                <a 
                  key={link.name} 
                  href={link.path} 
                  onClick={(e) => handleSectionClick(e, link.path)}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {link.name}
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={(e) => handleSectionClick(e, link.path)}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* 3. CTA Buttons (Right) */}
          <div className="hidden md:flex items-center gap-4 z-10">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mr-2"
                >
                  내 캠페인 현황
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mr-2"
                >
                  대시보드 미리보기
                </Link>
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  로그인
                </Link>
              </>
            )}
            
            <Link 
              to="/checkout" 
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all hover:scale-105 flex items-center gap-2"
            >
              바로 시작하기
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden z-10">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-900">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-lg">
          {navLinks.map((link) => (
             link.path.startsWith('/#') ? (
               <a 
                 key={link.name} 
                 href={link.path} 
                 className="text-sm font-medium text-gray-900 py-2" 
                 onClick={(e) => handleSectionClick(e, link.path)}
               >
                 {link.name}
               </a>
             ) : (
               <Link 
                key={link.name} 
                to={link.path} 
                className="text-sm font-medium text-gray-900 py-2" 
                onClick={(e) => handleSectionClick(e, link.path)}
               >
                 {link.name}
               </Link>
             )
          ))}
          <hr className="border-gray-100" />
          
          {user ? (
            <>
              <div className="text-center py-2 text-xs text-gray-400">
                {user.email}님 환영합니다
              </div>
              <Link 
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg"
              >
                내 캠페인 현황
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full text-center py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg"
              >
                대시보드 미리보기
              </Link>
              <Link 
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                로그인
              </Link>
            </>
          )}
          
          <Link 
            to="/checkout"
            onClick={() => setIsOpen(false)}
            className="w-full text-center py-3 text-sm font-bold text-white bg-black rounded-lg block"
          >
            바로 시작하기
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;