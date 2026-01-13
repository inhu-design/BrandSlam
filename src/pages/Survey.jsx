import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, User, Mail, Phone, Link as LinkIcon, Loader2, FileText, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Survey() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // 1. 기본 정보
    brandName: '',
    brandWebsite: '', 
    managerInfo: '',
    email: '',
    phone: '',
    
    // 2. 시장 및 경험
    countries: [],
    hasAgencyExperience: null,
    agencyDissatisfaction: [],
    agencyStress: '',
    contractDuration: '',
    
    // 3. 캠페인 목표
    campaignGoals: [],
    mainKPI: '',
    platforms: [],
    
    // 4. 크리에이터 선호도
    creatorSize: '',
    creatorStyles: [],
    creatorDislikes: [],
    
    // 5. 예산 및 일정
    budget: '',
    operationMode: '',
    duration: '',
    
    // 6. 상세 분석
    brandIssues: [], 
    brandStrengths: '',
    badContentLinks: '',
    goodContentLinks: '',
    needUrgentQuote: false,
    additionalComments: ''
  });

  // [보안] 페이지 진입 시 로그인 체크 (수정됨)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // 로그인 안 되어 있으면, 경고창 없이 바로 로그인 페이지로 보냄
      if (!user) {
        navigate('/login', { replace: true }); 
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (key, value, isMulti = false) => {
    if (isMulti) {
      const current = formData[key];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      setFormData(prev => ({ ...prev, [key]: updated }));
    } else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleNext = () => {
    if (step < 6) {
        setStep(step + 1);
    } else if (step === 6) {
        handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 7) setStep(step - 1);
    else if (step === 1) navigate(-1);
  };

  const isStepValid = () => {
    switch(step) {
      case 1: 
        return formData.brandName && formData.managerInfo && formData.email && formData.phone;
      case 2: return formData.countries.length > 0 && formData.hasAgencyExperience !== null;
      case 3: return formData.campaignGoals.length > 0 && formData.mainKPI && formData.platforms.length > 0;
      case 4: return formData.creatorSize && formData.creatorStyles.length > 0;
      case 5: return formData.budget && formData.operationMode;
      case 6: return true;
      case 7: return true; 
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const payload = {
        brand_name_raw: formData.brandName,
        brand_website_raw: formData.brandWebsite,
        brand_strengths: formData.brandStrengths,
        brand_issues: formData.brandIssues, 

        applicant_name: formData.managerInfo,
        applicant_email: formData.email,
        applicant_phone: formData.phone,
        manager_info: formData.managerInfo, 

        target_countries: formData.countries,
        has_agency_experience: formData.hasAgencyExperience,
        agency_dissatisfaction: formData.agencyDissatisfaction,
        prev_contract_duration: formData.contractDuration,
        agency_stress: formData.agencyStress,

        campaign_goals: formData.campaignGoals,
        kpi_priority: formData.mainKPI,
        platforms: formData.platforms,

        creator_size: formData.creatorSize, 
        creator_style: formData.creatorStyles,
        creator_dislikes: formData.creatorDislikes,

        budget_range: formData.budget,
        operation_mode: formData.operationMode,
        expected_duration: formData.duration,

        ref_links_bad: formData.badContentLinks,
        ref_links_good: formData.goodContentLinks,
        additional_comments: formData.additionalComments,
        memo: null, 

        is_urgent: formData.needUrgentQuote,
        status: 'PENDING'
      };

      const { error } = await supabase
        .from('inquiries')
        .insert([payload]);

      if (error) throw error;

      setStep(7);

    } catch (error) {
      console.error('제출 에러:', error);
      alert('제출 중 문제가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {step < 7 && (
          <div className="w-full h-2 bg-gray-200 fixed top-0 left-0 z-50">
            <div 
              className="h-full bg-black transition-all duration-500 ease-out"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
      )}

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-20 animate-fade-in-up">
        
        {step < 7 && (
            <div className="mb-10 flex items-center justify-between">
                <button onClick={handleBack} className="text-gray-500 hover:text-black flex items-center gap-2 transition-colors font-medium">
                    <ChevronLeft size={20} />
                    {step === 1 ? '메인으로' : '이전 단계'}
                </button>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Step {step} / 6</span>
            </div>
        )}

        {/* --- STEP 1: 기본 정보 --- */}
        {step === 1 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-extrabold leading-tight">
              반갑습니다. <br/>
              <span className="text-blue-600">브랜드 정보</span>를 입력해 주세요.
            </h2>
            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">브랜드명</label>
                    <input name="brandName" value={formData.brandName} onChange={handleChange} placeholder="예: Brand Slam" className="w-full p-4 rounded-xl border border-gray-200 focus:border-black outline-none transition-all" />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">웹사이트 주소 (URL)</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-4 top-4 text-gray-400" size={20}/>
                        <input name="brandWebsite" value={formData.brandWebsite} onChange={handleChange} placeholder="https://brand-slam.com" className="w-full p-4 pl-12 rounded-xl border border-gray-200 focus:border-black outline-none transition-all" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">담당자 성함 / 직책</label>
                    <div className="relative">
                        <User className="absolute left-4 top-4 text-gray-400" size={20}/>
                        <input name="managerInfo" value={formData.managerInfo} onChange={handleChange} placeholder="예: 김인후 / 마케팅 팀장" className="w-full p-4 pl-12 rounded-xl border border-gray-200 focus:border-black outline-none transition-all" />
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-4 text-gray-400" size={20}/>
                            <input name="email" value={formData.email} onChange={handleChange} placeholder="example@company.com" className="w-full p-4 pl-12 rounded-xl border border-gray-200 focus:border-black outline-none transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">연락처</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-4 text-gray-400" size={20}/>
                            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" className="w-full p-4 pl-12 rounded-xl border border-gray-200 focus:border-black outline-none transition-all" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* --- STEP 2 ~ 6 내용 --- */}
        {step === 2 && ( <Step2Content formData={formData} setFormData={setFormData} handleSelect={handleSelect} /> )}
        {step === 3 && ( <Step3Content formData={formData} handleChange={handleChange} handleSelect={handleSelect} /> )}
        {step === 4 && ( <Step4Content formData={formData} handleSelect={handleSelect} /> )}
        {step === 5 && ( <Step5Content formData={formData} handleChange={handleChange} setFormData={setFormData} /> )}
        {step === 6 && ( <Step6Content formData={formData} handleChange={handleChange} handleSelect={handleSelect} setFormData={setFormData} /> )}

        {/* --- STEP 7: 완료 및 선택 페이지 --- */}
        {step === 7 && (
            <div className="text-center space-y-8 py-10">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <FileText size={40} />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold mb-4">진단서 제출이 완료되었습니다!</h2>
                    <p className="text-gray-500 text-lg">
                        담당자가 내용을 확인 후 빠르게 연락드리겠습니다.<br/>
                        다음 단계로 무엇을 하시겠습니까?
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-black bg-white hover:bg-gray-50 transition-all text-left space-y-4 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                            <FileText size={24}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">내 견적 및 진행상황 확인</h3>
                            <p className="text-sm text-gray-500">대시보드로 이동하여 제출된 내용을 확인합니다.</p>
                        </div>
                        <div className="flex items-center text-sm font-bold text-blue-600 group-hover:text-black">
                            대시보드로 이동 <ArrowRight size={16} className="ml-2"/>
                        </div>
                    </button>

                    <button 
                        onClick={() => alert("전문가 미팅 일정 조율을 위해 담당자가 곧 연락드릴 예정입니다.")}
                        className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-black bg-white hover:bg-gray-50 transition-all text-left space-y-4 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                            <Calendar size={24}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">전문가 미팅 신청</h3>
                            <p className="text-sm text-gray-500">상세한 논의를 위해 비대면 미팅을 예약합니다.</p>
                        </div>
                        <div className="flex items-center text-sm font-bold text-purple-600 group-hover:text-black">
                            미팅 신청하기 <ArrowRight size={16} className="ml-2"/>
                        </div>
                    </button>
                </div>
                
                <div className="mt-12">
                     <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black text-sm underline">
                        메인 페이지로 돌아가기
                     </button>
                </div>
            </div>
        )}

        {/* Footer Controller */}
        {step < 7 && (
            <div className="mt-12 flex justify-end">
                <button 
                    onClick={handleNext}
                    disabled={!isStepValid() || loading}
                    className="bg-black text-white px-12 py-5 rounded-full text-xl font-bold hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {loading ? (
                    <>
                        <Loader2 size={24} className="animate-spin" />
                        제출 중...
                    </>
                    ) : (
                    <>
                        {step === 6 ? '진단서 제출하기' : '다음으로'}
                        <ArrowRight size={20} />
                    </>
                    )}
                </button>
            </div>
        )}

      </div>
    </div>
  );
}

