import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Users as UsersIcon, BookOpen, Flag, MessageSquare, Download, TrendingUp, Search as SearchIcon, UserCog, Coins, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const sinceIso = useMemo(
    () => new Date(Date.now() - rangeDays * 86400000).toISOString(),
    [rangeDays],
  );

  const { data: trend } = useQuery({
    queryKey: ["admin-trend", rangeDays],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [users, groups, reports] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", sinceIso).limit(5000),
        supabase.from("groups").select("created_at").gte("created_at", sinceIso).limit(5000),
        supabase.from("reports").select("created_at").gte("created_at", sinceIso).limit(5000),
      ]);
      const buckets: Record<string, { date: string; users: number; groups: number; reports: number }> = {};
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        buckets[d] = { date: d.slice(5), users: 0, groups: 0, reports: 0 };
      }
      const bump = (rows: { created_at: string }[] | null, key: "users" | "groups" | "reports") => {
        (rows ?? []).forEach((r) => {
          const d = r.created_at.slice(0, 10);
          if (buckets[d]) buckets[d][key] += 1;
        });
      };
      bump(users.data as any, "users");
      bump(groups.data as any, "groups");
      bump(reports.data as any, "reports");
      return Object.values(buckets);
    },
  });

  const exportCsv = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) {
      toast({ title: "내보낼 데이터가 없어요", variant: "destructive" });
      return;
    }
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateReport = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "처리 완료" }); qc.invalidateQueries({ queryKey: ["admin-reports"] }); },
  });

  const [grantId, setGrantId] = useState("");
  const [grantRole, setGrantRole] = useState<"admin" | "instructor" | "member">("instructor");

  const [userSearch, setUserSearch] = useState("");
  const { data: foundUsers } = useQuery({
    queryKey: ["admin-user-search", userSearch],
    enabled: !!isAdmin && userSearch.trim().length >= 2,
    queryFn: async () => {
      const term = `%${userSearch.trim()}%`;
      const { data } = await supabase
        .from("profiles")
        .select("id,email,name,nickname,location,created_at")
        .or(`nickname.ilike.${term},email.ilike.${term},name.ilike.${term}`)
        .limit(20);
      return data ?? [];
    },
  });

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

  // 배너 생성
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerImageUrl, setNewBannerImageUrl] = useState("");
  const [newBannerLinkUrl, setNewBannerLinkUrl] = useState("");
  const [newBannerOrder, setNewBannerOrder] = useState("10");

  const createBanner = useMutation({
    mutationFn: async () => {
      if (!newBannerTitle.trim()) throw new Error("제목을 입력하세요");
      const { error } = await supabase.from("banners").insert({
        title: newBannerTitle.trim(),
        image_url: newBannerImageUrl.trim() || null,
        link_url: newBannerLinkUrl.trim() || null,
        order: parseInt(newBannerOrder) || 10,
        type: "promo",
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "배너가 생성되었어요" });
      setNewBannerTitle(""); setNewBannerImageUrl(""); setNewBannerLinkUrl(""); setNewBannerOrder("10");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  // 모임 관리
  const { data: allGroups } = useQuery({
    queryKey: ["admin-groups"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("groups").select("id,name,category,location,owner_id,created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const [groupSearch, setGroupSearch] = useState("");

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("groups").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast({ title: "모임이 삭제되었어요" }); qc.invalidateQueries({ queryKey: ["admin-groups"] }); },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  const filteredGroups = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();
    return term ? (allGroups ?? []).filter((g) => g.name?.toLowerCase().includes(term) || g.category?.toLowerCase().includes(term)) : (allGroups ?? []);
  }, [allGroups, groupSearch]);

  // 포인트 지급
  const [pointUserId, setPointUserId] = useState("");
  const [pointAmount, setPointAmount] = useState("");
  const [pointReason, setPointReason] = useState("");

  const grantPoints = useMutation({
    mutationFn: async () => {
      if (!pointUserId.trim()) throw new Error("유저 ID를 입력하세요");
      const amount = parseInt(pointAmount);
      if (!amount || isNaN(amount)) throw new Error("포인트 금액을 입력하세요");
      const { error } = await supabase.from("points").insert({
        user_id: pointUserId.trim(),
        amount,
        description: pointReason.trim() || "관리자 지급",
        type: "grant" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "포인트가 지급되었어요" });
      setPointUserId(""); setPointAmount(""); setPointReason("");
    },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
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
            <div className="col-span-2 bg-card rounded-2xl p-3 border border-border mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />가입·모임·신고 추이
                </h3>
                <div className="flex gap-1">
                  {([7, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setRangeDays(d)}
                      className={`text-[11px] px-2 py-1 rounded-md ${rangeDays === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >{d}일</button>
                  ))}
                </div>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend ?? []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g-users" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-groups" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#g-users)" name="가입" />
                    <Area type="monotone" dataKey="groups" stroke="hsl(var(--accent))" fill="url(#g-groups)" name="모임" />
                    <Area type="monotone" dataKey="reports" stroke="hsl(var(--destructive))" fill="transparent" name="신고" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-2 bg-card rounded-2xl p-3 border border-border">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Download className="h-4 w-4 text-primary" />CSV 내보내기
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("profiles").select("id,email,name,nickname,location,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `users_${rangeDays}d.csv`);
                }}>사용자</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("groups").select("id,name,category,location,owner_id,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `groups_${rangeDays}d.csv`);
                }}>모임</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("reports").select("id,reporter_id,target_type,target_id,reason,status,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `reports_${rangeDays}d.csv`);
                }}>신고</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("classes").select("id,title,category,instructor_id,price,status,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `classes_${rangeDays}d.csv`);
                }}>클래스</Button>
              </div>
            </div>
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
              <TabsList className="flex w-full overflow-x-auto gap-0.5 h-auto p-1">
                <TabsTrigger value="instructors" className="flex-shrink-0 text-xs px-3 py-1.5">강사</TabsTrigger>
                <TabsTrigger value="ads" className="flex-shrink-0 text-xs px-3 py-1.5">광고</TabsTrigger>
                <TabsTrigger value="banners" className="flex-shrink-0 text-xs px-3 py-1.5">배너</TabsTrigger>
                <TabsTrigger value="roles" className="flex-shrink-0 text-xs px-3 py-1.5">역할</TabsTrigger>
                <TabsTrigger value="users" className="flex-shrink-0 text-xs px-3 py-1.5">유저</TabsTrigger>
                <TabsTrigger value="groups" className="flex-shrink-0 text-xs px-3 py-1.5">모임</TabsTrigger>
                <TabsTrigger value="points" className="flex-shrink-0 text-xs px-3 py-1.5">포인트</TabsTrigger>
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
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-sm font-semibold">배너 직접 생성</p>
              <Input placeholder="제목 *" value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)} />
              <Input placeholder="이미지 URL (선택)" value={newBannerImageUrl} onChange={(e) => setNewBannerImageUrl(e.target.value)} />
              <Input placeholder="링크 URL (선택)" value={newBannerLinkUrl} onChange={(e) => setNewBannerLinkUrl(e.target.value)} />
              <Input placeholder="순서 (기본 10)" type="number" value={newBannerOrder} onChange={(e) => setNewBannerOrder(e.target.value)} />
              <Button size="sm" className="w-full" onClick={() => createBanner.mutate()} disabled={createBanner.isPending}>배너 생성</Button>
            </div>
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
            )) : <p className="text-center text-sm text-muted-foreground py-4">배너가 없어요</p>}
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

          <TabsContent value="users" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="닉네임·이메일·이름 검색 (2자 이상)"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            {userSearch.trim().length >= 2 ? (
              foundUsers && foundUsers.length > 0 ? (
                foundUsers.map((u) => (
                  <div key={u.id} className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-start gap-2">
                      <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(u.nickname ?? u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{u.nickname ?? u.name ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{u.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/users/${u.id}`)} className="flex-1">프로필</Button>
                      <Button size="sm" variant="outline" onClick={() => { setGrantId(u.id); toast({ title: "역할 부여 폼에 추가되었어요" }); }} className="gap-1">
                        <UserCog className="h-3.5 w-3.5" />역할
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setPointUserId(u.id); toast({ title: "포인트 폼에 추가되었어요" }); }} className="gap-1">
                        <Coins className="h-3.5 w-3.5" />포인트
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6">검색 결과가 없어요</p>
              )
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">닉네임·이메일·이름을 입력해 검색하세요</p>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="모임명·카테고리 검색" value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
              </div>
            </div>
            {filteredGroups.length > 0 ? filteredGroups.map((g) => (
              <div key={g.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{g.category}{g.location ? ` · ${g.location}` : ""}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{g.id}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive flex-shrink-0 gap-1"
                  onClick={() => { if (window.confirm(`"${g.name}" 모임을 삭제할까요?`)) deleteGroup.mutate(g.id); }}
                  disabled={deleteGroup.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />삭제
                </Button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">모임이 없어요</p>}
          </TabsContent>

          <TabsContent value="points" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" />포인트 지급</p>
              <Input placeholder="유저 UUID *" value={pointUserId} onChange={(e) => setPointUserId(e.target.value)} />
              <Input placeholder="포인트 (음수=차감) *" type="number" value={pointAmount} onChange={(e) => setPointAmount(e.target.value)} />
              <Input placeholder="사유 (기본: 관리자 지급)" value={pointReason} onChange={(e) => setPointReason(e.target.value)} />
              <Button size="sm" className="w-full" onClick={() => grantPoints.mutate()} disabled={grantPoints.isPending}>지급하기</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center px-2">유저 검색 탭에서 포인트 버튼을 누르면 UUID가 자동 입력됩니다.</p>
          </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;