-- ===== 보안 헬퍼 함수 =====
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id::text
      AND group_id = _group_id
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_user_id uuid, _group_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id
      AND owner_id = _user_id::text
  );
$$;

-- ===== memberships: 오너가 자기 모임의 신청을 관리 =====
CREATE POLICY "Owners can view memberships of their groups"
ON public.memberships FOR SELECT
TO authenticated
USING (public.is_group_owner(auth.uid(), group_id));

CREATE POLICY "Owners can update memberships of their groups"
ON public.memberships FOR UPDATE
TO authenticated
USING (public.is_group_owner(auth.uid(), group_id))
WITH CHECK (public.is_group_owner(auth.uid(), group_id));

CREATE POLICY "Owners can delete memberships of their groups"
ON public.memberships FOR DELETE
TO authenticated
USING (public.is_group_owner(auth.uid(), group_id));

-- ===== group_messages RLS =====
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group messages"
ON public.group_messages FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send group messages"
ON public.group_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = sender_id
  AND public.is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Senders can delete their own messages"
ON public.group_messages FOR DELETE
TO authenticated
USING (auth.uid()::text = sender_id);

-- realtime
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- ===== events RLS =====
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
ON public.events FOR SELECT
USING (true);

CREATE POLICY "Members can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = created_by
  AND (
    public.is_group_owner(auth.uid(), group_id)
    OR public.is_group_member(auth.uid(), group_id)
  )
);

CREATE POLICY "Creators can update their events"
ON public.events FOR UPDATE
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Creators or owners can delete events"
ON public.events FOR DELETE
TO authenticated
USING (
  auth.uid()::text = created_by
  OR public.is_group_owner(auth.uid(), group_id)
);

-- ===== event_attendees RLS =====
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attendees"
ON public.event_attendees FOR SELECT
USING (true);

CREATE POLICY "Users can RSVP themselves"
ON public.event_attendees FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can cancel their own RSVP"
ON public.event_attendees FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);