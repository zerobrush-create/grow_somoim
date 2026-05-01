import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["운동", "스터디", "취미", "맛집", "여행", "음악", "반려동물"];

const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "모임 이름은 2자 이상이어야 해요" })
    .max(40, { message: "모임 이름은 40자 이하로 입력해 주세요" }),
  category: z.enum(CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: "카테고리를 선택해 주세요" }),
  }),
  location: z
    .string()
    .trim()
    .max(60, { message: "지역은 60자 이하로 입력해 주세요" })
    .optional()
    .or(z.literal("")),
  maxMembers: z
    .union([z.literal(""), z.coerce.number().int().min(2, { message: "정원은 2명 이상이어야 해요" }).max(1000, { message: "정원은 1000명 이하로 입력해 주세요" })])
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, { message: "소개는 500자 이하로 입력해 주세요" })
    .optional()
    .or(z.literal("")),
});

type FieldErrors = Partial<Record<"name" | "category" | "location" | "maxMembers" | "description", string>>;

const GroupCreate = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("취미");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    name: false,
    category: false,
    location: false,
    maxMembers: false,
    description: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validation = useMemo(() => {
    const result = groupSchema.safeParse({
      name,
      category,
      location,
      maxMembers: maxMembers === "" ? "" : maxMembers,
      description,
    });
    const fieldErrors: FieldErrors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }
    return { success: result.success, data: result.success ? result.data : null, fieldErrors };
  }, [name, category, location, maxMembers, description]);

  const showError = (field: keyof FieldErrors) =>
    (touched[field] || submitAttempted) ? validation.fieldErrors[field] : undefined;

  const markTouched = (field: keyof FieldErrors) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!validation.success || !validation.data) {
        throw new Error(
          Object.values(validation.fieldErrors)[0] ?? "입력값을 확인해 주세요"
        );
      }
      const v = validation.data;

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: v.name,
          category: v.category,
          location: v.location ? v.location : null,
          description: v.description ? v.description : null,
          max_members: typeof v.maxMembers === "number" ? v.maxMembers : null,
          owner_id: user.id,
          status: "active",
        })
        .select("id")
        .single();
      if (error) throw error;

      // owner를 자동으로 멤버에 추가 (실패해도 모임 생성은 성공)
      await supabase.from("memberships").insert({
        group_id: data.id,
        user_id: user.id,
        role: "owner",
        status: "approved",
        joined_at: new Date().toISOString(),
      });

      return data.id as string;
    },
    onSuccess: (id) => {
      toast({ title: "모임이 생성되었어요" });
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate(`/groups/${id}`);
    },
    onError: (e: Error) =>
      toast({ title: "생성 실패", description: e.message, variant: "destructive" }),
  });

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-28">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
            aria-label="뒤로"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">새 소모임 만들기</h1>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitAttempted(true);
            if (!validation.success) return;
            create.mutate();
          }}
          className="px-4 pt-4 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="name">모임 이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => markTouched("name")}
              placeholder="예: 주말엔 북클럽"
              maxLength={40}
              required
              aria-invalid={!!showError("name")}
            />
            {showError("name") && <p className="text-sm text-destructive">{showError("name")}</p>}
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    markTouched("category");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth",
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-secondary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            {showError("category") && <p className="text-sm text-destructive">{showError("category")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">활동 지역</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => markTouched("location")}
              placeholder="예: 서울 마포구"
              maxLength={60}
              aria-invalid={!!showError("location")}
            />
            {showError("location") && <p className="text-sm text-destructive">{showError("location")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max">정원 (선택)</Label>
            <Input
              id="max"
              type="number"
              min={2}
              max={1000}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              onBlur={() => markTouched("maxMembers")}
              placeholder="제한 없음"
              aria-invalid={!!showError("maxMembers")}
            />
            {showError("maxMembers") && <p className="text-sm text-destructive">{showError("maxMembers")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">소개</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => markTouched("description")}
              placeholder="어떤 모임인가요? 함께하면 좋을 분들을 알려주세요."
              rows={5}
              maxLength={500}
              aria-invalid={!!showError("description")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {showError("description") ? (
                <span className="text-destructive">{showError("description")}</span>
              ) : (
                <span>자유롭게 소개해 주세요</span>
              )}
              <span>{description.length}/500</span>
            </div>
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40 p-3">
            <Button
              type="submit"
              disabled={create.isPending || !validation.success}
              className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-glow hover:opacity-95"
            >
              {create.isPending ? "만드는 중..." : "모임 만들기"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupCreate;
