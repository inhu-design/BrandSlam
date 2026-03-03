import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, LogOut} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { supabase } from '../../lib/supabase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSectionClick = (e, path) => {
    if (path.startsWith('/#')) {
      e.preventDefault();
      const id = path.replace('/#', '');
      
      const scrollToElement = () => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 90; 
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      };

      if (location.pathname === '/') {
        scrollToElement();
      } else {
        navigate('/');
        setTimeout(scrollToElement, 150);
      }
      setIsOpen(false);
    } else {
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

  const FAQ_URL = 'https://spiral-playground-cff.notion.site/306259eb52488045a8b1f4ec3b64dfe9';

  const navLinks = [
    { name: '고객 사례', path: '/#cases'},
    { name: '프로세스', path: '/#process' },
    { name: '요금제', path: '/#pricing'},
    { name: 'FAQ', href: FAQ_URL }
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 bg-white/95 backdrop-blur-xl border-b ${
      scrolled ? 'py-4 border-slate-200 shadow-sm' : 'py-6 border-transparent'
    }`}> {/* [변경] py-3/5 -> py-4/6 (높이 약간 증가) */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center">
          
          {/* 1. Logo (Left) */}
          <Link to="/" onClick={(e) => handleSectionClick(e, '/')} className="flex items-center gap-3 cursor-pointer z-10 group">
            {logoImg ? (
              // [변경] h-10 -> h-12 (로고 이미지 크기 확대)
              <img src={logoImg} alt="slam-global" className="h-16 w-auto object-contain" />
            ) : (
              // [변경] text-2xl -> text-3xl (로고 텍스트 크기 확대)
              <span className="font-black text-3xl tracking-tighter text-slate-900 uppercase">Slam Global</span>
            )}
          </Link>

          {/* 2. Desktop Menu (Center) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center gap-10">
            {navLinks.map((link) => (
              link.href ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all cursor-pointer relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
                </a>
              ) : (
                <a 
                  key={link.name} 
                  href={link.path} 
                  onClick={(e) => handleSectionClick(e, link.path)}
                  className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all cursor-pointer relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
                </a>
              )
            ))}
          </div>

          {/* 3. CTA Buttons (Right) */}
          <div className="hidden md:flex items-center gap-6 z-10">
            {user ? (
              <div className="flex items-center gap-6">
                <Link 
                  to="/dashboard" 
                  // [변경] text-xs -> text-sm
                  className="text-sm font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  My Campaign
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  {/* [변경] 아이콘 크기 약간 확대 size={18} -> size={20} */}
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link 
                  to="/dashboard" 
                  // [변경] text-xs -> text-sm
                  className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  대시보드 미리보기
                </Link>
                <Link 
                  to="/login" 
                  // [변경] text-xs -> text-sm
                  className="text-sm font-black uppercase tracking-widest text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  로그인
                </Link>
              </div>
            )}
            
            <Link 
              to="/consulting" 
              // [변경] text-xs -> text-sm, px-8 -> px-9, py-3 -> py-3.5 (버튼 전체 크기 확대)
              className="bg-slate-900 text-white px-9 py-3.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all hover:scale-105 shadow-xl flex items-center gap-2"
            >
              바로 시작하기
              <ArrowRight size={16} /> {/* 아이콘 크기 미세 조정 */}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden z-10">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 p-2">
              {isOpen ? <X size={28} /> : <Menu size={28} />} {/* 모바일 햄버거 메뉴 아이콘 확대 */}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 p-8 flex flex-col gap-6 shadow-2xl animate-fade-in-down">
          {navLinks.map((link) => (
            link.href ? (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-black uppercase tracking-widest text-slate-900 py-2 border-b border-slate-50"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ) : (
              <a 
                key={link.name} 
                href={link.path} 
                className="text-xl font-black uppercase tracking-widest text-slate-900 py-2 border-b border-slate-50" 
                onClick={(e) => handleSectionClick(e, link.path)}
              >
                {link.name}
              </a>
            )
          ))}
          
          <div className="flex flex-col gap-4 mt-4">
            {user ? (
              <>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Signed in as: {user.email}
                </div>
                <Link 
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  // [변경] text-xs -> text-sm
                  className="w-full text-center py-4 text-sm font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 rounded-2xl"
                >
                  내 캠페인 현황
                </Link>
                <button 
                  onClick={handleLogout}
                  // [변경] text-xs -> text-sm
                  className="w-full text-center py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 rounded-2xl flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> 로그아웃
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  // [변경] text-xs -> text-sm
                  className="w-full text-center py-4 text-sm font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 rounded-2xl"
                >
                  대시보드 미리보기
                </Link>
                <Link 
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  // [변경] text-xs -> text-sm
                  className="w-full text-center py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-900 bg-slate-100 rounded-2xl"
                >
                  로그인
                </Link>
              </>
            )}
            
            <Link 
              to="/consulting"
              onClick={() => setIsOpen(false)}
              // [변경] text-xs -> text-sm
              className="w-full text-center py-5 text-sm font-black uppercase tracking-[0.2em] text-white bg-slate-900 rounded-2xl shadow-xl"
            >
              바로 시작하기
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;