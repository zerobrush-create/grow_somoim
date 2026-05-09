import bookclub from "@/assets/group-bookclub.jpg";
import hiking from "@/assets/group-hiking.jpg";
import yoga from "@/assets/group-yoga.jpg";
import photo from "@/assets/group-photo.jpg";
import pottery from "@/assets/class-pottery.jpg";
import cooking from "@/assets/class-cooking.jpg";

export type Group = {
  id: string;
  name: string;
  category: string;
  location: string;
  members: number;
  image: string;
  description: string;
  tags: string[];
  hot?: boolean;
  new?: boolean;
};

export type ClassItem = {
  id: string;
  title: string;
  category: string;
  host: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  location: string;
};

export type ChatItem = {
  id: string;
  groupName: string;
  lastMessage: string;
  time: string;
  unread: number;
  image: string;
};

export const categories = [
  { id: "all", label: "전체", emoji: "✨" },
  { id: "exercise", label: "운동", emoji: "🏃" },
  { id: "study", label: "스터디", emoji: "📚" },
  { id: "hobby", label: "취미", emoji: "🎨" },
  { id: "food", label: "맛집", emoji: "🍱" },
  { id: "travel", label: "여행", emoji: "✈️" },
  { id: "music", label: "음악", emoji: "🎵" },
  { id: "pet", label: "반려동물", emoji: "🐾" },
  { id: "language", label: "언어", emoji: "🗣️" },
  { id: "culture", label: "문화", emoji: "🏛️" },
  { id: "art", label: "예술", emoji: "🖼️" },
  { id: "reading", label: "독서", emoji: "📖" },
  { id: "movie", label: "영화", emoji: "🎬" },
  { id: "game", label: "게임", emoji: "🎮" },
  { id: "tech", label: "IT", emoji: "💻" },
  { id: "business", label: "비즈니스", emoji: "💼" },
  { id: "finance", label: "재테크", emoji: "💰" },
  { id: "parenting", label: "육아", emoji: "👶" },
  { id: "health", label: "건강", emoji: "🧘" },
  { id: "outdoor", label: "아웃도어", emoji: "⛰️" },
  { id: "volunteer", label: "봉사", emoji: "🤝" },
  { id: "social", label: "친목", emoji: "🥂" },
  { id: "cooking", label: "요리", emoji: "🍳" },
  { id: "craft", label: "공예", emoji: "🧶" },
  { id: "beauty", label: "뷰티", emoji: "💄" },
  { id: "dance", label: "댄스", emoji: "💃" },
  { id: "meditation", label: "명상", emoji: "🪷" },
  { id: "writing", label: "글쓰기", emoji: "✍️" },
];

export const groups: Group[] = [
  {
    id: "1",
    name: "주말엔 북클럽",
    category: "스터디",
    location: "서울 마포구",
    members: 142,
    image: bookclub,
    description: "한 달에 한 권, 함께 읽고 따뜻하게 이야기 나눠요. 책을 좋아하는 누구나 환영합니다.",
    tags: ["독서", "토론", "주말"],
    hot: true,
  },
  {
    id: "2",
    name: "북한산 등산크루",
    category: "운동",
    location: "서울 은평구",
    members: 328,
    image: hiking,
    description: "매주 토요일 아침, 함께 산에 오르며 건강과 우정을 챙겨요.",
    tags: ["등산", "아웃도어", "건강"],
    hot: true,
  },
  {
    id: "3",
    name: "모닝 요가 모임",
    category: "운동",
    location: "서울 성동구",
    members: 87,
    image: yoga,
    description: "하루를 가볍게 시작하는 모닝 요가. 초보자 환영해요.",
    tags: ["요가", "명상", "아침"],
    new: true,
  },
  {
    id: "4",
    name: "사진찍는 사람들",
    category: "취미",
    location: "서울 종로구",
    members: 215,
    image: photo,
    description: "도시 곳곳을 함께 다니며 사진을 찍어요. 카메라 종류 무관!",
    tags: ["사진", "출사", "감성"],
  },
  {
    id: "5",
    name: "수요일엔 도자기",
    category: "취미",
    location: "서울 용산구",
    members: 64,
    image: pottery,
    description: "손으로 빚는 시간. 일주일의 피로를 도자기와 함께 풀어요.",
    tags: ["공예", "힐링", "원데이"],
    new: true,
  },
  {
    id: "6",
    name: "맛있는 파스타 클래스",
    category: "맛집",
    location: "서울 강남구",
    members: 110,
    image: cooking,
    description: "직접 만들어 먹는 정통 이탈리안. 매주 다른 메뉴가 기다려요.",
    tags: ["요리", "이탈리안", "친목"],
  },
];

