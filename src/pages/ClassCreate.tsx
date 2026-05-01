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

const ClassCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", category: "", description: "", location: "", price: "무료", schedule: "", curriculum: "", max_students: 30 });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!form.title.trim()) throw new Error("제목을 입력해주세요");
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
    onSuccess: (d) => { toast({ title: "클래스가 등록되었어요" }); navigate(`/classes/${d.id}`); },
    onError: (e: Error) => toast({ title: "등록 실패", description: e.message, variant: "destructive" }),
  });

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">클래스 개설</h1>
        </header>

        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="px-4 py-4 space-y-4">
          <div><Label>제목 *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} required /></div>
          <div><Label>카테고리</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="예: 공예" /></div>
          <div><Label>장소</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>일정</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="예: 매주 토요일 오후 2시" /></div>
          <div><Label>참가비</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="무료 또는 30,000원" /></div>
          <div><Label>정원</Label><Input type="number" min={1} max={500} value={form.max_students} onChange={(e) => setForm({ ...form, max_students: Number(e.target.value) })} /></div>
          <div><Label>소개</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} /></div>
          <div><Label>커리큘럼</Label><Textarea rows={3} value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} maxLength={2000} /></div>
          <Button type="submit" disabled={create.isPending} className="w-full gradient-primary h-12 text-base font-bold">
            {create.isPending ? "등록 중..." : "클래스 등록"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClassCreate;
