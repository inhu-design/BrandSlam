/**
 * SLAM LAB 플레이그라운드 — Google Gemini (서버만 키 사용)
 * POST /api/gemini-playground
 * Body: { mode: 'copy'|'hook'|'brief'|'tags', input: string }
 *
 * 환경 변수: GEMINI_API_KEY (필수), GEMINI_MODEL (선택, 기본 gemini-2.0-flash)
 * 참고: AI Studio 키는 gemini-1.5-flash(무접미사)가 v1beta에서 안 잡히는 경우가 많음 → 2.0 또는 -latest/-001 접미사 모델 사용.
 */
function buildPrompt(mode, input) {
  const topic = (input || '').trim() || '(주제를 구체적으로 적어 주세요. 예: 비건 선크림 미국 시딩)';
  switch (mode) {
    case 'copy':
      return `역할: 글로벌 뷰티·라이프스타일 브랜드 퍼포먼스 마케터.
작업: 아래 주제로 TikTok·Instagram **마이크로 시딩**용 한국어 카피 후보를 **정확히 3개**. 각 2문장 이내. 번호 목록(1. 2. 3.)만 출력.
주제:
${topic}`;
    case 'hook':
      return `역할: 숏폼 크리에이티브 디렉터.
작업: 아래 주제로 **15초 릴스/틱톡 오프닝 훅** 한국어 문장 **5개**. 질문형·POV·반전을 섞을 것. 번호 목록만.
주제:
${topic}`;
    case 'brief':
      return `역할: 캠페인 기획자.
작업: 아래 주제로 **간단 캠페인 브리프**를 마크다운으로 작성. 반드시 다음 소제목 포함: ## 목표, ## 타겟, ## 톤앤매너, ## 채널, ## KPI (조회수보다 업로드·회수 중심으로 제안).
주제:
${topic}`;
    case 'tags':
      return `역할: SNS 운영자.
작업: 아래 주제로 인스타·틱톡용 **해시태그 12~18개**를 **한 줄**에 공백으로만 구분해 출력. 불필요한 설명 금지.
주제:
${topic}`;
    default:
      return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY가 설정되지 않았습니다.',
      hint: 'Vercel 환경 변수 또는 로컬에서 `vercel dev` + .env에 GEMINI_API_KEY를 추가하세요. Google AI Studio에서 키를 발급할 수 있습니다.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const mode = String(body.mode || '').trim();
  const input = String(body.input || '');

  const allowed = ['copy', 'hook', 'brief', 'tags'];
  if (!allowed.includes(mode)) {
    return res.status(400).json({ error: `mode는 ${allowed.join(', ')} 중 하나여야 합니다.` });
  }

  const userPrompt = buildPrompt(mode, input);
  if (!userPrompt) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 2048,
        },
      }),
    });

    const data = await geminiRes.json().catch(() => ({}));

    if (!geminiRes.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 400);
      return res.status(502).json({
        error: 'Gemini API 오류',
        detail: msg,
        hint:
          'Vercel 환경 변수 GEMINI_MODEL을 바꿔 보세요. 예: gemini-2.0-flash, gemini-2.0-flash-001, gemini-1.5-flash-latest (AI Studio → 사용 가능 모델 목록과 동일한 ID)',
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';
    const finish = data?.candidates?.[0]?.finishReason;

    if (!text.trim()) {
      return res.status(502).json({
        error: '빈 응답',
        finishReason: finish || null,
        detail: data,
      });
    }

    return res.status(200).json({ text: text.trim(), model, mode });
  } catch (err) {
    console.error('[gemini-playground]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