export const classes: ClassItem[] = [
  { id: "c1", title: "처음 만드는 나만의 머그컵", category: "공예", host: "도예공방 흙", price: 45000, rating: 4.9, reviews: 128, image: pottery, location: "서울 용산구" },
  { id: "c2", title: "정통 이탈리안 파스타 만들기", category: "쿠킹", host: "셰프 김민수", price: 68000, rating: 4.8, reviews: 96, image: cooking, location: "서울 강남구" },
  { id: "c3", title: "초보를 위한 모닝 요가", category: "요가", host: "요가스튜디오 숨", price: 25000, rating: 5.0, reviews: 213, image: yoga, location: "서울 성동구" },
  { id: "c4", title: "감성 사진 클래스", category: "사진", host: "포토그래퍼 윤", price: 55000, rating: 4.7, reviews: 74, image: photo, location: "서울 종로구" },
  { id: "c5", title: "북한산 가이드 트레킹", category: "아웃도어", host: "산타는사람들", price: 35000, rating: 4.9, reviews: 152, image: hiking, location: "서울 은평구" },
  { id: "c6", title: "함께 읽는 인문학 살롱", category: "독서", host: "북클럽 매개", price: 18000, rating: 4.8, reviews: 67, image: bookclub, location: "서울 마포구" },
];

export const chats: ChatItem[] = [
  { id: "1", groupName: "주말엔 북클럽", lastMessage: "이번 주 책은 이거 어때요?", time: "방금", unread: 3, image: bookclub },
  { id: "2", groupName: "북한산 등산크루", lastMessage: "토요일 7시 불광역 만나요!", time: "10분 전", unread: 0, image: hiking },
  { id: "3", groupName: "모닝 요가 모임", lastMessage: "내일도 화이팅 🧘‍♀️", time: "1시간 전", unread: 1, image: yoga },
  { id: "4", groupName: "사진찍는 사람들", lastMessage: "사진 너무 잘 나왔어요!", time: "어제", unread: 0, image: photo },
  { id: "5", groupName: "수요일엔 도자기", lastMessage: "다음 클래스 일정 공유드려요", time: "어제", unread: 0, image: pottery },
];

export const messages = [
  { id: 1, sender: "지영", text: "안녕하세요! 이번 주 북클럽 책 정해볼까요?", time: "오후 2:14", isMine: false },
  { id: 2, sender: "민준", text: "저는 무라카미 하루키 신간 추천해요!", time: "오후 2:16", isMine: false },
  { id: 3, sender: "나", text: "오 좋아요! 저도 그거 읽고 싶었어요 😊", time: "오후 2:18", isMine: true },
  { id: 4, sender: "지영", text: "그럼 토요일 카페에서 만나요~", time: "오후 2:20", isMine: false },
  { id: 5, sender: "나", text: "넵! 시간 알려주세요", time: "오후 2:21", isMine: true },
];

export type GroupEvent = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  myStatus: "attending" | "not_attending" | "maybe" | null;
  type: "regular" | "special";
};

export type BoardPost = {
  id: string;
  groupId: string;
  author: string;
  authorInitial: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  isPinned?: boolean;
  liked: boolean;
};

