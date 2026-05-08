import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Video, Paperclip, Languages, Trash2, Reply, Users, Share2, Smile } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMessageTranslation } from "@/hooks/useMessageTranslation";
import { TranslatedMessageBubble } from "@/components/chat/TranslatedMessageBubble";
import { ReplyPreview } from "@/components/chat/ReplyPreview";
import { canDeleteMessage, encodeReplyMessageContent, getMessagePreview, parseChatMessageContent, type ReplyTarget } from "@/lib/chatMessage";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { fallbackUserName, firstText, fullName } from "@/lib/userIdentity";
import { shareOrCopyLink } from "@/lib/shareLink";

type Message = {
  id: number;
  content: string;
  sender_id: string;
  created_at: string;
};

type SenderProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
};

const getSenderName = (sender?: SenderProfile) => sender?.name || sender?.email || fallbackUserName(sender?.id);
const getSenderInitial = (sender?: SenderProfile) => getSenderName(sender).trim().slice(0, 1).toUpperCase();
const EMOJIS = ["😀", "😄", "😊", "😍", "🥰", "😂", "👍", "👏", "🙏", "💚", "🔥", "✨", "🎉", "🙌", "🤝", "😭", "😎", "🤔", "😮", "💪", "🌱", "📚", "🏃", "🎬"];

