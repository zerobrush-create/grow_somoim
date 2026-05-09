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
  rating: number;
  reviewCount: number;
  created_at: string;
};

const categoryMap: Record<string, string> = {
  exercise: "운동",
  study: "스터디",
  hobby: "취미",
  food: "맛집",
  travel: "여행",
  music: "음악",
  pet: "반려동물",
  language: "언어",
  culture: "문화",
  art: "예술",
  reading: "독서",
  movie: "영화",
  game: "게임",
  tech: "IT",
  business: "비즈니스",
  finance: "재테크",
  parenting: "육아",
  health: "건강",
  outdoor: "아웃도어",
  volunteer: "봉사",
  social: "친목",
  cooking: "요리",
  craft: "공예",
  beauty: "뷰티",
  dance: "댄스",
  meditation: "명상",
  writing: "글쓰기",
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
      let ratingMap: Record<string, { sum: number; count: number }> = {};
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
        const { data: reviews } = await supabase
          .from("group_reviews")
          .select("group_id,rating")
          .in("group_id", ids);
        ratingMap = (reviews ?? []).reduce<Record<string, { sum: number; count: number }>>((acc, r) => {
          const e = acc[r.group_id] ?? { sum: 0, count: 0 };
          e.sum += r.rating; e.count += 1; acc[r.group_id] = e; return acc;
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
        rating: ratingMap[g.id] ? +(ratingMap[g.id].sum / ratingMap[g.id].count).toFixed(1) : 0,
        reviewCount: ratingMap[g.id]?.count ?? 0,
        created_at: g.created_at,
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