export type GroupPhoto = {
  id: string;
  groupId: string;
  image: string;
  author: string;
  time: string;
};

export type Announcement = {
  id: string;
  groupId: string;
  title: string;
  content: string;
  author: string;
  time: string;
  important?: boolean;
};

export type ClassReview = {
  id: string;
  classId: string;
  author: string;
  rating: number;
  content: string;
  time: string;
  likes: number;
  liked: boolean;
};

export type DirectMessage = {
  id: string;
  userName: string;
  userInitial: string;
  lastMessage: string;
  time: string;
  unread: number;
};

export type UserProfile = {
  name: string;
  location: string;
  mbti: string;
  bio: string;
  interests: string[];
  groupCount: number;
  classCount: number;
  points: number;
  referralCode: string;
};

export const events: GroupEvent[] = [
  { id: "e1", groupId: "1", title: "5월 정기 독서 모임", date: "5월 10일", time: "토요일 오후 2시", location: "연남동 카페 봄날", attendees: 12, myStatus: "attending", type: "regular" },
  { id: "e2", groupId: "1", title: "북클럽 특별 작가 초청", date: "5월 24일", time: "토요일 오후 3시", location: "마포구 서점 사이", attendees: 28, myStatus: null, type: "special" },
  { id: "e3", groupId: "2", title: "북한산 봄 트레킹", date: "5월 11일", time: "토요일 오전 7시", location: "불광역 1번 출구", attendees: 45, myStatus: "attending", type: "regular" },
  { id: "e4", groupId: "2", title: "야간 인왕산 산행", date: "5월 25일", time: "토요일 오후 7시", location: "경복궁역 3번 출구", attendees: 22, myStatus: null, type: "special" },
  { id: "e5", groupId: "3", title: "모닝 요가 정기 모임", date: "5월 8일", time: "목요일 오전 7시", location: "성동구 요가스튜디오", attendees: 16, myStatus: "maybe", type: "regular" },
  { id: "e6", groupId: "4", title: "서촌 사진 출사", date: "5월 17일", time: "토요일 오후 4시", location: "경복궁 서쪽 골목", attendees: 19, myStatus: null, type: "regular" },
];

export const boardPosts: BoardPost[] = [
  { id: "b1", groupId: "1", author: "지영", authorInitial: "지", content: "이번 달 책 추천 받아요! 소설이든 비소설이든 환영합니다 📚 다들 요즘 어떤 책 읽고 있나요?", likes: 14, comments: 8, time: "2시간 전", liked: false },
  { id: "b2", groupId: "1", author: "민준", authorInitial: "민", content: "지난 모임 후기 남겨요~ 무라카미 하루키 토론 정말 재밌었습니다. 다들 의견이 너무 다양해서 흥미로웠어요! 다음 달도 기대됩니다.", likes: 23, comments: 5, time: "어제", isPinned: true, liked: true },
  { id: "b3", groupId: "1", author: "수진", authorInitial: "수", content: "다음 모임 장소 추천 있으신 분? 혜화 쪽도 좋을 것 같아요. 조용하고 분위기 있는 카페 아시는 분!", likes: 7, comments: 12, time: "3일 전", liked: false },
  { id: "b4", groupId: "2", author: "태현", authorInitial: "태", content: "지난 주 북한산 후기! 날씨가 너무 좋아서 정상에서 뷰가 장관이었어요. 다음 번에도 같이 가요 🏔️", likes: 31, comments: 9, time: "4일 전", isPinned: true, liked: false },
  { id: "b5", groupId: "2", author: "혜린", authorInitial: "혜", content: "등산화 추천 부탁드려요! 초보인데 어떤 걸 사야 할지 모르겠어요 😅", likes: 5, comments: 15, time: "1주일 전", liked: false },
];

