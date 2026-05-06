import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GroupMember = {
  userId: string;
  role: string | null;
  joinedAt: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export const useGroupMembers = (groupId?: string) => {
  return useQuery({
    queryKey: ["group-members", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("user_id,role,joined_at")
        .eq("group_id", groupId!)
        .eq("status", "approved")
        .order("joined_at", { ascending: true });

      if (error) throw error;

      const userIds = Array.from(new Set((memberships ?? []).map((m) => m.user_id).filter(Boolean)));
      if (userIds.length === 0) return [];

      const [{ data: profiles }, { data: appUsers }] = await Promise.all([
        supabase.from("profiles").select("id,name,nickname,avatar_url,email").in("id", userIds),
        supabase.from("users").select("id,nickname,email,first_name,last_name,profile_image_url").in("id", userIds),
      ]);

      const profileMap = new Map<string, Omit<GroupMember, "role" | "joinedAt">>();

      (appUsers ?? []).forEach((u) => {
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
        profileMap.set(u.id, {
          userId: u.id,
          name: u.nickname || fullName || u.email || "사용자",
          email: u.email,
          avatarUrl: u.profile_image_url,
        });
      });

      (profiles ?? []).forEach((p) => {
        profileMap.set(p.id, {
          userId: p.id,
          name: p.name || p.nickname || p.email || "사용자",
          email: p.email,
          avatarUrl: p.avatar_url,
        });
      });

      return (memberships ?? []).map((m) => {
        const profile = profileMap.get(m.user_id);
        return {
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          name: profile?.name ?? "사용자",
          email: profile?.email ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        };
      });
    },
  });
};
