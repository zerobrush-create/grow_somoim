import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

const TEXT: Record<Language, {
  title: string;
  headline: string;
  description: string;
  existing: string;
  applying: string;
  apply: string;
  success: string;
  fail: string;
}> = {
  ko: {
    title: "강사 신청",
    headline: "함께 가르치는 사람이 되어 보세요",
    description: "강사 승인 후 클래스를 직접 개설하고 운영할 수 있어요. 운영진의 검토 후 1~2일 내 안내드립니다.",
    existing: "신청 내역이 있어요. 운영진의 검토를 기다려주세요.",
    applying: "신청 중...",
    apply: "강사로 신청하기",
    success: "강사 신청이 접수되었어요",
    fail: "신청 실패",
  },
  en: {
    title: "Instructor application",
    headline: "Become someone who teaches with us",
    description: "After approval, you can create and run classes yourself. Our team will review your application and respond within 1-2 days.",
    existing: "You already have an application. Please wait for the team to review it.",
    applying: "Applying...",
    apply: "Apply as instructor",
    success: "Instructor application submitted",
    fail: "Application failed",
  },
  ja: {
    title: "講師申請",
    headline: "一緒に教える人になりましょう",
    description: "講師として承認されると、クラスを直接開設して運営できます。運営チームが確認し、1〜2日以内にご案内します。",
    existing: "申請履歴があります。運営チームの確認をお待ちください。",
    applying: "申請中...",
    apply: "講師として申請",
    success: "講師申請を受け付けました",
    fail: "申請に失敗しました",
  },
  zh: {
    title: "讲师申请",
    headline: "成为和我们一起授课的人",
    description: "讲师获批后，你可以自行开设并运营课程。运营团队审核后将在 1-2 天内通知你。",
    existing: "你已有申请记录。请等待运营团队审核。",
    applying: "申请中...",
    apply: "申请成为讲师",
    success: "讲师申请已提交",
    fail: "申请失败",
  },
  ru: {
    title: "Заявка инструктора",
    headline: "Станьте тем, кто учит вместе с нами",
    description: "После одобрения вы сможете самостоятельно создавать и проводить занятия. Команда рассмотрит заявку и ответит в течение 1-2 дней.",
    existing: "У вас уже есть заявка. Пожалуйста, дождитесь проверки команды.",
    applying: "Отправка...",
    apply: "Стать инструктором",
    success: "Заявка инструктора отправлена",
    fail: "Не удалось отправить заявку",
  },
};

const InstructorApply = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { lang } = useLanguage();
  const copy = TEXT[lang];

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
      toast({ title: copy.success });
      qc.invalidateQueries({ queryKey: ["instructor-app", user?.id] });
    },
    onError: (e: Error) => toast({ title: copy.fail, description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">{copy.title}</h1>
        </header>
        <div className="p-4 space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft">
            <h2 className="text-lg font-bold mb-2">{copy.headline}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{copy.description}</p>
          </div>
          {existing ? (
            <div className="bg-primary-soft rounded-2xl p-4 text-center">
              <Badge className="bg-primary text-primary-foreground border-0 mb-2">{existing.status}</Badge>
              <p className="text-sm text-foreground">{copy.existing}</p>
            </div>
          ) : (
            <Button onClick={() => apply.mutate()} disabled={apply.isPending} className="w-full h-12 gradient-primary shadow-glow">
              {apply.isPending ? copy.applying : copy.apply}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorApply;