const GroupChat = ({ embedded = false, groupId }: { embedded?: boolean; groupId?: string } = {}) => {
  const params = useParams();
  const id = groupId ?? params.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { translated, errors: translationErrors, loading: translating, autoTranslate, setAutoTranslate, translate, autoTranslateMessages } = useMessageTranslation();
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: group } = useQuery({
    queryKey: ["group-chat-meta", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id,name,owner_id").eq("id", id!).maybeSingle();
      return data;
    },
  });
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(id);

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
      const [{ data: profiles }, { data: appUsers }] = await Promise.all([
        supabase
        .from("profiles")
          .select("id,name,nickname,avatar_url,email")
          .in("id", senderIds),
        supabase
        .from("users")
          .select("id,nickname,email,first_name,last_name,profile_image_url")
          .in("id", senderIds),
      ]);
      const map = new Map<string, SenderProfile>();
      (appUsers ?? []).forEach((u) => {
        const appFullName = fullName(u.first_name, u.last_name);
        map.set(u.id, {
          id: u.id,
          name: firstText(u.nickname, appFullName, u.email, fallbackUserName(u.id)),
          avatar_url: u.profile_image_url ?? null,
          email: u.email ?? null,
        });
      });
      (profiles ?? []).forEach((p) => {
        const existing = map.get(p.id);
        map.set(p.id, {
          id: p.id,
          name: firstText(p.nickname, existing?.name, p.name, p.email, existing?.email, fallbackUserName(p.id)),
          avatar_url: p.avatar_url ?? existing?.avatar_url ?? null,
          email: p.email ?? existing?.email ?? null,
        });
      });
      return map;
    },
  });

  // realtime 구독
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`group-messages-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_messages", filter: `group_id=eq.${id}` },
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

  const focusInput = () => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectReplyTarget = (target: ReplyTarget) => {
    setReplyTarget(target);
    focusInput();
  };

  const appendEmoji = (emoji: string) => {
    setText((value) => `${value}${emoji}`);
    broadcastTyping();
    focusInput();
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
      const content = encodeReplyMessageContent(`[img:${publicUrl}]`, replyTarget);
      const { error } = await supabase.from("group_messages").insert({ group_id: id, sender_id: user.id, content });
      if (error) throw error;
      setReplyTarget(null);
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
        content: encodeReplyMessageContent(content, replyTarget),
      });
      if (error) throw error;
      setText("");
      setReplyTarget(null);
    },
    onError: (e: Error) => toast({ title: "전송 실패", description: e.message, variant: "destructive" }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      const target = messages?.find((m) => m.id === messageId);
      if (target && !canDeleteMessage(target.created_at)) throw new Error("보낸 지 5분이 지난 메시지는 삭제할 수 없어요");
      const { error } = await supabase.from("group_messages").delete().eq("id", messageId).gt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-messages", id] }),
    onError: (e: Error) => toast({ title: "삭제 실패", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!autoTranslate || !messages || !user) return;
    autoTranslateMessages(messages.map((m) => ({ id: m.id, content: parseChatMessageContent(m.content).body, isIncoming: m.sender_id !== user.id })));
  }, [autoTranslate, autoTranslateMessages, messages, user]);

  const shareInvite = async () => {
    const url = `${window.location.origin}/groups/${id}`;
    const result = await shareOrCopyLink({
      title: group?.name,
      text: "모임 링크를 공유해서 멤버를 초대해 보세요",
      url,
    });

    if (result.ok) {
      toast({ title: "초대 링크를 복사했어요" });
    } else if (result.action !== "cancelled") {
      toast({ title: "초대 링크를 복사하지 못했어요", description: url, variant: "destructive" });
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className={cn("bg-background flex flex-col", embedded ? "h-[70vh] min-h-[520px] rounded-2xl border border-border overflow-hidden" : "min-h-screen")}>
      <div className={cn("w-full flex flex-col flex-1 min-h-0", embedded ? "" : "mx-auto max-w-md")}>
        {!embedded && (
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
          <button
            onClick={() => setMembersOpen(true)}
            className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="멤버 보기"
          >
            <Users className="h-5 w-5" />
          </button>
          <button
            onClick={() => setAutoTranslate(!autoTranslate)}
            className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-smooth relative", autoTranslate ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
            aria-label="자동번역 토글"
          >
            <Languages className="h-4 w-4" />
            {autoTranslate && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />}
          </button>
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
        )}

        {embedded && (
          <div className="border-b border-border px-3 py-2 flex items-center gap-2 bg-card/80">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{group?.name ?? "모임 채팅"}</p>
              <p className="text-[11px] text-muted-foreground">채팅 내용이 실시간으로 표시됩니다</p>
            </div>
            <button
              onClick={() => setMembersOpen(true)}
              className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="멤버 보기"
            >
              <Users className="h-5 w-5" />
            </button>
            <button
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-smooth relative", autoTranslate ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
              aria-label="자동번역 토글"
            >
              <Languages className="h-4 w-4" />
              {autoTranslate && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />}
            </button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-1/2 ml-auto" />
            </>
          ) : messages && messages.length > 0 ? (
            messages.map((m) => {
              const mine = m.sender_id === user.id;
              const s = senders?.get(m.sender_id);
              const parsed = parseChatMessageContent(m.content);
              const isImg = parsed.body.startsWith("[img:");
              const translatedText = translated[m.id];
              const translationError = translationErrors[m.id];
              const isTranslating = translating.has(m.id);
              const senderName = mine ? "나" : getSenderName(s);
              const canDelete = mine && canDeleteMessage(m.created_at, now);
              return (
                <div key={m.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                  {!mine && (
                    <Avatar className="h-8 w-8 mt-auto">
                      <AvatarImage src={s?.avatar_url ?? undefined} />
                      <AvatarFallback>{getSenderInitial(s)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
                    {!mine && <span className="text-xs text-muted-foreground mb-0.5">{getSenderName(s)}</span>}
                    {parsed.replyTo && <ReplyPreview reply={parsed.replyTo} mine={mine} compact />}
                    {isImg ? (
                      <img src={parsed.body.slice(5, -1)} alt="첨부 이미지" className="max-w-[220px] rounded-2xl object-cover" loading="lazy" />
                    ) : (
                      <TranslatedMessageBubble
                        mine={mine}
                        content={parsed.body}
                        translatedText={translatedText}
                        translationError={translationError}
                        isTranslating={isTranslating}
                        onTranslate={() => translate(m.id, parsed.body)}
                      />
                    )}
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectReplyTarget({ id: m.id, senderName, body: getMessagePreview(m.content) })}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                    >
                      <Reply className="h-3 w-3" />
                      답글
                    </button>
                    {canDelete && (
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
          className="relative flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-2 safe-bottom"
        >
          {replyTarget && (
            <div className="absolute bottom-[68px] left-3 right-3">
              <ReplyPreview reply={replyTarget} onCancel={() => setReplyTarget(null)} />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile.mutate(f); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadFile.isPending} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground" aria-label="이미지 첨부">
            <Paperclip className="h-4 w-4" />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground" aria-label="이모지">
                <Smile className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 rounded-2xl p-2">
              <div className="grid grid-cols-6 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => appendEmoji(emoji)}
                    className="h-9 rounded-xl text-lg transition-smooth hover:bg-muted"
                    aria-label={`이모지 ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            ref={inputRef}
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

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{group?.name ?? "모임 멤버"}</DialogTitle>
            <DialogDescription>승인된 모임 멤버를 확인하고 초대 링크를 공유할 수 있어요.</DialogDescription>
          </DialogHeader>
          <Button onClick={shareInvite} className="w-full rounded-xl">
            <Share2 className="mr-2 h-4 w-4" />
            멤버 초대하기
          </Button>
          <div className="max-h-[52vh] overflow-y-auto space-y-2 pr-1">
            {membersLoading ? (
              <>
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
              </>
            ) : members.length > 0 ? (
              members.map((member) => {
                const isGroupOwner = member.userId === group?.owner_id;
                return (
                  <div key={member.userId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl ?? undefined} />
                      <AvatarFallback>{member.name.trim().slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.name}</p>
                      {member.email && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
                    </div>
                    <Badge variant={isGroupOwner ? "default" : "secondary"} className="shrink-0">
                      {isGroupOwner ? "모임장" : "멤버"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">아직 승인된 멤버가 없어요.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChat;