export const groupPhotos: GroupPhoto[] = [
  { id: "p1", groupId: "1", image: bookclub, author: "지영", time: "5월 3일" },
  { id: "p2", groupId: "1", image: yoga, author: "민준", time: "4월 27일" },
  { id: "p3", groupId: "1", image: photo, author: "수진", time: "4월 20일" },
  { id: "p4", groupId: "1", image: cooking, author: "태현", time: "4월 15일" },
  { id: "p5", groupId: "1", image: pottery, author: "지영", time: "4월 10일" },
  { id: "p6", groupId: "1", image: hiking, author: "민준", time: "4월 5일" },
  { id: "p7", groupId: "2", image: hiking, author: "태현", time: "5월 4일" },
  { id: "p8", groupId: "2", image: photo, author: "혜린", time: "4월 26일" },
  { id: "p9", groupId: "2", image: bookclub, author: "민준", time: "4월 19일" },
];

export const announcements: Announcement[] = [
  { id: "a1", groupId: "1", title: "5월 모임 일정 안내", content: "안녕하세요! 5월 정기 모임은 10일(토) 오후 2시, 연남동 카페 봄날에서 진행됩니다. 많이 참여해 주세요 😊", author: "지영(리더)", time: "3일 전", important: true },
  { id: "a2", groupId: "1", title: "신규 멤버 환영!", content: "이번 달 새로 가입하신 분들 환영합니다. 부담 없이 첫 모임에 참여해 보세요. 질문은 채팅으로 언제든지!", author: "지영(리더)", time: "1주일 전" },
  { id: "a3", groupId: "1", title: "모임 규칙 안내", content: "모임 3회 이상 무단 불참 시 자동 탈퇴될 수 있습니다. 불참 시 미리 알려주세요!", author: "지영(리더)", time: "2주일 전" },
  { id: "a4", groupId: "2", title: "6월 특별 산행 예고", content: "6월에 지리산 1박 2일 특별 산행을 계획 중입니다. 관심 있으신 분들 미리 댓글 남겨주세요!", author: "태현(리더)", time: "5일 전", important: true },
];

export const classReviews: ClassReview[] = [
  { id: "r1", classId: "c1", author: "지영", rating: 5, content: "처음 도자기를 만들어봤는데 강사님이 정말 친절하게 알려주셔서 완성도 높은 머그컵 만들었어요!", likes: 24, time: "3일 전", liked: false },
  { id: "r2", classId: "c1", author: "민준", rating: 5, content: "힐링 그 자체였어요. 흙을 만지면서 머릿속이 깨끗해지는 느낌! 강력 추천합니다.", likes: 18, time: "1주일 전", liked: true },
  { id: "r3", classId: "c1", author: "수진", rating: 4, content: "재밌었어요! 다음에 또 오고 싶어요. 다만 시간이 조금 짧은 느낌이었어요.", likes: 9, time: "2주일 전", liked: false },
  { id: "r4", classId: "c2", author: "태현", rating: 5, content: "파스타가 이렇게 쉽게 만들어진다는 게 놀라웠어요! 집에서도 해봤는데 성공했습니다.", likes: 31, time: "5일 전", liked: false },
  { id: "r5", classId: "c2", author: "혜린", rating: 5, content: "셰프님 설명이 너무 명확해서 처음 요리하는 사람도 쉽게 따라할 수 있었어요.", likes: 22, time: "1주일 전", liked: false },
  { id: "r6", classId: "c3", author: "지영", rating: 5, content: "아침 요가로 하루를 시작하니 컨디션이 완전히 달라졌어요. 강사님이 너무 좋으세요!", likes: 41, time: "2일 전", liked: true },
  { id: "r7", classId: "c3", author: "민준", rating: 5, content: "초보도 쉽게 따라할 수 있어서 좋았어요. 매주 오고 싶어요.", likes: 28, time: "1주일 전", liked: false },
  { id: "r8", classId: "c4", author: "수진", rating: 4, content: "감성 사진 찍는 법을 배웠어요. SNS 올리니까 반응 폭발했어요 📸", likes: 19, time: "4일 전", liked: false },
  { id: "r9", classId: "c5", author: "태현", rating: 5, content: "가이드가 있으니 훨씬 안전하고 즐거운 산행이었어요!", likes: 35, time: "3일 전", liked: false },
  { id: "r10", classId: "c6", author: "혜린", rating: 5, content: "인문학을 이렇게 재밌게 배울 수 있다니! 매달 기다려지는 살롱이에요.", likes: 17, time: "6일 전", liked: false },
];

