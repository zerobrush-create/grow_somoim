import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, Calendar as CalIcon, Check, Flame } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText, formatMonthTitle, weekdayLabels } from "@/i18n/format";

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { lang, t } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();
  const todayStr = today.toISOString().slice(0, 10);

  const { data: records } = useQuery({
    queryKey: ["attendance", user?.id, yyyy, mm],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(yyyy, mm, 1).toISOString().slice(0, 10);
      const end = new Date(yyyy, mm + 1, 0).toISOString().slice(0, 10);
      const { data } = await supabase.from("attendance").select("attended_on").eq("user_id", user!.id).gte("attended_on", start).lte("attended_on", end);
      return new Set((data ?? []).map((r) => r.attended_on));
    },
  });

  const { data: badges } = useQuery({
    queryKey: ["badges", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("badges").select("*").eq("user_id", user!.id).order("earned_at", { ascending: false })).data ?? [],
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("login required");
      const { error } = await supabase.from("attendance").insert({ user_id: user.id, attended_on: todayStr });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t.attendance.checkSuccess });
      qc.invalidateQueries({ queryKey: ["attendance", user?.id] });
      qc.invalidateQueries({ queryKey: ["badges", user?.id] });
      qc.invalidateQueries({ queryKey: ["points-total", user?.id] });
    },
    onError: (e: Error) => {
      const msg = e.message.includes("duplicate") ? t.attendance.alreadyChecked : e.message;
      toast({ title: t.attendance.checkFail, description: msg, variant: "destructive" });
    },
  });

  const checkedToday = records?.has(todayStr);
  const daysInMonth = new Date(yyyy, mm + 1, 0).getDate();
  const firstDow = new Date(yyyy, mm, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthCount = records?.size ?? 0;
  const weekdays = weekdayLabels(lang);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label={t.common.back}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold">{t.attendance.title}</h1>
      </header>

      <section className="px-4 pt-5">
        <div className="gradient-primary rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1"><Flame className="h-5 w-5" /><p className="text-sm">{t.attendance.thisMonth}</p></div>
          <p className="text-3xl font-bold">{monthCount}{t.attendance.days}</p>
          <p className="text-xs text-white/80 mt-1">{t.attendance.dailyPoints}</p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <Button onClick={() => checkIn.mutate()} disabled={!!checkedToday || checkIn.isPending} className="w-full h-14 rounded-2xl text-base font-bold gradient-primary">
          {checkedToday ? <><Check className="h-5 w-5 mr-2" />{t.attendance.checkedIn}</> : checkIn.isPending ? t.attendance.processing : t.attendance.checkIn}
        </Button>
      </section>

      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-3"><CalIcon className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold">{formatMonthTitle(yyyy, mm, lang)}</h3></div>
          <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mb-1">
            {weekdays.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const ds = `${yyyy}-${String(mm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const checked = records?.has(ds);
              const isToday = ds === todayStr;
              return (
                <div key={i} className={cn("aspect-square rounded-lg flex items-center justify-center text-xs font-medium", checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground", isToday && !checked && "ring-2 ring-primary")}>
                  {checked ? <Check className="h-4 w-4" /> : d}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pt-6 pb-6">
        <div className="flex items-center gap-2 mb-3"><Award className="h-4 w-4 text-accent" /><h3 className="text-sm font-bold">{t.attendance.badges} ({badges?.length ?? 0})</h3></div>
        {badges && badges.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {badges.map((b) => (
              <div key={b.id} className="bg-card rounded-2xl p-3 shadow-soft text-center">
                <div className="h-12 w-12 rounded-full gradient-primary mx-auto flex items-center justify-center text-2xl">🏆</div>
                <p className="text-sm font-bold mt-2">{tr(b.title)}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{tr(b.description)}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground py-4 text-center">{t.attendance.noBadges}</p>}
      </section>
    </MobileShell>
  );
};

export default Attendance;
