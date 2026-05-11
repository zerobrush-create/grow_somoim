import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";
import { normalizeClassCategory } from "@/lib/classCategories";

const TEXT: Record<Language, {
  title: string;
  titleLabel: string;
  category: string;
  categoryPlaceholder: string;
  place: string;
  placePlaceholder: string;
  schedule: string;
  schedulePlaceholder: string;
  fee: string;
  feePlaceholder: string;
  capacity: string;
  about: string;
  curriculum: string;
  saving: string;
  save: string;
  loginRequired: string;
  titleRequired: string;
  success: string;
  fail: string;
  notFound: string;
  notOwner: string;
  back: string;
}> = {
  ko: {
    title: "클래스 수정",
    titleLabel: "제목 *",
    category: "카테고리",
    categoryPlaceholder: "예: 요리",
    place: "장소",
    placePlaceholder: "예: 서울 마포구",
    schedule: "일정",
    schedulePlaceholder: "예: 매주 토요일 오후 2시",
    fee: "참가비",
    feePlaceholder: "무료 또는 30,000원",
    capacity: "정원",
    about: "소개",
    curriculum: "커리큘럼",
    saving: "저장 중...",
    save: "저장",
    loginRequired: "로그인이 필요합니다",
    titleRequired: "제목을 입력해주세요",
    success: "클래스가 수정되었어요",
    fail: "수정 실패",
    notFound: "클래스를 찾을 수 없어요",
    notOwner: "클래스 개설자만 수정할 수 있어요",
    back: "뒤로",
  },
  en: {
    title: "Edit class",
    titleLabel: "Title *",
    category: "Category",
    categoryPlaceholder: "e.g. Cooking",
    place: "Place",
    placePlaceholder: "e.g. Seoul, Mapo-gu",
    schedule: "Schedule",
    schedulePlaceholder: "e.g. Every Saturday at 2 PM",
    fee: "Fee",
    feePlaceholder: "Free or 30,000 KRW",
    capacity: "Capacity",
    about: "About",
    curriculum: "Curriculum",
    saving: "Saving...",
    save: "Save",
    loginRequired: "Login required",
    titleRequired: "Please enter a title",
    success: "Class updated",
    fail: "Update failed",
    notFound: "Class not found",
    notOwner: "Only the class creator can edit this",
    back: "Back",
  },
  ja: {
    title: "クラス編集",
    titleLabel: "タイトル *",
    category: "カテゴリー",
    categoryPlaceholder: "例：料理",
    place: "場所",
    placePlaceholder: "例：東京",
    schedule: "スケジュール",
    schedulePlaceholder: "例：毎週土曜日 午後2時",
    fee: "参加費",
    feePlaceholder: "無料または30,000ウォン",
    capacity: "定員",
    about: "紹介",
    curriculum: "カリキュラム",
    saving: "保存中...",
    save: "保存",
    loginRequired: "ログインが必要です",
    titleRequired: "タイトルを入力してください",
    success: "クラスを修正しました",
    fail: "修正に失敗しました",
    notFound: "クラスが見つかりません",
    notOwner: "クラス開設者のみ編集できます",
    back: "戻る",
  },
  zh: {
    title: "编辑课程",
    titleLabel: "标题 *",
    category: "分类",
    categoryPlaceholder: "例：烹饪",
    place: "地点",
    placePlaceholder: "例：首尔麻浦区",
    schedule: "日程",
    schedulePlaceholder: "例：每周六下午2点",
    fee: "费用",
    feePlaceholder: "免费或30,000韩元",
    capacity: "人数上限",
    about: "介绍",
    curriculum: "课程内容",
    saving: "保存中...",
    save: "保存",
    loginRequired: "需要登录",
    titleRequired: "请输入标题",
    success: "课程已更新",
    fail: "更新失败",
    notFound: "找不到课程",
    notOwner: "只有课程创建者可以编辑",
    back: "返回",
  },
  ru: {
    title: "Редактировать занятие",
    titleLabel: "Название *",
    category: "Категория",
    categoryPlaceholder: "Напр.: Кулинария",
    place: "Место",
    placePlaceholder: "Напр.: Сеул, Мапхогу",
    schedule: "Расписание",
    schedulePlaceholder: "Напр.: каждую субботу в 14:00",
    fee: "Стоимость",
    feePlaceholder: "Бесплатно или 30 000 KRW",
    capacity: "Вместимость",
    about: "Описание",
    curriculum: "Программа",
    saving: "Сохранение...",
    save: "Сохранить",
    loginRequired: "Необходимо войти",
    titleRequired: "Введите название",
    success: "Занятие обновлено",
    fail: "Не удалось обновить",
    notFound: "Занятие не найдено",
    notOwner: "Редактировать может только создатель занятия",
    back: "Назад",
  },
};

const ClassEdit = () => {
  const { id } = useParams();
  const classId = Number(id);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const copy = TEXT[lang] ?? TEXT.ko;
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    price: "",
    schedule: "",
    curriculum: "",
    max_students: 30,
  });

  const { data: cls, isLoading } = useQuery({
    queryKey: ["class-edit", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!cls) return;
    setForm({
      title: cls.title ?? "",
      category: cls.category ?? "",
      description: cls.description ?? "",
      location: cls.location ?? "",
      price: cls.price ?? "",
      schedule: cls.schedule ?? "",
      curriculum: cls.curriculum ?? "",
      max_students: cls.max_students ?? 30,
    });
  }, [cls]);

  const update = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(copy.loginRequired);
      if (!form.title.trim()) throw new Error(copy.titleRequired);
      const { error } = await supabase
        .from("classes")
        .update({
          title: form.title.trim(),
          category: normalizeClassCategory(form.category, form.title),
          description: form.description.trim() || null,
          location: form.location.trim() || null,
          price: form.price.trim() || "무료",
          schedule: form.schedule.trim() || null,
          curriculum: form.curriculum.trim() || null,
          max_students: form.max_students || null,
        })
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: copy.success });
      qc.invalidateQueries({ queryKey: ["class", classId] });
      qc.invalidateQueries({ queryKey: ["class-edit", classId] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      navigate(`/classes/${classId}`);
    },
    onError: (e: Error) => toast({ title: copy.fail, description: e.message, variant: "destructive" }),
  });

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background mx-auto max-w-md p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!cls) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{copy.notFound}</div>;
  }

  if (user && cls.instructor_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-muted-foreground">{copy.notOwner}</p>
        <Button onClick={() => navigate(`/classes/${classId}`)}>{copy.back}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-28">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label={copy.back}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">{copy.title}</h1>
        </header>

        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="px-4 py-4 space-y-4">
          <div><Label>{copy.titleLabel}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} required /></div>
          <div><Label>{copy.category}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={copy.categoryPlaceholder} /></div>
          <div><Label>{copy.place}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={copy.placePlaceholder} /></div>
          <div><Label>{copy.schedule}</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder={copy.schedulePlaceholder} /></div>
          <div><Label>{copy.fee}</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder={copy.feePlaceholder} /></div>
          <div><Label>{copy.capacity}</Label><Input type="number" min={1} max={500} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })} /></div>
          <div><Label>{copy.about}</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} /></div>
          <div><Label>{copy.curriculum}</Label><Textarea rows={3} value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} maxLength={2000} /></div>
        </form>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40 p-3">
        <Button onClick={() => update.mutate()} disabled={update.isPending} className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-glow hover:opacity-95">
          {update.isPending ? copy.saving : copy.save}
        </Button>
      </div>
    </div>
  );
};

export default ClassEdit;
