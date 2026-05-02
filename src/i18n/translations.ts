export type Language = "ko" | "en";

export const translations = {
  ko: {
    nav: { home: "홈", groups: "소모임", classes: "클래스", chat: "채팅", profile: "내정보" },
    profile: { title: "내 정보", logout: "로그아웃", withdraw: "회원 탈퇴", darkMode: "다크모드", language: "언어" },
    common: { loading: "불러오는 중...", back: "뒤로", cancel: "취소", confirm: "확인", save: "저장", send: "전송", search: "검색" },
    chat: { placeholder: "메시지 입력...", online: "온라인", offline: "오프라인", lastSeen: "마지막 접속", typing: "입력 중..." },
    event: { reminder: "리마인더", reminderSet: "리마인더 설정됨", reminderCleared: "리마인더 해제", inOneHour: "1시간 후 시작" },
  },
  en: {
    nav: { home: "Home", groups: "Groups", classes: "Classes", chat: "Chat", profile: "Profile" },
    profile: { title: "My Profile", logout: "Sign Out", withdraw: "Delete Account", darkMode: "Dark Mode", language: "Language" },
    common: { loading: "Loading...", back: "Back", cancel: "Cancel", confirm: "Confirm", save: "Save", send: "Send", search: "Search" },
    chat: { placeholder: "Type a message...", online: "Online", offline: "Offline", lastSeen: "Last seen", typing: "typing..." },
    event: { reminder: "Reminder", reminderSet: "Reminder set", reminderCleared: "Reminder cleared", inOneHour: "Starts in 1 hour" },
  },
} as const;

export type Translations = typeof translations.ko;
