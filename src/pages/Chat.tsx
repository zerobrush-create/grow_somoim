import { useState } from "react";
import { ArrowLeft, Send, Plus, Smile, Search } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { chats, directMessages, messages as initialMessages, dmMessages as initialDmMessages } from "@/data/mock";
import { cn } from "@/lib/utils";

type ChatTab = "group" | "dm";

const Chat = () => {
  const [chatTab, setChatTab] = useState<ChatTab>("group");
  const [openGroupChat, setOpenGroupChat] = useState<string | null>(null);
  const [openDm, setOpenDm] = useState<string | null>(null);
  const [groupMsgs, setGroupMsgs] = useState(initialMessages);
  const [dmMsgs, setDmMsgs] = useState(initialDmMessages);
  const [text, setText] = useState("");

  const activeGroup = chats.find((c) => c.id === openGroupChat);
  const activeDm = directMessages.find((d) => d.id === openDm);

  const sendGroup = () => {
    if (!text.trim()) return;
    setGroupMsgs([...groupMsgs, { id: Date.now(), sender: "나", text, time: "지금", isMine: true }]);
    setText("");
  };

  const sendDm = () => {
    if (!text.trim()) return;
    setDmMsgs([...dmMsgs, { id: Date.now(), sender: "나", text, time: "지금", isMine: true }]);
    setText("");
  };

  /* ── 그룹 채팅방 ── */
  if (activeGroup) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-md bg-muted/40 min-h-screen flex flex-col">
          <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md px-3 py-3 border-b border-border flex items-center gap-3">
            <button onClick={() => setOpenGroupChat(null)} aria-label="뒤로" className="p-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={activeGroup.image} alt={activeGroup.groupName} className="h-9 w-9 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{activeGroup.groupName}</p>
              <p className="text-[11px] text-muted-foreground">멤버 142명</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-muted-foreground bg-card px-3 py-1 rounded-full">2026년 5월 1일</span>
            </div>
            {groupMsgs.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>

          <MessageInput text={text} setText={setText} onSend={sendGroup} />
        </div>
      </div>
    );
  }

  /* ── DM 채팅방 ── */
  if (activeDm) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-md bg-muted/40 min-h-screen flex flex-col">
          <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md px-3 py-3 border-b border-border flex items-center gap-3">
            <button onClick={() => setOpenDm(null)} aria-label="뒤로" className="p-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
              {activeDm.userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{activeDm.userName}</p>
              <p className="text-[11px] text-primary">온라인</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-muted-foreground bg-card px-3 py-1 rounded-full">2026년 5월 1일</span>
            </div>
            {dmMsgs.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>

          <MessageInput text={text} setText={setText} onSend={sendDm} />
        </div>
      </div>
    );
  }

  /* ── 목록 뷰 ── */
  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-0 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">채팅</h1>
          <button className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="검색">
            <Search className="h-5 w-5" />
          </button>
        </div>
        {/* Tab */}
        <div className="flex">
          {([["group", "소모임"], ["dm", "DM"]] as const).map(([id, label]) => {
            const totalUnread = id === "dm" ? directMessages.reduce((s, d) => s + d.unread, 0) : 0;
            return (
              <button
                key={id}
                onClick={() => setChatTab(id)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold border-b-2 transition-smooth flex items-center justify-center gap-1.5",
                  chatTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                )}
              >
                {label}
                {totalUnread > 0 && (
                  <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {chatTab === "group" && (
        <div className="divide-y divide-border animate-fade-in">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setOpenGroupChat(c.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth"
            >
              <img src={c.image} alt={c.groupName} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">{c.groupName}</p>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{c.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                  {c.unread > 0 && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {chatTab === "dm" && (
        <div className="divide-y divide-border animate-fade-in">
          {directMessages.map((d) => (
            <button
              key={d.id}
              onClick={() => setOpenDm(d.id)}
              className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-base font-bold flex-shrink-0">
                {d.userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">{d.userName}</p>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{d.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{d.lastMessage}</p>
                  {d.unread > 0 && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                      {d.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </MobileShell>
  );
};

/* ── 공통 컴포넌트 ── */
const MessageBubble = ({ message }: { message: { id: number; sender: string; text: string; time: string; isMine: boolean } }) => (
  <div className={cn("flex gap-2", message.isMine ? "justify-end" : "justify-start")}>
    {!message.isMine && (
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
        {message.sender[0]}
      </div>
    )}
    <div className={cn("flex flex-col max-w-[75%]", message.isMine && "items-end")}>
      {!message.isMine && <span className="text-[11px] text-muted-foreground mb-0.5 ml-1">{message.sender}</span>}
      <div className="flex items-end gap-1.5">
        {message.isMine && <span className="text-[10px] text-muted-foreground">{message.time}</span>}
        <div className={cn(
          "px-3.5 py-2 rounded-2xl text-sm leading-snug",
          message.isMine
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-foreground rounded-bl-md shadow-soft"
        )}>
          {message.text}
        </div>
        {!message.isMine && <span className="text-[10px] text-muted-foreground">{message.time}</span>}
      </div>
    </div>
  </div>
);

const MessageInput = ({
  text,
  setText,
  onSend,
}: {
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
}) => (
  <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border p-2 safe-bottom">
    <div className="flex items-center gap-2">
      <button className="p-2 text-muted-foreground" aria-label="추가"><Plus className="h-5 w-5" /></button>
      <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="메시지 보내기"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button className="text-muted-foreground" aria-label="이모지"><Smile className="h-5 w-5" /></button>
      </div>
      <button
        onClick={onSend}
        className="h-10 w-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-soft transition-smooth hover:opacity-95"
        aria-label="보내기"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default Chat;
