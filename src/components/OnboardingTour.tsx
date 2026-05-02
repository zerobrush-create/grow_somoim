import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Users, Search as SearchIcon, Bell, Heart, ArrowRight, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/mock";

const STORAGE_KEY = "grow_onboarding_done";

const STEPS = [
  { icon: Sparkles, title: "GROW에 오신 걸 환영해요", body: "취향이 맞는 사람들과 함께 모임·클래스를 즐겨보세요." },
  { icon: Users, title: "모임에 참여해보세요", body: "관심 카테고리의 모임을 둘러보고 가입 신청해보세요." },
  { icon: SearchIcon, title: "원하는 걸 검색하세요", body: "검색으로 모임·클래스·친구·태그를 한 번에 찾아요." },
  { icon: Bell, title: "새 소식을 놓치지 마세요", body: "알림을 켜두면 댓글, 가입 승인, 일정을 바로 받아볼 수 있어요." },
];

export const OnboardingTour = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(STORAGE_KEY) === user.id) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("interests").eq("id", user.id).maybeSingle();
      // Show tour only if user has no interests yet (treat as new)
      if (!data?.interests || data.interests.length === 0) {
        setOpen(true);
      } else {
        localStorage.setItem(STORAGE_KEY, user.id);
      }
    })();
  }, [user]);

  const close = () => {
    if (user) localStorage.setItem(STORAGE_KEY, user.id);
    setOpen(false);
  };

  const isLast = step === STEPS.length;
  const Step = STEPS[step];

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = async () => {
    if (!user) return close();
    setSaving(true);
    try {
      if (picked.length > 0) {
        await supabase.from("profiles").update({ interests: picked }).eq("id", user.id);
      }
    } finally {
      setSaving(false);
      close();
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden gap-0">
        {!isLast ? (
          <>
            <div className="gradient-primary p-6 text-primary-foreground">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                <Step.icon className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold">{Step.title}</h2>
              <p className="text-sm text-white/90 mt-1">{Step.body}</p>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.concat([{ icon: Heart, title: "", body: "" }]).map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-primary" : "w-1.5 bg-muted"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={close}>건너뛰기</Button>
                <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
                  다음<ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <div className="h-12 w-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-3">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">관심사를 알려주세요</h2>
              <p className="text-xs text-muted-foreground mt-1">맞춤 추천에 사용돼요 (나중에 변경 가능)</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {categories.filter((c) => c.id !== "all").map((c) => {
                  const active = picked.includes(c.label);
                  return (
                    <button
                      key={c.id}
                      onClick={() => togglePick(c.label)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-smooth flex items-center gap-1 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}
                    >
                      <span>{c.emoji}</span>{c.label}{active && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" onClick={close} className="flex-1">나중에</Button>
              <Button onClick={finish} disabled={saving} className="flex-1">
                {saving ? "저장 중..." : "시작하기"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;