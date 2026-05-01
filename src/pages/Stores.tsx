import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Coins, Store } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const Stores = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => (await supabase.from("stores").select("*").eq("is_active", true).order("name")).data ?? [],
  });

  const { data: pointsTotal } = useQuery({
    queryKey: ["points-total", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("points").select("amount").eq("user_id", user!.id);
      return (data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
    },
  });

  const pay = useMutation({
    mutationFn: async ({ storeId, amount }: { storeId: number; amount: number }) => {
      if (!user) throw new Error("로그인이 필요합니다");
      if ((pointsTotal ?? 0) < amount) throw new Error("포인트가 부족해요");
      const { error: txErr } = await supabase.from("store_transactions").insert({ store_id: storeId, user_id: user.id, amount });
      if (txErr) throw txErr;
      const { error: pErr } = await supabase.from("points").insert({ user_id: user.id, amount: -amount, type: "spend", description: "가맹점 결제" });
      if (pErr) throw pErr;
    },
    onSuccess: () => { toast({ title: "결제 완료" }); qc.invalidateQueries({ queryKey: ["points-total", user?.id] }); },
    onError: (e: Error) => toast({ title: "결제 실패", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1">가맹점</h1>
        </header>

        <section className="p-4">
          <div className="gradient-primary rounded-2xl p-4 text-primary-foreground flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">사용 가능 포인트</p>
              <p className="text-2xl font-bold mt-0.5">{(pointsTotal ?? 0).toLocaleString()} P</p>
            </div>
            <Coins className="h-10 w-10 text-white/30" />
          </div>
        </section>

        <div className="px-4 space-y-2">
          {isLoading ? <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></> : stores && stores.length > 0 ? stores.map((s) => (
            <div key={s.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center"><Store className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  {s.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{s.address}</p>}
                </div>
              </div>
              {user && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[1000, 5000, 10000].map((amt) => (
                    <Button key={amt} size="sm" variant="outline" disabled={pay.isPending || (pointsTotal ?? 0) < amt}
                      onClick={() => pay.mutate({ storeId: s.id, amount: amt })}>
                      {amt.toLocaleString()}P
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )) : <p className="text-center text-sm text-muted-foreground py-12">등록된 가맹점이 없어요</p>}
        </div>
      </div>
    </div>
  );
};

export default Stores;