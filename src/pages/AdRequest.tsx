import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const AdRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: mine } = useQuery({
    queryKey: ["my-ad-requests", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("ad_requests").select("*").eq("requester_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      const { error } = await supabase.from("ad_requests").insert({ requester_id: user.id, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "광고 요청이 접수되었어요" }); qc.invalidateQueries({ queryKey: ["my-ad-requests", user?.id] }); },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1">광고 신청</h1>
        </header>

        <div className="p-4 space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft">
            <Megaphone className="h-8 w-8 text-primary mb-2" />
            <h2 className="text-lg font-bold">광고 게재를 신청해 보세요</h2>
            <p className="text-sm text-muted-foreground mt-1">홈 메인 배너에 광고를 노출할 수 있어요. 운영진 검토 후 안내드립니다.</p>
          </div>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full h-12 gradient-primary shadow-glow">
            {submit.isPending ? "접수 중..." : "광고 신청하기"}
          </Button>

          <div className="space-y-2">
            <h3 className="text-sm font-bold mt-4">내 신청 내역</h3>
            {mine && mine.length > 0 ? mine.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-6">신청 내역이 없어요</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdRequest;