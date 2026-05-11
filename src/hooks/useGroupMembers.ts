import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { firstText, fullName, shortUserId } from "@/lib/userIdentity";

export type GroupMember = {
  userId: string;
  role: string | null;
  joinedAt: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  fallbackId: string | null;
  hasProfileName: boolean;
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
        const appFullName = fullName(u.first_name, u.last_name);
        const name = firstText(u.nickname, appFullName, u.email);
        profileMap.set(u.id, {
          userId: u.id,
          name,
          email: u.email ?? null,
          avatarUrl: u.profile_image_url ?? null,
          fallbackId: shortUserId(u.id),
          hasProfileName: !!name,
        });
      });

      (profiles ?? []).forEach((p) => {
        const existing = profileMap.get(p.id);
        const name = firstText(p.nickname, existing?.name, p.name, p.email, existing?.email);
        profileMap.set(p.id, {
          userId: p.id,
          name,
          email: p.email ?? existing?.email ?? null,
          avatarUrl: p.avatar_url ?? existing?.avatarUrl ?? null,
          fallbackId: shortUserId(p.id),
          hasProfileName: !!name,
        });
      });

      return (memberships ?? []).map((m) => {
        const profile = profileMap.get(m.user_id);
        const fallbackId = shortUserId(m.user_id);
        return {
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          name: profile?.name ?? "",
          email: profile?.email ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
          fallbackId,
          hasProfileName: profile?.hasProfileName ?? false,
        };
      });
    },
  });
};
