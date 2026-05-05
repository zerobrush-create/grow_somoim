import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

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
  creating: string;
  create: string;
  loginRequired: string;
  titleRequired: string;
  success: string;
  fail: string;
  back: string;
}> = {
  ko: {
    title: "클래스 개설",
    titleLabel: "제목 *",
    category: "카테고리",
    categoryPlaceholder: "예: 공예",
    place: "장소",
    placePlaceholder: "예: 서울 마포구",
    schedule: "일정",
    schedulePlaceholder: "예: 매주 토요일 오후 2시",
    fee: "참가비",
    feePlaceholder: "무료 또는 30,000원",
    capacity: "정원",
    about: "소개",
    curriculum: "커리큘럼",
    creating: "등록 중...",
    create: "클래스 등록",
    loginRequired: "로그인이 필요합니다",
    titleRequired: "제목을 입력해주세요",
    success: "클래스가 등록되었어요",
    fail: "등록 실패",
    back: "뒤로",
  },
  en: {
    title: "Create class",
    titleLabel: "Title *",
    category: "Category",
    categoryPlaceholder: "e.g. Craft",
    place: "Place",
    placePlaceholder: "e.g. Seoul, Mapo-gu",
    schedule: "Schedule",
    schedulePlaceholder: "e.g. Every Saturday at 2 PM",
    fee: "Fee",
    feePlaceholder: "Free or 30,000 KRW",
    capacity: "Capacity",
    about: "About",
    curriculum: "Curriculum",
    creating: "Creating...",
    create: "Create class",
    loginRequired: "Login required",
    titleRequired: "Please enter a title",
    success: "Class created",
    fail: "Create failed",
    back: "Back",
  },
  ja: {
    title: "クラス開設",
    titleLabel: "タイトル *",
    category: "カテゴリー",
    categoryPlaceholder: "例：工芸",
    place: "場所",
    placePlaceholder: "例：東京",
    schedule: "スケジュール",
    schedulePlaceholder: "例：毎週土曜日 午後2時",
    fee: "参加費",
    feePlaceholder: "無料または30,000ウォン",
    capacity: "定員",
    about: "紹介",
    curriculum: "カリキュラム",
    creating: "登録中...",
    create: "クラスを登録",
    loginRequired: "ログインが必要です",
    titleRequired: "タイトルを入力してください",
    success: "クラスを登録しました",
    fail: "登録に失敗しました",
    back: "戻る",
  },
  zh: {
    title: "开设课程",
    titleLabel: "标题 *",
    category: "分类",
    categoryPlaceholder: "例：手工",
    place: "地点",
    placePlaceholder: "例：首尔麻浦区",
    schedule: "日程",
    schedulePlaceholder: "例：每周六下午2点",
    fee: "费用",
    feePlaceholder: "免费或30,000韩元",
    capacity: "人数上限",
    about: "介绍",
    curriculum: "课程内容",
    creating: "发布中...",
    create: "发布课程",
    loginRequired: "需要登录",
    titleRequired: "请输入标题",
    success: "课程已发布",
    fail: "发布失败",
    back: "返回",
  },
  ru: {
    title: "Создать занятие",
    titleLabel: "Название *",
    category: "Категория",
    categoryPlaceholder: "Напр.: Ремесло",
    place: "Место",
    placePlaceholder: "Напр.: Сеул, Мапхогу",
    schedule: "Расписание",
    schedulePlaceholder: "Напр.: каждую субботу в 14:00",
    fee: "Стоимость",
    feePlaceholder: "Бесплатно или 30 000 KRW",
    capacity: "Вместимость",
    about: "Описание",
    curriculum: "Программа",
    creating: "Создание...",
    create: "Создать занятие",
    loginRequired: "Необходимо войти",
    titleRequired: "Введите название",
    success: "Занятие создано",
    fail: "Не удалось создать",
    back: "Назад",
  },
};

const ClassCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const copy = TEXT[lang];
  const [form, setForm] = useState({ title: "", category: "", description: "", location: "", price: "", schedule: "", curriculum: "", max_students: 30 });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(copy.loginRequired);
      if (!form.title.trim()) throw new Error(copy.titleRequired);
      const { data, error } = await supabase.from("classes").insert({
        instructor_id: user.id,
        title: form.title.trim(),
        category: form.category || null,
        description: form.description || null,
        location: form.location || null,
        price: form.price || "무료",
        schedule: form.schedule || null,
        curriculum: form.curriculum || null,
        max_students: form.max_students,
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => { toast({ title: copy.success }); navigate(`/classes/${d.id}`); },
    onError: (e: Error) => toast({ title: copy.fail, description: e.message, variant: "destructive" }),
  });

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header data-i18n-skip className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label={copy.back}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">{copy.title}</h1>
        </header>

        <form data-i18n-skip onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="px-4 py-4 space-y-4">
          <div><Label>{copy.titleLabel}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} required /></div>
          <div><Label>{copy.category}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={copy.categoryPlaceholder} /></div>
          <div><Label>{copy.place}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={copy.placePlaceholder} /></div>
          <div><Label>{copy.schedule}</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder={copy.schedulePlaceholder} /></div>
          <div><Label>{copy.fee}</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder={copy.feePlaceholder} /></div>
          <div><Label>{copy.capacity}</Label><Input type="number" min={1} max={500} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })} /></div>
          <div><Label>{copy.about}</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} /></div>
          <div><Label>{copy.curriculum}</Label><Textarea rows={3} value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} maxLength={2000} /></div>
          <Button type="submit" disabled={create.isPending} className="w-full gradient-primary h-12 text-base font-bold">
            {create.isPending ? copy.creating : copy.create}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClassCreate;
