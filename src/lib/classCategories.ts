export const CLASS_CATEGORY_IDS = ["공예", "쿠킹", "요가", "사진", "독서", "아웃도어", "기타"] as const;

export type ClassCategoryId = (typeof CLASS_CATEGORY_IDS)[number];

const CATEGORY_ALIASES: Record<ClassCategoryId, string[]> = {
  공예: ["공예", "craft", "crafts", "handmade", "diy", "도예", "뜨개", "수공예", "만들기"],
  쿠킹: ["쿠킹", "요리", "cooking", "cook", "culinary", "food", "베이킹", "baking", "디저트", "음식", "푸드"],
  요가: ["요가", "yoga", "필라테스", "pilates", "명상", "meditation"],
  사진: ["사진", "photo", "photography", "카메라", "촬영", "보정"],
  독서: ["독서", "reading", "book", "books", "책", "북클럽", "글쓰기", "writing"],
  아웃도어: ["아웃도어", "outdoor", "hiking", "camping", "등산", "캠핑", "러닝", "running", "운동", "스포츠"],
  기타: ["기타", "other", "etc", "misc"],
};

const compact = (value: string) => value.toLowerCase().replace(/\s+/g, "");

const inferFromText = (text: string): ClassCategoryId | null => {
  const normalized = compact(text);
  if (!normalized) return null;

  for (const id of CLASS_CATEGORY_IDS) {
    if (id === "기타") continue;
    if (CATEGORY_ALIASES[id].some((alias) => normalized.includes(compact(alias)))) {
      return id;
    }
  }

  return null;
};

export const normalizeClassCategory = (category?: string | null, title?: string | null): ClassCategoryId => {
  const byCategory = inferFromText(category ?? "");
  if (byCategory) return byCategory;

  const byTitle = inferFromText(title ?? "");
  if (byTitle) return byTitle;

  return "기타";
};
