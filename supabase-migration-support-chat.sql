-- 고객 ↔ 담당자 1:1 문의 채팅 (Supabase SQL Editor에서 실행)
--
-- support_chat_staff.user_id 는 이메일이 아니라 auth.users.id (UUID) 입니다.
-- 직원 시드는 파일 맨 아래 INSERT … SELECT 블록을 사용하세요 (또는 UUID를 알면 VALUES 로 1명씩).
-- ADMIN_EMAILS 와 맞추려면 같은 사람이 Supabase Auth 에도 존재해야 /admin/support 가 동작합니다.

-- 직원 목록 (클라이언트에서 SELECT 불가 — is_support_staff() 만 사용)
CREATE TABLE IF NOT EXISTS public.support_chat_staff (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

COMMENT ON TABLE public.support_chat_staff IS '1:1 문의 처리 직원. user_id 는 auth.users.id. 클라이언트 직접 조회 불가.';

REVOKE ALL ON TABLE public.support_chat_staff FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.is_support_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.support_chat_staff s WHERE s.user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_support_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_support_staff() TO authenticated;

CREATE TABLE IF NOT EXISTS public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_email TEXT,
  assigned_staff_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  CONSTRAINT support_conversations_one_per_customer UNIQUE (customer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_last_message
  ON public.support_conversations (last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 8000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_created
  ON public.support_messages (conversation_id, created_at);

-- 새 메시지 시 대화의 last_message_at 갱신
CREATE OR REPLACE FUNCTION public.support_touch_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_support_messages_touch_conv ON public.support_messages;
CREATE TRIGGER tr_support_messages_touch_conv
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.support_touch_conversation_on_message();

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.support_conversations TO authenticated;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;

-- 대화: 고객은 본인 행만, 직원은 전체
CREATE POLICY support_conversations_select_customer
  ON public.support_conversations FOR SELECT TO authenticated
  USING (customer_user_id = (SELECT auth.uid()));

CREATE POLICY support_conversations_select_staff
  ON public.support_conversations FOR SELECT TO authenticated
  USING (public.is_support_staff());

CREATE POLICY support_conversations_insert_customer
  ON public.support_conversations FOR INSERT TO authenticated
  WITH CHECK (customer_user_id = (SELECT auth.uid()));

CREATE POLICY support_conversations_update_staff
  ON public.support_conversations FOR UPDATE TO authenticated
  USING (public.is_support_staff())
  WITH CHECK (public.is_support_staff());

-- 메시지: 대화에 참여한 고객 또는 직원만 읽기/쓰기
CREATE POLICY support_messages_select
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id = conversation_id
        AND (c.customer_user_id = (SELECT auth.uid()) OR public.is_support_staff())
    )
  );

CREATE POLICY support_messages_insert
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.support_conversations c
      WHERE c.id = conversation_id
        AND (c.customer_user_id = (SELECT auth.uid()) OR public.is_support_staff())
    )
  );

-- Realtime: 이미 등록되어 있으면 이 줄은 에러가 날 수 있음 → Replication 설정에서 확인 후 생략
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- ---------------------------------------------------------------------------
-- 직원 등록: 이메일 → UUID (위 스크립트 전부 실행된 뒤에 같이 실행해도 됨)
-- Auth에 없는 이메일은 자동으로 빠집니다. 누락 여부는 아래 SELECT로 확인하세요.
-- ---------------------------------------------------------------------------
INSERT INTO public.support_chat_staff (user_id)
SELECT u.id
FROM auth.users AS u
WHERE lower(trim(u.email)) IN (
  'young520403@naver.com',
  'tjswo@slam-global.com',
  'sol@slam-global.com',
  'da0@slam-global.com'
)
ON CONFLICT (user_id) DO NOTHING;

-- 기대한 이메일이 전부 들어갔는지 확인 (0 rows 이면 해당 계정이 Auth에 없음)
-- SELECT lower(trim(email)) AS email FROM auth.users
-- WHERE lower(trim(email)) IN (
--   'young520403@naver.com','tjswo@slam-global.com','sol@slam-global.com','da0@slam-global.com'
-- );