export const directMessages: DirectMessage[] = [
  { id: "dm1", userName: "지영", userInitial: "지", lastMessage: "토요일 모임에서 봐요! 😊", time: "방금", unread: 1 },
  { id: "dm2", userName: "민준", userInitial: "민", lastMessage: "책 추천 감사해요~", time: "30분 전", unread: 0 },
  { id: "dm3", userName: "수진", userInitial: "수", lastMessage: "같이 요가 클래스 들을래요?", time: "2시간 전", unread: 2 },
  { id: "dm4", userName: "태현", userInitial: "태", lastMessage: "다음 주 등산 어때요?", time: "어제", unread: 0 },
  { id: "dm5", userName: "혜린", userInitial: "혜", lastMessage: "좋아요!", time: "어제", unread: 0 },
];

export const dmMessages = [
  { id: 1, sender: "지영", text: "안녕하세요! 이번 모임에 오시나요?", time: "오후 3:10", isMine: false },
  { id: 2, sender: "나", text: "네! 꼭 갈게요 😊", time: "오후 3:12", isMine: true },
  { id: 3, sender: "지영", text: "좋아요~ 토요일 모임에서 봐요!", time: "오후 3:13", isMine: false },
];

export type Store = {
  id: string;
  name: string;
  category: string;
  address: string;
  discount: string;
};

export type PointTransaction = {
  id: string;
  type: "earn" | "use" | "donate";
  amount: number;
  description: string;
  date: string;
};

export const stores: Store[] = [
  { id: "s1", name: "연남동 카페 봄날", category: "카페", address: "서울 마포구 연남동", discount: "음료 10% 할인" },
  { id: "s2", name: "북클럽 서점 사이", category: "서점", address: "서울 마포구", discount: "도서 5% 할인" },
  { id: "s3", name: "요가스튜디오 숨", category: "요가", address: "서울 성동구", discount: "클래스 1회 무료" },
  { id: "s4", name: "도예공방 흙", category: "공방", address: "서울 용산구", discount: "재료비 20% 할인" },
  { id: "s5", name: "힐링팜 레스토랑", category: "식당", address: "서울 강남구", discount: "식사 1인 무료" },
];

export const pointTransactions: PointTransaction[] = [
  { id: "pt1", type: "earn", amount: 1000, description: "회원가입 보너스", date: "2025.04.01" },
  { id: "pt2", type: "earn", amount: 500, description: "친구 초대 보너스 (지영)", date: "2025.04.10" },
  { id: "pt3", type: "use", amount: 2000, description: "연남동 카페 봄날 결제", date: "2025.04.15" },
  { id: "pt4", type: "earn", amount: 3000, description: "모임 활동 보너스", date: "2025.04.20" },
  { id: "pt5", type: "use", amount: 500, description: "서점 사이 결제", date: "2025.04.25" },
  { id: "pt6", type: "earn", amount: 2500, description: "클래스 수강 완료 보너스", date: "2025.05.01" },
];

export const userProfile: UserProfile = {
  name: "강원기",
  location: "서울 마포구",
  mbti: "ENFP",
  bio: "독서와 요가를 즐기는 직장인. 새로운 사람 만나는 걸 좋아해요 🌱",
  interests: ["독서", "요가", "사진", "맛집탐방", "등산"],
  groupCount: 3,
  classCount: 2,
  points: 4500,
  referralCode: "GROW-WONKI",
};
