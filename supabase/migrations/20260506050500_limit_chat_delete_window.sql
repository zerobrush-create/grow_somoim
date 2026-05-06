-- Limit sender message deletion to the first 5 minutes after sending.

DROP POLICY IF EXISTS "Senders can delete their own messages" ON public.group_messages;
CREATE POLICY "Senders can delete their own messages"
ON public.group_messages
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = sender_id
  AND created_at > now() - interval '5 minutes'
);

DROP POLICY IF EXISTS "Sender can delete own DMs" ON public.direct_messages;
CREATE POLICY "Sender can delete own DMs"
ON public.direct_messages
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = sender_id
  AND created_at > now() - interval '5 minutes'
);

DROP POLICY IF EXISTS "Senders can delete own class messages" ON public.class_messages;
CREATE POLICY "Senders can delete own class messages"
ON public.class_messages
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = sender_id
  AND created_at > now() - interval '5 minutes'
);
