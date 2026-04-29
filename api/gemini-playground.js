/**
 * SLAM Lab — Google Gemini
 * POST /api/gemini-playground
 * Body: { mode, messages: [{role, text}], lang?: 'ko'|'en', stream?: boolean }
 *
 * 환경 변수: GEMINI_API_KEY (필수), GEMINI_MODEL (선택, 기본 gemini-2.5-flash)
 */

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const DEPRECATED_GEMINI_20_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-exp',
]);

function resolveGeminiModel(raw) {
  const m = (raw || DEFAULT_GEMINI_MODEL).trim();
  const lower = m.toLowerCase();
  if (DEPRECATED_GEMINI_20_MODELS.has(lower) || lower.startsWith('gemini-2.0-flash')) {
    return DEFAULT_GEMINI_MODEL;
  }
  return m;
}

const ALL_MODES = new Set([
  'copy', 'hook', 'brief', 'tags', 'creator_guide', 'ugc_angles',
  'dm_outreach', 'tracking_kpi',
  'translate', 'product_desc', 'campaign_result', 'content_calendar', 'creator_faq',
]);

function buildSystemInstruction(mode, lang, brandCtx) {
  const langNote = lang === 'en'
    ? '\n\nAll output must be in English.'
    : '\n\n모든 출력은 한국어로 작성하세요.';

  const ctxNote = brandCtx
    ? `\n\n[캠페인 컨텍스트: ${brandCtx}] — 위 컨텍스트를 모든 생성물에 일관되게 반영하세요.`
    : '';

  const prompts = {
    copy: `역할: 글로벌 뷰티·라이프스타일 브랜드 퍼포먼스 마케터.
작업: 사용자가 제공하는 브랜드·제품 주제로 TikTok·Instagram 마이크로 시딩용 카피 후보를 정확히 3개 생성합니다. 각 2문장 이내, 번호 목록(1. 2. 3.)만 출력. 후속 요청(더 짧게, 톤 변경, 언어 변경 등)에 즉시 반영하세요.`,

    hook: `역할: 숏폼 크리에이티브 디렉터.
작업: 15초 릴스/틱톡 오프닝 훅 5개를 번호 목록으로 제안합니다. 질문형·POV·반전을 섞을 것. 후속 수정 즉시 반영.`,

    brief: `역할: 캠페인 기획자.
작업: 마크다운 형식의 간단 캠페인 브리프를 작성합니다. 반드시 다음 소제목 포함: ## 목표, ## 타겟, ## 톤앤매너, ## 채널, ## KPI. 후속 수정 즉시 반영.`,

    tags: `역할: SNS 운영자.
작업: 인스타·틱톡용 해시태그 12~18개를 한 줄에 공백으로만 구분해 출력합니다. 설명 없이 해시태그만. 후속 요청(더 추가, 특정 키워드 포함 등) 즉시 반영.`,

    creator_guide: `역할: 글로벌 마이크로·시딩 캠페인 매니저.
작업: 크리에이터에게 그대로 전달 가능한 시딩 제작 가이드를 마크다운으로 작성합니다. 반드시 포함: ## 촬영·편집 가이드, ## 필수 멘션·해시태그·링크, ## 금지·주의사항, ## 제출물. 후속 수정 즉시 반영.`,

    ugc_angles: `역할: UGC·시딩 크리에이티브 플래너.
작업: 틱톡·릴스용 촬영 각도·컨셉 6개를 번호 목록으로 제안합니다. 각 항목: 장면 요약 한 줄 + 시딩에 유리한 이유 한 줄. 후속 수정 즉시 반영.`,

    dm_outreach: `역할: 인플루언서 아웃리치 담당자.
작업: 마이크로 크리에이터에게 보낼 협찬·시딩 제안 DM 3버전을 번호 목록으로 작성합니다. 정중·간결 톤, 구체 금액 언급 금지, '조건 협의' 수준으로. 후속 수정 즉시 반영.`,

    tracking_kpi: `역할: 퍼포먼스 마케터 (시딩·UGC 전문).
작업: 캠페인 추적·리포팅 초안을 마크다운으로 작성합니다. 반드시 포함: ## 캠페인 요약, ## 주간 체크리스트, ## KPI 정의, ## 자동화 필드 제안. 후속 수정 즉시 반영.`,

    translate: `역할: 글로벌 마케팅 번역가.
작업: 입력된 마케팅 자료(브리프, 크리에이터 가이드, 카피 등)를 지정 언어로 번역합니다. 언어를 명시하지 않으면 영어로 번역합니다. 마케팅 맥락을 유지하고 현지 자연스러운 표현을 사용하세요. 후속 수정 즉시 반영.`,

    product_desc: `역할: 콘텐츠 마케터.
작업: 크리에이터가 포스팅에 바로 사용할 수 있는 제품 소개문을 작성합니다. 주요 성분·효과·사용감을 자연스러운 1인칭 리뷰 톤으로 구성합니다. 후속 수정 즉시 반영.`,

    campaign_result: `역할: 퍼포먼스 마케터.
작업: 사용자가 입력한 캠페인 수치(조회수, 저장, 클릭 등)를 분석하고 경영진 보고용 성과 요약문을 마크다운으로 작성합니다. 핵심 인사이트와 다음 캠페인 제언을 포함하세요.`,

    content_calendar: `역할: 캠페인 플래너.
작업: 캠페인 기간·크리에이터 수·채널을 기반으로 주차별 콘텐츠 업로드 캘린더를 마크다운 표 또는 목록으로 작성합니다. 포스팅 타이밍, 채널별 배분, 리마인드 포인트를 포함하세요.`,

    creator_faq: `역할: 브랜드 커뮤니케이션 담당자.
작업: 크리에이터가 협찬 진행 중 자주 묻는 질문에 대한 FAQ를 작성합니다. 성분·사용법·금지사항·반품 등 포함. 크리에이터에게 그대로 전달 가능한 수준으로 작성하세요.`,
  };

  return (prompts[mode] || prompts['copy']) + langNote + ctxNote;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(503).json({
      error: 'GEMINI_API_KEY가 설정되지 않았습니다.',
      hint: 'Vercel 환경 변수 또는 로컬 .env에 GEMINI_API_KEY를 추가하세요. Google AI Studio에서 키를 발급할 수 있습니다.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const mode = String(body.mode || '').trim();
  const lang = body.lang === 'en' ? 'en' : 'ko';
  const doStream = body.stream === true;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const brandCtx = String(body.brandContext || '').trim().slice(0, 300);

  if (!ALL_MODES.has(mode)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(400).json({ error: `지원하지 않는 mode: ${mode}` });
  }

  if (messages.length === 0) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(400).json({ error: 'messages가 비어 있습니다.' });
  }

  const systemInstruction = buildSystemInstruction(mode, lang, brandCtx);
  const model = resolveGeminiModel(process.env.GEMINI_MODEL);

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.text || '') }],
  }));

  const requestBody = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 2048,
    },
  };

  // ── Streaming ──────────────────────────────────────────────────────────────
  if (doStream) {
    const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');

    try {
      const geminiRes = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => ({}));
        const msg = errData?.error?.message || JSON.stringify(errData).slice(0, 400);
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
        return;
      }

      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const data = JSON.parse(raw);
            const text = (data?.candidates?.[0]?.content?.parts ?? [])
              .map((p) => p.text ?? '')
              .join('');
            if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
          } catch {
            // malformed chunk — skip
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      try {
        res.write(`data: ${JSON.stringify({ error: String(err?.message || err) })}\n\n`);
        res.end();
      } catch {
        // response already ended
      }
    }
    return;
  }

  // ── Non-streaming fallback ─────────────────────────────────────────────────
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await geminiRes.json().catch(() => ({}));

    if (!geminiRes.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 400);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(502).json({
        error: 'Gemini API 오류',
        detail: msg,
        hint: 'GEMINI_MODEL을 gemini-2.5-flash 로 맞추세요.',
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';

    if (!text.trim()) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(502).json({ error: '빈 응답', detail: data });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ text: text.trim(), model, mode });
  } catch (err) {
    console.error('[gemini-playground]', err);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
