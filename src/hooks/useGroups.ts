import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DbGroup = {
  id: string;
  name: string;
  category: string;
  location: string | null;
  image_url: string | null;
  description: string | null;
  max_members: number | null;
  members: number;
};

const categoryMap: Record<string, string> = {
  exercise: "운동",
  study: "스터디",
  hobby: "취미",
  food: "맛집",
  travel: "여행",
  music: "음악",
  pet: "반려동물",
};

export const mapCategoryFilter = (id: string) => categoryMap[id];

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<DbGroup[]> => {
      const { data: groups, error } = await supabase
        .from("groups")
        .select("id,name,category,location,image_url,description,max_members,status,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (groups ?? []).map((g) => g.id);
      let counts: Record<string, number> = {};
      if (ids.length) {
        const { data: members } = await supabase
          .from("memberships")
          .select("group_id")
          .in("group_id", ids)
          .eq("status", "approved");
        counts = (members ?? []).reduce<Record<string, number>>((acc, m) => {
          acc[m.group_id] = (acc[m.group_id] ?? 0) + 1;
          return acc;
        }, {});
      }

      return (groups ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        location: g.location,
        image_url: g.image_url,
        description: g.description,
        max_members: g.max_members,
        members: counts[g.id] ?? 0,
      }));
    },
  });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: ["group", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("id,name,category,location,image_url,description,max_members,owner_id")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { count } = await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", id!)
        .eq("status", "approved");
      return { ...data, members: count ?? 0 };
    },
  });
}
