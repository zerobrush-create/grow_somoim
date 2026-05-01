import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: instructorApps } = useQuery({
    queryKey: ["admin-instructor-apps"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("instructor_applications").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: adRequests } = useQuery({
    queryKey: ["admin-ad-requests"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("ad_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: banners } = useQuery({
    queryKey: ["admin-banners"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("banners").select("*").order("order")).data ?? [],
  });

  const updateApp = useMutation({
    mutationFn: async ({ id, status, applicantId }: { id: number; status: "approved" | "rejected"; applicantId: string }) => {
      const { error } = await supabase.from("instructor_applications").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        await supabase.from("user_roles").insert({ user_id: applicantId, role: "instructor" }).select();
      }
    },
    onSuccess: () => { toast({ title: "처리 완료" }); qc.invalidateQueries({ queryKey: ["admin-instructor-apps"] }); },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  const updateAd = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("ad_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "처리 완료" }); qc.invalidateQueries({ queryKey: ["admin-ad-requests"] }); },
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from("banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  if (loading || roleLoading) return <div className="p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>;
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">관리자 권한이 필요해요</p>
        <Button variant="outline" onClick={() => navigate("/")}>홈으로</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">관리자</h1>
        </header>

        <Tabs defaultValue="instructors" className="p-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="instructors">강사 신청</TabsTrigger>
            <TabsTrigger value="ads">광고 요청</TabsTrigger>
            <TabsTrigger value="banners">배너</TabsTrigger>
          </TabsList>

          <TabsContent value="instructors" className="space-y-2 mt-4">
            {instructorApps?.length ? instructorApps.map((a) => (
              <div key={a.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{a.applicant_id}</p>
                  <Badge className="mt-1" variant={a.status === "pending" ? "secondary" : "outline"}>{a.status}</Badge>
                </div>
                {a.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateApp.mutate({ id: a.id, status: "approved", applicantId: a.applicant_id })}>승인</Button>
                    <Button size="sm" variant="outline" onClick={() => updateApp.mutate({ id: a.id, status: "rejected", applicantId: a.applicant_id })}>거절</Button>
                  </>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">신청 내역이 없어요</p>}
          </TabsContent>

          <TabsContent value="ads" className="space-y-2 mt-4">
            {adRequests?.length ? adRequests.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{r.requester_id}</p>
                  <Badge className="mt-1" variant="secondary">{r.status}</Badge>
                </div>
                {r.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateAd.mutate({ id: r.id, status: "approved" })}>승인</Button>
                    <Button size="sm" variant="outline" onClick={() => updateAd.mutate({ id: r.id, status: "rejected" })}>거절</Button>
                  </>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">광고 요청이 없어요</p>}
          </TabsContent>

          <TabsContent value="banners" className="space-y-2 mt-4">
            {banners?.length ? banners.map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                {b.image_url && <img src={b.image_url} alt={b.title} className="h-12 w-12 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{b.title}</p>
                  <p className="text-[11px] text-muted-foreground">순서 {b.order} · {b.type}</p>
                </div>
                <Button size="sm" variant={b.is_active ? "default" : "outline"} onClick={() => toggleBanner.mutate({ id: b.id, is_active: !b.is_active })}>
                  {b.is_active ? "활성" : "비활성"}
                </Button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">배너가 없어요</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;