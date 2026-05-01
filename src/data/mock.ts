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