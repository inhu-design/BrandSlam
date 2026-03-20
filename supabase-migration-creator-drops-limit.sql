-- BS-US-FARMSKIN(admin_preview) 드랍: 사용자당 최대 15명(50명의 30%) DB 강제
-- Supabase SQL Editor에서 실행하세요.

CREATE OR REPLACE FUNCTION public.creator_drops_enforce_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count int;
  max_allowed int;
BEGIN
  IF NEW.reference_type = 'admin_preview' AND NEW.reference_id = 'BS-US-FARMSKIN' THEN
    max_allowed := 15;
  ELSE
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::int INTO existing_count
  FROM public.creator_drops
  WHERE reference_type = NEW.reference_type
    AND reference_id = NEW.reference_id
    AND dropped_by_user_id = NEW.dropped_by_user_id;

  IF existing_count >= max_allowed THEN
    RAISE EXCEPTION 'creator_drops_limit: BS-US-FARMSKIN 드랍은 최대 %명까지 가능합니다.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_creator_drops_limit ON public.creator_drops;
CREATE TRIGGER tr_creator_drops_limit
  BEFORE INSERT ON public.creator_drops
  FOR EACH ROW
  EXECUTE PROCEDURE public.creator_drops_enforce_limit();
