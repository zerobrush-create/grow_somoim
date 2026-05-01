import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">알림</h1>
        </header>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : items && items.length ? items.map((n) => (
            <button
              key={n.id}
              onClick={() => { if (!n.is_read) markRead.mutate(n.id); if (n.link) navigate(n.link); }}
              className={`w-full text-left flex items-start gap-3 p-4 hover:bg-muted/50 transition-smooth ${n.is_read ? "opacity-70" : "bg-primary-soft/40"}`}
            >
              <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center flex-shrink-0">
                {n.is_read ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </button>
          )) : (
            <p className="text-center text-sm text-muted-foreground py-16">알림이 없어요</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;