import { useState } from "react";
import { ArrowLeft, Send, Plus, Smile, Search } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { chats, messages as initialMessages } from "@/data/mock";
import { cn } from "@/lib/utils";

const Chat = () => {
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [msgs, setMsgs] = useState(initialMessages);
  const [text, setText] = useState("");

  const active = chats.find((c) => c.id === openChat);

  const send = () => {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: Date.now(), sender: "나", text, time: "지금", isMine: true }]);
    setText("");
  };

  if (active) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-md bg-muted/40 min-h-screen flex flex-col">
          <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md px-3 py-3 border-b border-border flex items-center gap-3">
            <button onClick={() => setOpenChat(null)} aria-label="뒤로" className="p-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={active.image} alt={active.groupName} className="h-9 w-9 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{active.groupName}</p>
              <p className="text-[11px] text-muted-foreground">멤버 142명</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-muted-foreground bg-card px-3 py-1 rounded-full">2026년 5월 1일</span>
            </div>
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.isMine ? "justify-end" : "justify-start")}>
                {!m.isMine && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                    {m.sender[0]}
                  </div>
                )}
                <div className={cn("flex flex-col max-w-[75%]", m.isMine && "items-end")}>
                  {!m.isMine && <span className="text-[11px] text-muted-foreground mb-0.5 ml-1">{m.sender}</span>}
                  <div className="flex items-end gap-1.5">
                    {m.isMine && <span className="text-[10px] text-muted-foreground">{m.time}</span>}
                    <div className={cn(
                      "px-3.5 py-2 rounded-2xl text-sm leading-snug",
                      m.isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card text-foreground rounded-bl-md shadow-soft"
                    )}>
                      {m.text}
                    </div>
                    {!m.isMine && <span className="text-[10px] text-muted-foreground">{m.time}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border p-2 safe-bottom">
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground" aria-label="추가"><Plus className="h-5 w-5" /></button>
              <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="메시지 보내기"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button className="text-muted-foreground" aria-label="이모지"><Smile className="h-5 w-5" /></button>
              </div>
              <button
                onClick={send}
                className="h-10 w-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-soft transition-smooth hover:opacity-95"
                aria-label="보내기"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">채팅</h1>
          <button className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="검색">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="divide-y divide-border">
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpenChat(c.id)}
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
    </MobileShell>
  );
};

export default Chat;