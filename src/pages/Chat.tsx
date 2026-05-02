import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, MessageCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChatTab = "group" | "dm";

const Chat = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [chatTab, setChatTab] = useState<ChatTab>("group");

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-dm-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["dm-threads", user.id] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `sender_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["dm-threads", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const { data: groups, isLoading: gLoading } = useQuery({
    queryKey: ["chat-groups", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: mem } = await supabase
        .from("memberships").select("group_id").eq("user_id", user!.id).eq("status", "approved");
      const ids = (mem ?? []).map((m) => m.group_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("groups").select("id,name,image_url").in("id", ids);
      return data ?? [];
    },
  });

  const { data: blockedIds } = useQuery({
    queryKey: ["blocked-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user!.id);
      return new Set((data ?? []).map((b) => b.blocked_id as string));
    },
  });

  const { data: dmThreads, isLoading: dmLoading } = useQuery({
    queryKey: ["dm-threads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("id,content,sender_id,receiver_id,created_at,is_read")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(200);
      const threads = new Map<string, { peerId: string; lastMessage: string; time: string; unread: number }>();
      for (const m of data ?? []) {
        const peerId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
        const existing = threads.get(peerId);
        if (!existing) {
          threads.set(peerId, {
            peerId, lastMessage: m.content, time: m.created_at,
            unread: m.receiver_id === user!.id && !m.is_read ? 1 : 0,
          });
        } else if (m.receiver_id === user!.id && !m.is_read) {
          existing.unread += 1;
        }
      }
      const list = Array.from(threads.values());
      const peerIds = list.map((t) => t.peerId);
      if (peerIds.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url,email").in("id", peerIds);
      const profMap = new Map((profs ?? []).map((p) => [p.id as string, p]));
      return list.map((t) => ({ ...t, profile: profMap.get(t.peerId) }));
    },
  });

  if (!user) {
    return (
      <MobileShell>
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          로그인 후 채팅을 이용할 수 있어요
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-0 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">채팅</h1>
          <button className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="검색">
            <Search className="h-5 w-5" />
          </button>
        </div>
        <div className="flex">
          {([["group","소모임"],["dm","DM"]] as const).map(([id,label]) => (
            <button key={id} onClick={() => setChatTab(id)} className={cn(
              "flex-1 py-2.5 text-sm font-semibold border-b-2 transition-smooth",
              chatTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}>{label}</button>
          ))}
        </div>
      </header>

      {chatTab === "group" && (
        <div className="divide-y divide-border animate-fade-in">
          {gLoading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          ) : groups && groups.length > 0 ? (
            groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}/chat`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {g.image_url ? <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground truncate">탭하여 대화 시작</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              가입한 모임이 없어요
            </div>
          )}
        </div>
      )}

      {chatTab === "dm" && (
        <div className="divide-y divide-border animate-fade-in">
          {dmLoading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          ) : dmThreads && dmThreads.filter((t) => !blockedIds?.has(t.peerId)).length > 0 ? (
            dmThreads.filter((t) => !blockedIds?.has(t.peerId)).map((t) => (
              <Link key={t.peerId} to={`/dm/${t.peerId}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={t.profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{(t.profile?.name ?? t.profile?.email ?? "?").slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">{t.profile?.name ?? t.profile?.email ?? "사용자"}</p>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {new Date(t.time).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{t.lastMessage}</p>
                    {t.unread > 0 && (
                      <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              아직 대화가 없어요
            </div>
          )}
        </div>
      )}
    </MobileShell>
  );
};

export default Chat;
