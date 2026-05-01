-- ===== Notification helpers =====

-- DM → receiver
CREATE OR REPLACE FUNCTION public.notify_dm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.receiver_id, 'dm', '새 메시지', LEFT(NEW.content, 80), '/dm/' || NEW.sender_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_dm ON public.direct_messages;
CREATE TRIGGER trg_notify_dm AFTER INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.notify_dm();

-- Membership pending → owner; status change → applicant
CREATE OR REPLACE FUNCTION public.notify_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id_v varchar; group_name_v varchar;
BEGIN
  SELECT owner_id, name INTO owner_id_v, group_name_v FROM public.groups WHERE id = NEW.group_id;
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (owner_id_v, 'join_request', '새 가입 신청', '"' || group_name_v || '" 모임에 가입 신청이 들어왔어요', '/groups/' || NEW.group_id || '/requests');
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'membership_update',
      CASE WHEN NEW.status = 'approved' THEN '가입 승인' WHEN NEW.status = 'rejected' THEN '가입 거절' ELSE '신청 상태 변경' END,
      '"' || group_name_v || '" ' || NEW.status::text, '/groups/' || NEW.group_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_membership_ins ON public.memberships;
CREATE TRIGGER trg_notify_membership_ins AFTER INSERT ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.notify_membership();
DROP TRIGGER IF EXISTS trg_notify_membership_upd ON public.memberships;
CREATE TRIGGER trg_notify_membership_upd AFTER UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.notify_membership();

-- Announcement → all approved members
CREATE OR REPLACE FUNCTION public.notify_announcement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT m.user_id, 'announcement', '새 공지: ' || NEW.title, LEFT(NEW.content, 80), '/groups/' || NEW.group_id || '/announcements'
  FROM public.memberships m WHERE m.group_id = NEW.group_id AND m.status = 'approved' AND m.user_id <> NEW.author_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_announcement ON public.announcements;
CREATE TRIGGER trg_notify_announcement AFTER INSERT ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.notify_announcement();

-- Event → all approved members
CREATE OR REPLACE FUNCTION public.notify_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT m.user_id, 'event', '새 일정: ' || NEW.title, COALESCE(NEW.description, ''), '/groups/' || NEW.group_id || '/events'
  FROM public.memberships m WHERE m.group_id = NEW.group_id AND m.status = 'approved' AND m.user_id <> NEW.created_by;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_event ON public.events;
CREATE TRIGGER trg_notify_event AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_event();

-- Class enrollment → instructor
CREATE OR REPLACE FUNCTION public.notify_class_enrollment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inst_id varchar; class_title varchar;
BEGIN
  SELECT instructor_id, title INTO inst_id, class_title FROM public.classes WHERE id = NEW.class_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (inst_id, 'class_enroll', '새 수강 신청', '"' || class_title || '"에 수강 신청이 들어왔어요', '/classes/' || NEW.class_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_class_enroll ON public.class_enrollments;
CREATE TRIGGER trg_notify_class_enroll AFTER INSERT ON public.class_enrollments FOR EACH ROW EXECUTE FUNCTION public.notify_class_enrollment();

-- Referral signup → award 100 points to referrer + notify
CREATE OR REPLACE FUNCTION public.notify_referral()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.points (user_id, amount, type, description)
  VALUES (NEW.referrer_id, 100, 'earn', '친구 초대 보상');
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.referrer_id, 'referral', '추천 보상 100P 지급', '친구가 가입했어요', '/points');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_referral ON public.referrals;
CREATE TRIGGER trg_notify_referral AFTER INSERT ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.notify_referral();