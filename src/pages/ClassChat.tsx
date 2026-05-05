import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Languages, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMessageTranslation } from "@/hooks/useMessageTranslation";
import { TranslatedMessageBubble } from "@/components/chat/TranslatedMessageBubble";

type Msg = { id: number; content: string; sender_id: string; created_at: string };

type SenderProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
};

const getSenderName = (sender?: SenderProfile) => sender?.name || sender?.email || "사용자";
const getSenderInitial = (sender?: SenderProfile) => getSenderName(sender).trim().slice(0, 1).toUpperCase();

const ClassChat = () => {
  const { id } = useParams();
  const idNum = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { translated, loading: translating, autoTranslate, setAutoTranslate, translate, autoTranslateMessages } = useMessageTranslation();

  const { data: cls } = useQuery({
    queryKey: ["class-meta", idNum],
    enabled: !!idNum,
    queryFn: async () => (await supabase.from("classes").select("id,title").eq("id", idNum).maybeSingle()).data,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["class-messages", idNum],
    enabled: !!idNum && !!user,
    queryFn: async (): Promise<Msg[]> => {
      const { data, error } = await supabase.from("class_messages")
        .select("id,content,sender_id,created_at").eq("class_id", idNum)
        .order("created_at", { ascending: true }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const senderIds = Array.from(new Set((messages ?? []).map((m) => m.sender_id)));
  const { data: senders } = useQuery({
    queryKey: ["class-chat-senders", idNum, senderIds.join(",")],
    enabled: senderIds.length > 0,
    queryFn: async () => {
      const [{ data: profiles }, { data: appUsers }] = await Promise.all([
        supabase.from("profiles").select("id,name,nickname,avatar_url,email").in("id", senderIds),
        supabase.from("users").select("id,nickname,email,first_name,last_name,profile_image_url").in("id", senderIds),
      ]);
      const map = new Map<string, SenderProfile>();
      (appUsers ?? []).forEach((u) => {
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
        map.set(u.id, {
          id: u.id,
          name: u.nickname || fullName || null,
          avatar_url: u.profile_image_url,
          email: u.email,
        });
      });
      (profiles ?? []).forEach((p) => {
        map.set(p.id, {
          id: p.id,
          name: p.name || p.nickname || null,
          avatar_url: p.avatar_url,
          email: p.email,
        });
      });
      return map;
    },
  });

  useEffect(() => {
    if (!idNum) return;
    const channel = supabase.channel(`class-messages-${idNum}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "class_messages", filter: `class_id=eq.${idNum}` },
        () => qc.invalidateQueries({ queryKey: ["class-messages", idNum] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [idNum, qc]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      const content = text.trim(); if (!content) return;
      const { error } = await supabase.from("class_messages").insert({ class_id: idNum, sender_id: user.id, content });
      if (error) throw error;
      setText("");
    },
    onError: (e: Error) => toast({ title: "전송 실패", description: e.message, variant: "destructive" }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      const { error } = await supabase.from("class_messages").delete().eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-messages", idNum] }),
    onError: (e: Error) => toast({ title: "삭제 실패", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!autoTranslate || !messages || !user) return;
    autoTranslateMessages(messages.map((m) => ({ id: m.id, content: m.content, isIncoming: m.sender_id !== user.id })));
  }, [autoTranslate, autoTranslateMessages, messages, user]);

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col flex-1">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">{cls?.title ?? "클래스 채팅"}</h1>
          <button
            onClick={() => setAutoTranslate(!autoTranslate)}
            className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-smooth relative", autoTranslate ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
            aria-label="자동번역 토글"
          >
            <Languages className="h-4 w-4" />
            {autoTranslate && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />}
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (<><Skeleton className="h-12 w-2/3" /><Skeleton className="h-12 w-1/2 ml-auto" /></>) :
            messages && messages.length > 0 ? messages.map((m) => {
              const mine = m.sender_id === user.id;
              const s = senders?.get(m.sender_id);
              const translatedText = translated[m.id];
              const isTranslating = translating.has(m.id);
              return (
                <div key={m.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                  {!mine && <Avatar className="h-8 w-8 mt-auto"><AvatarImage src={s?.avatar_url ?? undefined} /><AvatarFallback>{getSenderInitial(s)}</AvatarFallback></Avatar>}
                  <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
                    {!mine && <span className="text-xs text-muted-foreground mb-0.5">{getSenderName(s)}</span>}
                    <TranslatedMessageBubble
                      mine={mine}
                      content={m.content}
                      translatedText={translatedText}
                      isTranslating={isTranslating}
                      onTranslate={() => translate(m.id, m.content)}
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5">{new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => { if (window.confirm("이 메시지를 삭제할까요?")) deleteMessage.mutate(m.id); }}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive"
                        disabled={deleteMessage.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : <div className="text-center py-16 text-sm text-muted-foreground">첫 메시지를 보내보세요</div>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-2 safe-bottom">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력..." maxLength={1000} />
          <Button type="submit" size="icon" disabled={send.isPending || !text.trim()} aria-label="전송"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
};

export default ClassChat;
