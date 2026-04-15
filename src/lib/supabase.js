// src/lib/supabase.js — URL·anon 키는 저장소에 넣지 말고 Vite 환경변수로만 주입 (Vercel 프로젝트 설정 동일)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 비어 있습니다. .env.local 또는 Vercel 환경변수를 설정하세요.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid',
  { auth: { persistSession: true, autoRefreshToken: true } },
);