// (Step 2 ~ Step 6 컴포넌트는 기존 코드와 동일하게 유지하세요. 생략함)
const Step2Content = ({formData, setFormData, handleSelect}) => (
    <div className="space-y-10">
        <h2 className="text-3xl font-extrabold leading-tight">진출하고 싶은 <span className="text-blue-600">국가</span>와<br/><span className="text-blue-600">과거 경험</span>을 들려주세요.</h2>
        <div className="space-y-3">
            <label className="text-lg font-bold">운영(타겟) 국가 <span className="text-sm font-normal text-gray-500">(복수 선택)</span></label>
            <div className="flex flex-wrap gap-3">
                {['한국', '미국(US)', '일본(JP)', '동남아(SEA)', '중동(ME)', '기타'].map(c => (
                    <button key={c} onClick={() => handleSelect('countries', c, true)} className={`px-6 py-3 rounded-full border font-medium transition-all ${formData.countries.includes(c) ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-gray-400'}`}>{c}</button>
                ))}
            </div>
        </div>
        <div className="space-y-3">
            <label className="text-lg font-bold">마케팅 대행사 이용 경험</label>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setFormData({...formData, hasAgencyExperience: true})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.hasAgencyExperience === true ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white'}`}>네, 있습니다</button>
                <button onClick={() => setFormData({...formData, hasAgencyExperience: false})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.hasAgencyExperience === false ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white'}`}>아니요, 처음입니다</button>
            </div>
        </div>
        {formData.hasAgencyExperience && (
            <div className="bg-gray-100 p-6 rounded-2xl space-y-6 animate-fade-in-up">
                <div>
                    <label className="block text-sm font-bold mb-2">이전 대행사에서 아쉬웠던 점 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                        {['비용 대비 효율 낮음', '소통이 원활하지 않음', '크리에이터 퀄리티 낮음', '인사이트 부족', '일정 지연'].map(item => (
                            <button key={item} onClick={() => handleSelect('agencyDissatisfaction', item, true)} className={`px-4 py-2 rounded-lg text-sm border transition-all ${formData.agencyDissatisfaction.includes(item) ? 'bg-red-50 border-red-500 text-red-600 font-bold' : 'bg-white border-gray-200'}`}>{item}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">계약 기간은 어느 정도였나요?</label>
                    <input name="contractDuration" value={formData.contractDuration} onChange={(e) => setFormData({...formData, contractDuration: e.target.value})} placeholder="예: 6개월" className="w-full p-3 rounded-xl border border-gray-300" />
                </div>
            </div>
        )}
    </div>
);

const Step3Content = ({formData, handleChange, handleSelect}) => (
    <div className="space-y-10">
        <h2 className="text-3xl font-extrabold leading-tight">이번 캠페인을 통해<br/><span className="text-blue-600">달성하고 싶은 목표</span>는 무엇인가요?</h2>
        <div className="space-y-3">
            <label className="text-lg font-bold">핵심 목표 <span className="text-sm font-normal text-gray-500">(복수 선택)</span></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['신제품 출시 부스팅', '브랜드 인지도 확대', '구매 전환(Sales)', '제품 바이럴/리뷰 확보', 'SNS 팔로워 증대'].map(goal => (
                    <button key={goal} onClick={() => handleSelect('campaignGoals', goal, true)} className={`p-4 rounded-xl border text-left transition-all ${formData.campaignGoals.includes(goal) ? 'border-black bg-gray-50 font-bold' : 'border-gray-200 hover:bg-white'}`}>{goal}</button>
                ))}
            </div>
        </div>
        <div className="space-y-3">
            <label className="text-lg font-bold">가장 중요한 KPI (1순위)</label>
            <select name="mainKPI" value={formData.mainKPI} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-black">
                <option value="">선택해주세요</option>
                <option value="조회수(Views)">노출 수 / 조회수 (Views)</option>
                <option value="반응(Engagement)">좋아요 / 댓글 (Engagement)</option>
                <option value="전환(Conversion)">링크 클릭 / 구매 (Conversion)</option>
                <option value="콘텐츠수">업로드된 콘텐츠 수량</option>
            </select>
        </div>
        <div className="space-y-3">
            <label className="text-lg font-bold">선호 플랫폼</label>
            <div className="flex gap-4">
                {['TikTok', 'Instagram Reels', 'YouTube Shorts'].map(platform => (
                    <button key={platform} onClick={() => handleSelect('platforms', platform, true)} className={`flex-1 p-4 rounded-xl border transition-all ${formData.platforms.includes(platform) ? 'bg-black text-white font-bold' : 'bg-white border-gray-200'}`}>{platform}</button>
                ))}
            </div>
        </div>
    </div>
);

const Step4Content = ({formData, handleSelect}) => (
    <div className="space-y-8">
        <h2 className="text-3xl font-extrabold leading-tight">어떤 <span className="text-blue-600">크리에이터</span>와<br/>함께하고 싶으신가요?</h2>
        <div className="space-y-3">
            <label className="text-lg font-bold">원하는 규모</label>
            <div className="space-y-2">
                {[
                    {val: 'Nano', desc: '나노 (1k ~ 10k) - 가성비, 진정성'},
                    {val: 'Micro', desc: '마이크로 (10k ~ 50k) - 효율, 확산력'},
                    {val: 'Macro', desc: '매크로 (100k+) - 인지도, 파급력'},
                    {val: 'Mix', desc: '믹스 (예산에 맞춰 배분)'}
                ].map(opt => (
                    <button key={opt.val} onClick={() => handleSelect('creatorSize', opt.val)} className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${formData.creatorSize === opt.val ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                        <span className="font-bold">{opt.val}</span>
                        <span className="text-sm text-gray-500">{opt.desc}</span>
                    </button>
                ))}
            </div>
        </div>
        <div className="space-y-3">
            <label className="text-lg font-bold">선호 스타일 <span className="text-sm font-normal text-gray-500">(복수 선택)</span></label>
            <div className="flex flex-wrap gap-2">
                {['뷰티 전문', '코믹/바이럴', '정보성/리뷰', '비포&애프터 확실한', '감성적인'].map(style => (
                    <button key={style} onClick={() => handleSelect('creatorStyles', style, true)} className={`px-4 py-2 rounded-lg border transition-all ${formData.creatorStyles.includes(style) ? 'bg-black text-white' : 'bg-white border-gray-200'}`}># {style}</button>
                ))}
            </div>
        </div>
        <div className="space-y-3">
            <label className="text-lg font-bold">피하고 싶은 유형 <span className="text-sm font-normal text-gray-500">(복수 선택)</span></label>
            <div className="flex flex-wrap gap-2">
                {['광고 티가 너무 나는', '참여도(댓글) 낮은', '업로드 주기 불규칙한', '타겟 연령대가 안 맞는'].map(dislike => (
                    <button key={dislike} onClick={() => handleSelect('creatorDislikes', dislike, true)} className={`px-4 py-2 rounded-lg border transition-all ${formData.creatorDislikes.includes(dislike) ? 'bg-gray-200 border-gray-400 text-gray-600 line-through' : 'bg-white border-gray-200'}`}>{dislike}</button>
                ))}
            </div>
        </div>
    </div>
);

const Step5Content = ({formData, handleChange, setFormData}) => (
    <div className="space-y-8">
        <h2 className="text-3xl font-extrabold leading-tight">마지막으로 <span className="text-blue-600">예산과 일정</span>을<br/>조율해 볼게요.</h2>
        <div>
            <label className="block text-lg font-bold mb-3">월 예상 예산</label>
            <select name="budget" value={formData.budget} onChange={handleChange} className="w-full p-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-black text-lg">
                <option value="">선택해주세요</option>
                <option value="500under">500만원 이하 (Test)</option>
                <option value="1000">500 ~ 1,000만원</option>
                <option value="3000">1,000 ~ 3,000만원</option>
                <option value="5000">3,000 ~ 5,000만원</option>
                <option value="big">5,000만원 이상</option>
            </select>
        </div>
        <div>
            <label className="block text-lg font-bold mb-3">희망 운영 방식</label>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setFormData({...formData, operationMode: '턴키'})} className={`p-6 rounded-xl border text-center transition-all ${formData.operationMode === '턴키' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 bg-white'}`}>
                    <div className="font-bold text-lg mb-1">턴키 대행</div>
                    <div className="text-xs text-gray-500">기획부터 보고까지 전부 맡길래요</div>
                </button>
                <button onClick={() => setFormData({...formData, operationMode: '협업'})} className={`p-6 rounded-xl border text-center transition-all ${formData.operationMode === '협업' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 bg-white'}`}>
                    <div className="font-bold text-lg mb-1">부분 협업</div>
                    <div className="text-xs text-gray-500">인플루언서 섭외만 해주세요</div>
                </button>
            </div>
        </div>
        <div>
            <label className="block text-lg font-bold mb-3">예상 캠페인 기간</label>
            <div className="flex flex-wrap gap-2">
                {['단기 (1~2개월)', '중기 (3~6개월)', '장기 (6개월 이상)', '미정'].map(d => (
                    <button key={d} onClick={() => setFormData({...formData, duration: d})} className={`px-4 py-3 rounded-xl border transition-all ${formData.duration === d ? 'bg-black text-white' : 'bg-white border-gray-200'}`}>{d}</button>
                ))}
            </div>
        </div>
    </div>
);

const Step6Content = ({formData, handleChange, handleSelect, setFormData}) => (
    <div className="space-y-8">
        <h2 className="text-3xl font-extrabold leading-tight">더 정교한 제안을 위해<br/><span className="text-blue-600">브랜드 디테일</span>을 알려주세요.</h2>
        <div className="grid gap-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">현재 브랜드의 주요 과제 (복수 선택)</label>
                <div className="flex flex-wrap gap-2">
                    {['콘텐츠 퀄리티 부족', '신제품 초기 인지도 부족', '전환율(매출) 저조', '내부 인력 부족'].map(issue => (
                        <button key={issue} onClick={() => handleSelect('brandIssues', issue, true)} className={`px-3 py-2 rounded-lg border text-sm transition-all ${formData.brandIssues.includes(issue) ? 'bg-red-50 text-red-600 border-red-200 font-bold' : 'bg-white border-gray-200'}`}>{issue}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">브랜드 강점 (1~2가지)</label>
                <textarea name="brandStrengths" value={formData.brandStrengths} onChange={handleChange} placeholder="예: 비건 인증, 임상 실험 결과 보유 등" className="w-full p-4 rounded-xl border border-gray-200 h-24 resize-none outline-none focus:border-black" />
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="font-bold mb-4 flex items-center gap-2"><LinkIcon size={16}/> 참고용 콘텐츠 링크</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">별로였던 콘텐츠 (Link)</label>
                        <input name="badContentLinks" value={formData.badContentLinks} onChange={handleChange} placeholder="https://..." className="w-full p-3 rounded-lg border border-blue-200 bg-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">좋았던 콘텐츠 (Link)</label>
                        <input name="goodContentLinks" value={formData.goodContentLinks} onChange={handleChange} placeholder="https://..." className="w-full p-3 rounded-lg border border-blue-200 bg-white" />
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">마지막으로 걱정되는 점이나 요청사항</label>
                <textarea name="additionalComments" value={formData.additionalComments} onChange={handleChange} placeholder="자유롭게 적어주세요." className="w-full p-4 rounded-xl border border-gray-200 h-24 resize-none outline-none focus:border-black" />
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-xl cursor-pointer" onClick={() => setFormData(prev => ({...prev, needUrgentQuote: !prev.needUrgentQuote}))}>
                <div className={`w-6 h-6 rounded border flex items-center justify-center ${formData.needUrgentQuote ? 'bg-black border-black text-white' : 'bg-white border-gray-400'}`}>
                    {formData.needUrgentQuote && <CheckCircle2 size={16}/>}
                </div>
                <span className="text-sm font-bold">3일 이내 견적서/계약서 수령을 원합니다. (긴급)</span>
            </div>
        </div>
    </div>
);