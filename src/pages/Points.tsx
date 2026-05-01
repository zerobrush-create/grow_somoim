import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Points = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: points, isLoading } = useQuery({
    queryKey: ["points", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("points").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const total = (points ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">포인트 내역</h1>
        </header>

        <section className="p-4">
          <div className="gradient-primary rounded-2xl p-5 text-primary-foreground">
            <div className="flex items-center gap-2 text-xs text-white/80"><Coins className="h-4 w-4" /> 보유 포인트</div>
            <p className="text-3xl font-bold mt-1">{total.toLocaleString()} P</p>
          </div>
        </section>

        <section className="px-4 space-y-2">
          {isLoading ? (
            <><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></>
          ) : points && points.length ? (
            points.map((p) => {
              const positive = (p.amount ?? 0) >= 0;
              return (
                <div key={p.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${positive ? "bg-primary-soft text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.description ?? p.type}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-bold ${positive ? "text-primary" : "text-destructive"}`}>{positive ? "+" : ""}{p.amount.toLocaleString()}P</p>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-muted-foreground py-12">아직 포인트 내역이 없어요</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Points;