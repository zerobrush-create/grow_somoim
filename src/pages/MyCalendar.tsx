import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MyCalendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const { data: groupIds } = useQuery({
    queryKey: ["my-cal-group-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("memberships").select("group_id").eq("user_id", user!.id).eq("status", "approved");
      return (data ?? []).map((r) => r.group_id);
    },
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["my-cal-events", groupIds],
    enabled: !!groupIds && groupIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id,group_id,title,description,location,starts_at,max_attendees").in("group_id", groupIds!).order("starts_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["my-cal-rsvp", user?.id, events?.map((e) => e.id).join(",")],
    enabled: !!user && !!events && events.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("event_attendees").select("event_id,status").eq("user_id", user!.id).in("event_id", events!.map((e) => e.id));
      return new Map((data ?? []).map((r: any) => [r.event_id, r.status ?? "going"]));
    },
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEvents = (events ?? []).filter((e) => {
    const d = new Date(e.starts_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const cells = useMemo(() => {
    const out: Array<{ day: number | null; events: typeof monthEvents }> = [];
    for (let i = 0; i < firstDow; i++) out.push({ day: null, events: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({
        day: d,
        events: monthEvents.filter((e) => new Date(e.starts_at).getDate() === d),
      });
    }
    return out;
  }, [firstDow, daysInMonth, monthEvents]);

  const upcoming = (events ?? []).filter((e) => new Date(e.starts_at) >= new Date()).slice(0, 20);
  const todayD = new Date();
  const isToday = (d: number) => todayD.getFullYear() === year && todayD.getMonth() === month && todayD.getDate() === d;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1 flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" />내 캘린더</h1>
        </header>

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

        <section className="px-4 pt-2">
          <h3 className="text-sm font-bold mb-2">다가오는 일정</h3>
          {isLoading ? <Skeleton className="h-20 w-full" /> :
           upcoming.length === 0 ? <p className="text-center text-sm text-muted-foreground py-10">예정된 일정이 없어요</p> :
           <div className="space-y-2">
             {upcoming.map((e) => {
               const status = rsvps?.get(e.id);
               return (
                 <Link key={e.id} to={`/groups/${e.group_id}/events`} className="block rounded-xl border border-border p-3 hover:shadow-soft transition-smooth">
                   <div className="flex items-start justify-between gap-2">
                     <h4 className="text-sm font-bold">{e.title}</h4>
                     {status && <Badge variant="secondary" className={cn("text-[10px]", status === "going" ? "bg-primary-soft text-primary" : status === "maybe" ? "bg-amber-100 text-amber-700" : "bg-muted")}>{status === "going" ? "참석" : status === "maybe" ? "미정" : "불참"}</Badge>}
                   </div>
                   <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-1">
                     <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(e.starts_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}</span>
                     {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                     {e.max_attendees && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />/{e.max_attendees}</span>}
                   </div>
                 </Link>
               );
             })}
           </div>
          }
        </section>
      </div>
    </div>
  );
};

export default MyCalendar;