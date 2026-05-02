import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Plus, Users, List, CalendarDays } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  max_attendees: number | null;
};

const GroupEvents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["group-events", id],
    enabled: !!id,
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,description,location,starts_at,max_attendees")
        .eq("group_id", id!)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const eventIds = (events ?? []).map((e) => e.id);
  const { data: attendees } = useQuery({
    queryKey: ["event-attendees", id, eventIds.join(",")],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("event_attendees").select("event_id,user_id,status").in("event_id", eventIds);
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("로그인이 필요합니다");
      if (!title.trim()) throw new Error("제목을 입력해 주세요");
      if (!startsAt) throw new Error("시작 일시를 선택해 주세요");
      const { error } = await supabase.from("events").insert({
        group_id: id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        max_attendees: maxAttendees ? Number(maxAttendees) : null,
        created_by: user.id,
        status: "upcoming",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "일정이 생성되었어요" });
      setOpen(false);
      setTitle(""); setStartsAt(""); setLocation(""); setDescription(""); setMaxAttendees("");
      qc.invalidateQueries({ queryKey: ["group-events", id] });
    },
    onError: (e: Error) => toast({ title: "생성 실패", description: e.message, variant: "destructive" }),
  });

  const rsvp = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: "going" | "maybe" | "declined" | null }) => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (status === null) {
        const { error } = await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        // upsert
        const { data: existing } = await supabase.from("event_attendees").select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle();
        if (existing) {
          const { error } = await supabase.from("event_attendees").update({ status }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id, status });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-attendees", id] }),
    onError: (e: Error) => toast({ title: "처리 실패", description: e.message, variant: "destructive" }),
  });

  const countFor = (eid: string, status?: string) =>
    (attendees ?? []).filter((a) => a.event_id === eid && (!status || (a as any).status === status || (status === "going" && !(a as any).status))).length;
  const myStatus = (eid: string): "going" | "maybe" | "declined" | null => {
    if (!user) return null;
    const a = (attendees ?? []).find((x) => x.event_id === eid && x.user_id === user.id);
    return a ? (((a as any).status as any) ?? "going") : null;
  };

  // Calendar grid helpers
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; events: EventRow[] }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, events: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = (events ?? []).filter((e) => {
      const dt = new Date(e.starts_at);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === d;
    });
    cells.push({ day: d, events: dayEvents });
  }
  const todayD = new Date();
  const isToday = (d: number) => todayD.getFullYear() === year && todayD.getMonth() === month && todayD.getDate() === d;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-20">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold flex-1">모임 일정</h1>
          <div className="flex bg-muted rounded-full p-0.5">
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded-full", view === "list" && "bg-background shadow-sm")} aria-label="목록"><List className="h-4 w-4" /></button>
            <button onClick={() => setView("calendar")} className={cn("p-1.5 rounded-full", view === "calendar" && "bg-background shadow-sm")} aria-label="캘린더"><CalendarDays className="h-4 w-4" /></button>
          </div>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="일정 추가">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 일정</DialogTitle>
                  <DialogDescription>모임 멤버에게 공유할 일정을 만들어요.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="t">제목 *</Label>
                    <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s">시작 일시 *</Label>
                    <Input id="s" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="l">장소</Label>
                    <Input id="l" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m">정원</Label>
                    <Input id="m" inputMode="numeric" value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value.replace(/[^0-9]/g, ""))} placeholder="제한 없음" maxLength={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="d">설명</Label>
                    <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
                  <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    {create.isPending ? "생성 중..." : "만들기"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </header>

        {view === "calendar" && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="px-2 py-1 rounded hover:bg-muted text-sm">‹</button>
              <p className="font-bold">{year}년 {month + 1}월</p>
              <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="px-2 py-1 rounded hover:bg-muted text-sm">›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mb-1">
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => (
                <div key={i} className={cn("aspect-square rounded-lg border border-border p-1 text-[10px] flex flex-col", c.day && isToday(c.day) && "bg-primary-soft border-primary")}>
                  {c.day && <span className="font-semibold">{c.day}</span>}
                  <div className="flex-1 overflow-hidden space-y-0.5 mt-0.5">
                    {c.events.slice(0, 2).map((e) => (
                      <div key={e.id} className="bg-primary/15 text-primary truncate rounded px-1 leading-tight">{e.title}</div>
                    ))}
                    {c.events.length > 2 && <div className="text-muted-foreground">+{c.events.length - 2}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "list" && (
        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : events && events.length > 0 ? (
            events.map((ev) => {
              const mine: "going" | "maybe" | "declined" | null = myStatus(ev.id);
              const goingCount = countFor(ev.id, "going");
              const full = ev.max_attendees != null && goingCount >= ev.max_attendees && mine !== "going";
              return (
                <div key={ev.id} className="rounded-xl border border-border p-4 space-y-2">
                  <h3 className="font-bold">{ev.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {new Date(ev.starts_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ev.location}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      참석 {goingCount}{ev.max_attendees ? `/${ev.max_attendees}` : ""} · 미정 {countFor(ev.id, "maybe")}
                    </span>
                  </div>
                  {ev.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{ev.description}</p>}
                  {user && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <Button size="sm" variant={mine === "going" ? "default" : "outline"} disabled={rsvp.isPending || full} onClick={() => rsvp.mutate({ eventId: ev.id, status: mine === "going" ? null : "going" })}>
                        {full && mine !== "going" ? "마감" : "참석"}
                      </Button>
                      <Button size="sm" variant={mine === "maybe" ? "default" : "outline"} disabled={rsvp.isPending} onClick={() => rsvp.mutate({ eventId: ev.id, status: mine === "maybe" ? null : "maybe" })}>미정</Button>
                      <Button size="sm" variant={mine === "declined" ? "default" : "outline"} disabled={rsvp.isPending} onClick={() => rsvp.mutate({ eventId: ev.id, status: mine === "declined" ? null : "declined" })}>불참</Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">아직 일정이 없어요</div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default GroupEvents;