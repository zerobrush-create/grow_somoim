import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Users as UsersIcon, BookOpen, Flag, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const { data: roles } = useQuery({
    queryKey: ["admin-user-roles"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("user_roles").select("id,user_id,role,created_at").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("reports").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [u, g, c, dm] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("groups").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("direct_messages").select("id", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, groups: g.count ?? 0, classes: c.count ?? 0, dms: dm.count ?? 0 };
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "처리 완료" }); qc.invalidateQueries({ queryKey: ["admin-reports"] }); },
  });

  const [grantId, setGrantId] = useState("");
  const [grantRole, setGrantRole] = useState<"admin" | "instructor" | "member">("instructor");

  const grantRoleMut = useMutation({
    mutationFn: async () => {
      if (!grantId.trim()) throw new Error("user id를 입력하세요");
      const { error } = await supabase.from("user_roles").insert({ user_id: grantId.trim(), role: grantRole });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "역할이 부여되었어요" }); setGrantId(""); qc.invalidateQueries({ queryKey: ["admin-user-roles"] }); },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  const revokeRole = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("user_roles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-roles"] }),
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
    mutationFn: async ({ id, status, requesterId }: { id: number; status: "approved" | "rejected"; requesterId: string }) => {
      const { error } = await supabase.from("ad_requests").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        await supabase.from("banners").insert({
          title: "광고 배너 #" + id,
          type: "promo",
          is_active: false,
          order: 99,
          requester_id: requesterId,
        });
      }
    },
    onSuccess: () => {
      toast({ title: "처리 완료", description: "승인 시 비활성 배너가 생성됐어요" });
      qc.invalidateQueries({ queryKey: ["admin-ad-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from("banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const removeBanner = useMutation({
    mutationFn: async (id: number) => { const { error } = await supabase.from("banners").delete().eq("id", id); if (error) throw error; },
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

        <Tabs defaultValue="stats" className="p-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="reports">신고</TabsTrigger>
            <TabsTrigger value="manage">관리</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4 grid grid-cols-2 gap-2">
            {[
              { icon: UsersIcon, label: "전체 사용자", value: stats?.users, color: "bg-primary-soft text-primary" },
              { icon: UsersIcon, label: "모임", value: stats?.groups, color: "bg-accent/10 text-accent" },
              { icon: BookOpen, label: "클래스", value: stats?.classes, color: "bg-secondary text-secondary-foreground" },
              { icon: MessageSquare, label: "DM", value: stats?.dms, color: "bg-muted text-foreground" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="h-4 w-4" /></div>
                <p className="text-2xl font-bold mt-2">{s.value ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reports" className="space-y-2 mt-4">
            {reports?.length ? reports.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" />
                  <Badge variant={r.status === "pending" ? "secondary" : "outline"}>{r.status}</Badge>
                  <Badge variant="outline" className="ml-auto">{r.target_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">신고자: {r.reporter_id}</p>
                <p className="text-xs text-muted-foreground">대상: {r.target_id}</p>
                <p className="text-sm mt-1 whitespace-pre-line">{r.reason}</p>
                {r.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => updateReport.mutate({ id: r.id, status: "resolved" })}>해결</Button>
                    <Button size="sm" variant="outline" onClick={() => updateReport.mutate({ id: r.id, status: "rejected" })}>기각</Button>
                  </div>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">신고 내역이 없어요</p>}
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            <Tabs defaultValue="instructors">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="instructors">강사</TabsTrigger>
                <TabsTrigger value="ads">광고</TabsTrigger>
                <TabsTrigger value="banners">배너</TabsTrigger>
                <TabsTrigger value="roles">역할</TabsTrigger>
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
                    <Button size="sm" onClick={() => updateAd.mutate({ id: r.id, status: "approved", requesterId: r.requester_id })}>승인</Button>
                    <Button size="sm" variant="outline" onClick={() => updateAd.mutate({ id: r.id, status: "rejected", requesterId: r.requester_id })}>거절</Button>
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
                <Button size="sm" variant="outline" onClick={() => removeBanner.mutate(b.id)} className="text-destructive">삭제</Button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">배너가 없어요</p>}
          </TabsContent>

          <TabsContent value="roles" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-sm font-semibold">역할 부여</p>
              <Input placeholder="user_id (UUID)" value={grantId} onChange={(e) => setGrantId(e.target.value)} />
              <div className="flex gap-2">
                {(["admin", "instructor", "member"] as const).map((r) => (
                  <button key={r} onClick={() => setGrantRole(r)} className={`flex-1 py-1.5 rounded-md text-xs font-medium ${grantRole === r ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{r}</button>
                ))}
              </div>
              <Button size="sm" className="w-full" onClick={() => grantRoleMut.mutate()} disabled={grantRoleMut.isPending}>부여</Button>
            </div>
            {roles?.length ? roles.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{r.user_id}</p>
                  <Badge className="mt-1">{r.role}</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => revokeRole.mutate(r.id)}>해제</Button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-6">역할 데이터가 없어요</p>}
          </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;