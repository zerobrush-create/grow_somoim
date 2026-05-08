export const CLASS_CATEGORY_IDS = [
  "공예", "쿠킹", "요가", "사진", "독서", "아웃도어", "운동", "음악", "미술", "언어", "IT", "비즈니스",
  "재테크", "댄스", "명상", "글쓰기", "영화", "게임", "뷰티", "육아", "봉사", "건강", "기타",
] as const;

export type ClassCategoryId = (typeof CLASS_CATEGORY_IDS)[number];

const CATEGORY_ALIASES: Record<ClassCategoryId, string[]> = {
  공예: ["공예", "craft", "crafts", "handmade", "diy", "도예", "뜨개", "수공예", "만들기"],
  쿠킹: ["쿠킹", "요리", "cooking", "cook", "culinary", "food", "베이킹", "baking", "디저트", "음식", "푸드"],
  요가: ["요가", "yoga", "필라테스", "pilates", "명상", "meditation"],
  사진: ["사진", "photo", "photography", "카메라", "촬영", "보정"],
  독서: ["독서", "reading", "book", "books", "책", "북클럽", "글쓰기", "writing"],
  아웃도어: ["아웃도어", "outdoor", "hiking", "camping", "등산", "캠핑", "러닝", "running", "운동", "스포츠"],
  운동: ["운동", "exercise", "fitness", "workout", "헬스", "sports", "스포츠", "러닝", "running"],
  음악: ["음악", "music", "보컬", "vocal", "기타", "피아노", "밴드", "악기"],
  미술: ["미술", "art", "drawing", "painting", "그림", "드로잉", "페인팅", "일러스트"],
  언어: ["언어", "language", "영어", "english", "일본어", "중국어", "한국어", "회화"],
  IT: ["it", "개발", "코딩", "coding", "programming", "프로그래밍", "ai", "데이터", "컴퓨터"],
  비즈니스: ["비즈니스", "business", "창업", "startup", "마케팅", "기획", "브랜딩"],
  재테크: ["재테크", "finance", "investment", "투자", "주식", "부동산", "경제"],
  댄스: ["댄스", "dance", "춤", "kpop", "케이팝"],
  명상: ["명상", "meditation", "마음챙김", "힐링", "호흡"],
  글쓰기: ["글쓰기", "writing", "작문", "에세이", "essay", "시", "소설"],
  영화: ["영화", "movie", "film", "cinema", "영상", "비디오"],
  게임: ["게임", "game", "gaming", "보드게임", "boardgame", "e스포츠"],
  뷰티: ["뷰티", "beauty", "메이크업", "makeup", "헤어", "스타일"],
  육아: ["육아", "parenting", "키즈", "아이", "부모", "family"],
  봉사: ["봉사", "volunteer", "자원봉사", "나눔", "기부"],
  건강: ["건강", "health", "웰니스", "wellness", "영양", "식단"],
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
