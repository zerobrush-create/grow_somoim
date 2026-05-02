import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Subscribes to the current user's notifications and displays an in-app toast
 * for each new one. Also invalidates relevant queries so badges/lists refresh.
 * Renders nothing.
 */
export const RealtimeNotifier = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const subscribed = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (subscribed.current === user.id) return;
    subscribed.current = user.id;

    const ch = supabase
      .channel(`rt-notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n: any = payload.new;
          toast({
            title: n.title ?? "새 알림",
            description: n.body ?? undefined,
          });
          qc.invalidateQueries({ queryKey: ["unread-notif", user.id] });
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      subscribed.current = null;
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  return null;
};