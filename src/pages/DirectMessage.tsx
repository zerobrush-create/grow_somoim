import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, MoreVertical, ShieldOff, Paperclip, Languages, Trash2, Reply } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportDialog } from "@/components/ReportDialog";
import { useMessageTranslation } from "@/hooks/useMessageTranslation";
import { TranslatedMessageBubble } from "@/components/chat/TranslatedMessageBubble";
import { ReplyPreview } from "@/components/chat/ReplyPreview";
import { canDeleteMessage, encodeReplyMessageContent, getMessagePreview, parseChatMessageContent, type ReplyTarget } from "@/lib/chatMessage";
import { fallbackUserName, firstText, fullName } from "@/lib/userIdentity";

type DM = { id: number; content: string; sender_id: string; receiver_id: string; created_at: string; is_read: boolean };

type ChatProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
};

const profileName = (profile?: ChatProfile | null) => profile?.name || profile?.email || fallbackUserName(profile?.id);
const profileInitial = (profile?: ChatProfile | null) => profileName(profile).trim().slice(0, 1).toUpperCase();

const DirectMessage = () => {
  const { peerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [peerLastSeen, setPeerLastSeen] = useState<string | null>(null);
  const { translated, errors: translationErrors, loading: translating, autoTranslate, setAutoTranslate, translate, autoTranslateMessages } = useMessageTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: peer } = useQuery({
    queryKey: ["dm-peer", peerId],
    enabled: !!peerId,
    queryFn: async (): Promise<ChatProfile | null> => {
      const [{ data: profile }, { data: appUser }] = await Promise.all([
        supabase.from("profiles").select("id,name,nickname,avatar_url,email").eq("id", peerId!).maybeSingle(),
        supabase.from("users").select("id,nickname,email,first_name,last_name,profile_image_url").eq("id", peerId!).maybeSingle(),
      ]);

      if (profile) {
        const appFullName = appUser ? fullName(appUser.first_name, appUser.last_name) : "";
        return {
          id: profile.id,
          name: firstText(profile.nickname, profile.name, appUser?.nickname, appFullName, profile.email, appUser?.email, fallbackUserName(profile.id)),
          avatar_url: profile.avatar_url ?? appUser?.profile_image_url ?? null,
          email: profile.email ?? appUser?.email ?? null,
        };
      }

      if (appUser) {
        const appFullName = fullName(appUser.first_name, appUser.last_name);
        return {
          id: appUser.id,
          name: firstText(appUser.nickname, appFullName, appUser.email, fallbackUserName(appUser.id)),
          avatar_url: appUser.profile_image_url ?? null,
          email: appUser.email ?? null,
        };
      }

      return null;
    },
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
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, (payload) => {
        const m = (payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old) as DM;
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
      const peerPresence = state[peerId] as Array<{ online_at?: string }> | undefined;
      const isOnline = !!peerPresence?.length;
      setPeerOnline(isOnline);
      if (!isOnline) {
        const stored = localStorage.getItem(`grow_last_seen_${peerId}`);
        if (stored) setPeerLastSeen(stored);
      } else {
        const onlineAt = peerPresence?.[0]?.online_at;
        if (onlineAt) localStorage.setItem(`grow_last_seen_${peerId}`, onlineAt);
        setPeerLastSeen(null);
      }
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

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !peerId) throw new Error("로그인이 필요합니다");
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `dm/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-files").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("chat-files").getPublicUrl(path);
      const content = encodeReplyMessageContent(`[img:${publicUrl}]`, replyTarget);
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id, receiver_id: peerId, content,
      });
      if (error) throw error;
      setReplyTarget(null);
    },
    onError: (e: Error) => toast({ title: "파일 전송 실패", description: e.message, variant: "destructive" }),
  });

  const blockUser = useMutation({
    mutationFn: async () => {
      if (!user || !peerId) throw new Error("로그인이 필요합니다");
      const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: peerId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "차단되었어요", description: "해당 사용자의 메시지를 더 이상 받지 않습니다" });
      navigate(-1);
    },
    onError: (e: Error) => toast({ title: "차단 실패", description: e.message, variant: "destructive" }),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!user || !peerId) throw new Error("로그인이 필요합니다");
      const content = text.trim(); if (!content) return;
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id, receiver_id: peerId, content: encodeReplyMessageContent(content, replyTarget),
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
      const { error } = await supabase.from("direct_messages").delete().eq("id", messageId).gt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dm-thread", user?.id, peerId] });
      qc.invalidateQueries({ queryKey: ["dm-threads", user?.id] });
    },
    onError: (e: Error) => toast({ title: "삭제 실패", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!autoTranslate || !messages || !peerId) return;
    autoTranslateMessages(messages.map((m) => ({ id: m.id, content: parseChatMessageContent(m.content).body, isIncoming: m.sender_id === peerId })));
  }, [autoTranslate, autoTranslateMessages, messages, peerId]);

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col flex-1">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar className="h-9 w-9"><AvatarImage src={peer?.avatar_url ?? undefined} /><AvatarFallback>{profileInitial(peer)}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{profileName(peer)}</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full inline-block", peerOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
              {peerOnline ? "온라인" : peerLastSeen ? `마지막 접속 ${new Date(peerLastSeen).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : "오프라인"}
            </p>
          </div>
          <button
            onClick={() => setAutoTranslate(!autoTranslate)}
            className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-smooth relative", autoTranslate ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            aria-label="자동번역 토글"
            title={autoTranslate ? "자동번역 ON" : "자동번역 OFF"}
          >
            <Languages className="h-4.5 w-4.5" />
            {autoTranslate && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="더보기">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setBlockDialogOpen(true)} className="text-destructive focus:text-destructive gap-2">
                <ShieldOff className="h-4 w-4" /> 차단하기
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 p-0">
                <div className="px-2 py-1.5">
                  <ReportDialog targetType="user" targetId={peerId ?? ""} label="신고하기" />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>사용자를 차단할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                차단하면 {profileName(peer)}의 메시지를 더 이상 받지 않습니다. 차단 목록은 내 정보에서 관리할 수 있어요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => blockUser.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                차단
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <><Skeleton className="h-12 w-2/3" /><Skeleton className="h-12 w-1/2 ml-auto" /></>
          ) : messages && messages.length > 0 ? (
            messages.map((m) => {
              const mine = m.sender_id === user.id;
              const parsed = parseChatMessageContent(m.content);
              const isImg = parsed.body.startsWith("[img:");
              const translatedText = translated[m.id];
              const translationError = translationErrors[m.id];
              const isTranslating = translating.has(m.id);
              const senderName = mine ? "나" : profileName(peer);
              const canDelete = mine && canDeleteMessage(m.created_at, now);
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] flex flex-col", mine ? "items-end" : "items-start")}>
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
                      onClick={() => setReplyTarget({ id: m.id, senderName, body: getMessagePreview(m.content) })}
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

        <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="relative border-t border-border bg-card/95 backdrop-blur-md p-3 flex gap-2 safe-bottom">
          {replyTarget && (
            <div className="absolute bottom-[68px] left-3 right-3">
              <ReplyPreview reply={replyTarget} onCancel={() => setReplyTarget(null)} />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile.mutate(f); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadFile.isPending} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground" aria-label="이미지 첨부">
            <Paperclip className="h-4 w-4" />
          </button>
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
