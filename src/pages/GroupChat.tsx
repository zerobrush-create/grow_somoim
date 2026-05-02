import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Video, Paperclip } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
};

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);

  const { data: group } = useQuery({
    queryKey: ["group-chat-meta", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id,name").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["group-messages", id],
    enabled: !!id && !!user,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("group_messages")
        .select("id,content,sender_id,created_at")
        .eq("group_id", id!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 보낸 사람 프로필 조회
  const senderIds = Array.from(new Set((messages ?? []).map((m) => m.sender_id)));
  const { data: senders } = useQuery({
    queryKey: ["chat-senders", id, senderIds.join(",")],
    enabled: senderIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,email")
        .in("id", senderIds);
      return new Map((data ?? []).map((p) => [p.id as string, p]));
    },
  });

  // realtime 구독
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`group-messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["group-messages", id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // presence + typing channel
  useEffect(() => {
    if (!id || !user) return;
    const ch = supabase.channel(`group-presence-${id}`, {
      config: { presence: { key: user.id } },
    });
    typingChannelRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setOnlineCount(Object.keys(state).length);
    });
    ch.on("broadcast", { event: "typing" }, (payload) => {
      const senderId = (payload.payload as { userId: string }).userId;
      if (senderId === user.id) return;
      setTypingUsers((prev) => ({ ...prev, [senderId]: Date.now() }));
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ online_at: new Date().toISOString() });
      }
    });
    const cleanup = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) if (now - v < 4000) next[k] = v;
        return next;
      });
    }, 1500);
    return () => {
      clearInterval(cleanup);
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
    };
  }, [id, user]);

  const broadcastTyping = () => {
    const ch = typingChannelRef.current;
    if (!ch || !user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    ch.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  };

  // 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !id) throw new Error("로그인이 필요합니다");
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `group/${id}/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-files").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("chat-files").getPublicUrl(path);
      const { error } = await supabase.from("group_messages").insert({ group_id: id, sender_id: user.id, content: `[img:${publicUrl}]` });
      if (error) throw error;
    },
    onError: (e: Error) => toast({ title: "파일 전송 실패", description: e.message, variant: "destructive" }),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("로그인이 필요합니다");
      const content = text.trim();
      if (!content) return;
      const { error } = await supabase.from("group_messages").insert({
        group_id: id,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
      setText("");
    },
    onError: (e: Error) => toast({ title: "전송 실패", description: e.message, variant: "destructive" }),
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col flex-1">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{group?.name ?? "모임 채팅"}</h1>
            {onlineCount > 0 && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                접속 {onlineCount}명
              </p>
            )}
          </div>
          <a
            href={`https://meet.jit.si/grow-${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="화상통화 시작"
            title="화상통화 시작 (Jitsi Meet)"
          >
            <Video className="h-5 w-5" />
          </a>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-1/2 ml-auto" />
            </>
          ) : messages && messages.length > 0 ? (
            messages.map((m) => {
              const mine = m.sender_id === user.id;
              const s = senders?.get(m.sender_id);
              return (
                <div key={m.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                  {!mine && (
                    <Avatar className="h-8 w-8 mt-auto">
                      <AvatarImage src={s?.avatar_url ?? undefined} />
                      <AvatarFallback>{(s?.name ?? s?.email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
                    {!mine && <span className="text-xs text-muted-foreground mb-0.5">{s?.name ?? s?.email ?? "?"}</span>}
                    {m.content.startsWith("[img:") ? (
                      <img src={m.content.slice(5, -1)} alt="첨부 이미지" className="max-w-[220px] rounded-2xl object-cover" loading="lazy" />
                    ) : (
                      <div className={cn("rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words", mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                        {m.content}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">첫 메시지를 보내보세요</div>
          )}
          {Object.keys(typingUsers).length > 0 && (
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

        <form
          onSubmit={(e) => { e.preventDefault(); send.mutate(); }}
          className="border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-2 safe-bottom"
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile.mutate(f); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadFile.isPending} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground" aria-label="이미지 첨부">
            <Paperclip className="h-4 w-4" />
          </button>
          <Input
            value={text}
            onChange={(e) => { setText(e.target.value); broadcastTyping(); }}
            placeholder="메시지 입력..."
            maxLength={1000}
          />
          <Button type="submit" size="icon" disabled={send.isPending || !text.trim()} aria-label="전송">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;