import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const InstructorApply = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["instructor-app", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("instructor_applications").select("id,status,created_at").eq("applicant_id", user!.id).order("created_at", { ascending: false }).maybeSingle()).data,
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      const { error } = await supabase.from("instructor_applications").insert({ applicant_id: user.id, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "강사 신청이 접수되었어요" });
      qc.invalidateQueries({ queryKey: ["instructor-app", user?.id] });
    },
    onError: (e: Error) => toast({ title: "신청 실패", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">강사 신청</h1>
        </header>
        <div className="p-4 space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft">
            <h2 className="text-lg font-bold mb-2">함께 가르치는 사람이 되어 보세요</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">강사 승인 후 클래스를 직접 개설하고 운영할 수 있어요. 운영진의 검토 후 1~2일 내 안내드립니다.</p>
          </div>
          {existing ? (
            <div className="bg-primary-soft rounded-2xl p-4 text-center">
              <Badge className="bg-primary text-primary-foreground border-0 mb-2">{existing.status}</Badge>
              <p className="text-sm text-foreground">신청 내역이 있어요. 운영진의 검토를 기다려주세요.</p>
            </div>
          ) : (
            <Button onClick={() => apply.mutate()} disabled={apply.isPending} className="w-full h-12 gradient-primary shadow-glow">
              {apply.isPending ? "신청 중..." : "강사로 신청하기"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorApply;