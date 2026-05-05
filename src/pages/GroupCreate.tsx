import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ImagePlus, X, Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateRuntimeText } from "@/i18n/runtimeTranslations";

const CATEGORIES = ["운동", "스터디", "취미", "맛집", "여행", "음악", "반려동물"];
const MAX_TAGS = 5;
const MAX_IMAGE_MB = 5;

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
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const tr = (value: string) => translateRuntimeText(value, lang);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    name: false,
    category: false,
    location: false,
    maxMembers: false,
    description: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // 에러 자동 스크롤용 ref
  const fieldRefs: Record<keyof FieldErrors, React.RefObject<HTMLDivElement>> = {
    name: useRef<HTMLDivElement>(null),
    category: useRef<HTMLDivElement>(null),
    location: useRef<HTMLDivElement>(null),
    maxMembers: useRef<HTMLDivElement>(null),
    description: useRef<HTMLDivElement>(null),
  };
  const FIELD_ORDER: (keyof FieldErrors)[] = ["name", "category", "location", "maxMembers", "description"];

  // 정원 입력 마스킹: 숫자만 허용
  const handleMaxMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setMaxMembers(digitsOnly);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "이미지 파일만 업로드할 수 있어요", variant: "destructive" });
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast({ title: `이미지는 ${MAX_IMAGE_MB}MB 이하만 가능해요`, variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t) return;
    if (t.length > 12) {
      toast({ title: "태그는 12자 이하여야 해요", variant: "destructive" });
      return;
    }
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast({ title: `태그는 최대 ${MAX_TAGS}개까지 추가할 수 있어요`, variant: "destructive" });
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

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

      // 이미지 업로드 (선택)
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("group-images")
          .upload(path, imageFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(`이미지 업로드 실패: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("group-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

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
          is_private: isPrivate,
          tags: tags.length > 0 ? tags : null,
          image_url: imageUrl,
        })
        .select("id")
        .single();
      if (error) throw new Error(`모임 저장 실패: ${error.message}`);

      // owner를 자동으로 멤버에 추가 (실패해도 모임 생성은 성공)
      const { error: memberError } = await supabase.from("memberships").insert({
        group_id: data.id,
        user_id: user.id,
        role: "owner",
        status: "approved",
        joined_at: new Date().toISOString(),
      });
      if (memberError) {
        toast({ title: "모임은 생성됐지만 멤버 등록에 실패했어요", description: memberError.message, variant: "destructive" });
      }

      return data.id as string;
    },
    onSuccess: () => {
      toast({ title: "모임이 생성되었어요" });
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate("/groups");
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
            if (!validation.success) {
              // 첫 에러 필드로 자동 스크롤 + 포커스
              const firstErrorField = FIELD_ORDER.find((f) => validation.fieldErrors[f]);
              if (firstErrorField) {
                const el = fieldRefs[firstErrorField].current;
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  const focusable = el.querySelector<HTMLElement>("input, textarea, button");
                  setTimeout(() => focusable?.focus(), 300);
                }
              }
              return;
            }
            create.mutate();
          }}
          className="px-4 pt-4 space-y-5"
        >
          <div ref={fieldRefs.name} className="space-y-2 scroll-mt-20">
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

          {/* 커버 이미지 */}
          <div className="space-y-2">
            <Label>커버 이미지 (선택)</Label>
            {imagePreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="커버 미리보기" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow"
                  aria-label="이미지 제거"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border hover:bg-muted/50 cursor-pointer transition-smooth">
                <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">{tr(`이미지 추가 (최대 ${MAX_IMAGE_MB}MB)`)}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div ref={fieldRefs.category} className="space-y-2 scroll-mt-20">
            <div className="flex items-center justify-between">
              <Label>카테고리 *</Label>
              {category ? (
                <span className="text-xs text-primary inline-flex items-center gap-1">
                  <Check className="h-3 w-3" /> 선택됨
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">하나를 선택해 주세요</span>
              )}
            </div>
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
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-foreground hover:bg-secondary",
                    !category && (touched.category || submitAttempted) && "ring-1 ring-destructive/40"
                  )}
                  aria-pressed={category === c}
                >
                  {c}
                </button>
              ))}
            </div>
            {showError("category") && <p className="text-sm text-destructive">{showError("category")}</p>}
          </div>

          <div ref={fieldRefs.location} className="space-y-2 scroll-mt-20">
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

          <div ref={fieldRefs.maxMembers} className="space-y-2 scroll-mt-20">
            <Label htmlFor="max">정원 (선택)</Label>
            <Input
              id="max"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={maxMembers}
              onChange={handleMaxMembersChange}
              onBlur={() => markTouched("maxMembers")}
              placeholder="제한 없음 (숫자만 입력)"
              aria-invalid={!!showError("maxMembers")}
            />
            {showError("maxMembers") && <p className="text-sm text-destructive">{showError("maxMembers")}</p>}
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <Label htmlFor="tag">{tr(`태그 (선택, 최대 ${MAX_TAGS}개)`)}</Label>
            <div className="flex gap-2">
              <Input
                id="tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="예: 독서, 등산"
                maxLength={12}
              />
              <Button type="button" variant="secondary" onClick={addTag} disabled={!tagInput.trim()}>
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:text-destructive"
                      aria-label={`${t} 제거`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 비공개 토글 */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
            <div className="space-y-1">
              <Label htmlFor="private" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                비공개 모임
              </Label>
              <p className="text-xs text-muted-foreground">
                승인된 멤버만 모임 내용을 볼 수 있어요
              </p>
            </div>
            <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <div ref={fieldRefs.description} className="space-y-2 scroll-mt-20">
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
