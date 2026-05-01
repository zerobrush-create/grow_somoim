import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DM = { id: number; content: string; sender_id: string; receiver_id: string; created_at: string; is_read: boolean };

const DirectMessage = () => {
  const { peerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingTimerRef = useRef<number | null>(null);

  const { data: peer } = useQuery({
    queryKey: ["dm-peer", peerId],
    enabled: !!peerId,
    queryFn: async () => (await supabase.from("profiles").select("id,name,avatar_url,email").eq("id", peerId!).maybeSingle()).data,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["dm-thread", user?.id, peerId],
    enabled: !!user && !!peerId,
    queryFn: async (): Promise<DM[]> => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("id,content,sender_id,receiver_id,created_at,is_read")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user || !peerId) return;
    const channel = supabase
      .channel(`dm-${user.id}-${peerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new as DM;
        if ((m.sender_id === user.id && m.receiver_id === peerId) || (m.sender_id === peerId && m.receiver_id === user.id)) {
          qc.invalidateQueries({ queryKey: ["dm-thread", user.id, peerId] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, peerId, qc]);

  // Presence + typing for DM (channel name is sorted so both sides share it)
  useEffect(() => {
    if (!user || !peerId) return;
    const key = [user.id, peerId].sort().join(":");
    const ch = supabase.channel(`dm-presence-${key}`, {
      config: { presence: { key: user.id } },
    });
    typingChannelRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setPeerOnline(!!state[peerId]);
    });
    ch.on("broadcast", { event: "typing" }, (payload) => {
      const sId = (payload.payload as { userId: string }).userId;
      if (sId !== peerId) return;
      setPeerTyping(true);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => setPeerTyping(false), 3500);
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ online_at: new Date().toISOString() });
    });
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
    };
  }, [user, peerId]);

  const broadcastTyping = () => {
    const ch = typingChannelRef.current;
    if (!ch || !user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    ch.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user || !peerId || !messages || messages.length === 0) return;
    const unread = messages.filter((m) => m.receiver_id === user.id && !m.is_read).map((m) => m.id);
    if (unread.length === 0) return;
    supabase.from("direct_messages").update({ is_read: true }).in("id", unread).then(() => {
      qc.invalidateQueries({ queryKey: ["dm-threads", user.id] });
      qc.invalidateQueries({ queryKey: ["unread-notif", user.id] });
    });
  }, [messages, user, peerId, qc]);

  const send = useMutation({
    mutationFn: async () => {
      if (!user || !peerId) throw new Error("로그인이 필요합니다");
      const content = text.trim(); if (!content) return;
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id, receiver_id: peerId, content,
      });
      if (error) throw error;
      setText("");
    },
    onError: (e: Error) => toast({ title: "전송 실패", description: e.message, variant: "destructive" }),
  });

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col flex-1">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar className="h-9 w-9"><AvatarImage src={peer?.avatar_url ?? undefined} /><AvatarFallback>{(peer?.name ?? peer?.email ?? "?").slice(0,1)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{peer?.name ?? peer?.email ?? "사용자"}</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full inline-block", peerOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
              {peerOnline ? "온라인" : "오프라인"}
            </p>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <><Skeleton className="h-12 w-2/3" /><Skeleton className="h-12 w-1/2 ml-auto" /></>
          ) : messages && messages.length > 0 ? (
            messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
                    <div className={cn("rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words", mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                      {m.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">대화를 시작해보세요</div>
          )}
          {peerTyping && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic px-1">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.3s]" />
              </span>
              입력 중...
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-2 safe-bottom">
          <Input value={text} onChange={(e) => { setText(e.target.value); broadcastTyping(); }} placeholder="메시지 입력..." maxLength={1000} />
          <Button type="submit" size="icon" disabled={send.isPending || !text.trim()} aria-label="전송">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DirectMessage;
