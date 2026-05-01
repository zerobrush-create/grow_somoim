import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["운동", "스터디", "취미", "맛집", "여행", "음악", "반려동물"];

const GroupCreate = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("취미");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!name.trim()) throw new Error("모임 이름을 입력해 주세요");

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          category,
          location: location.trim() || null,
          description: description.trim() || null,
          max_members: maxMembers ? Number(maxMembers) : null,
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
              placeholder="예: 주말엔 북클럽"
              maxLength={40}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">활동 지역</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 마포구"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max">정원 (선택)</Label>
            <Input
              id="max"
              type="number"
              min={1}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              placeholder="제한 없음"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">소개</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 모임인가요? 함께하면 좋을 분들을 알려주세요."
              rows={5}
              maxLength={500}
            />
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40 p-3">
            <Button
              type="submit"
              disabled={create.isPending || !name.trim()}
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
