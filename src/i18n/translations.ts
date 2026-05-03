export type Language = "ko" | "en" | "ja" | "zh" | "ru";

export const LANGUAGE_LABELS: Record<Language, { flag: string; label: string }> = {
  ko: { flag: "🇰🇷", label: "한국어" },
  en: { flag: "🇺🇸", label: "English" },
  ja: { flag: "🇯🇵", label: "日本語" },
  zh: { flag: "🇨🇳", label: "中文" },
  ru: { flag: "🇷🇺", label: "Русский" },
};

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
  ja: {
    nav: { home: "ホーム", groups: "グループ", classes: "クラス", chat: "チャット", profile: "マイページ" },
    profile: { title: "マイページ", logout: "ログアウト", withdraw: "退会", darkMode: "ダークモード", language: "言語" },
    common: { loading: "読み込み中...", back: "戻る", cancel: "キャンセル", confirm: "確認", save: "保存", send: "送信", search: "検索" },
    chat: { placeholder: "メッセージを入力...", online: "オンライン", offline: "オフライン", lastSeen: "最終接続", typing: "入力中..." },
    event: { reminder: "リマインダー", reminderSet: "リマインダー設定", reminderCleared: "リマインダー解除", inOneHour: "1時間後に開始" },
  },
  zh: {
    nav: { home: "首页", groups: "圈子", classes: "课程", chat: "聊天", profile: "我的" },
    profile: { title: "我的资料", logout: "退出登录", withdraw: "注销账户", darkMode: "深色模式", language: "语言" },
    common: { loading: "加载中...", back: "返回", cancel: "取消", confirm: "确认", save: "保存", send: "发送", search: "搜索" },
    chat: { placeholder: "输入消息...", online: "在线", offline: "离线", lastSeen: "最后在线", typing: "正在输入..." },
    event: { reminder: "提醒", reminderSet: "提醒已设置", reminderCleared: "提醒已取消", inOneHour: "1小时后开始" },
  },
  ru: {
    nav: { home: "Главная", groups: "Группы", classes: "Занятия", chat: "Чат", profile: "Профиль" },
    profile: { title: "Мой профиль", logout: "Выйти", withdraw: "Удалить аккаунт", darkMode: "Тёмная тема", language: "Язык" },
    common: { loading: "Загрузка...", back: "Назад", cancel: "Отмена", confirm: "Подтвердить", save: "Сохранить", send: "Отправить", search: "Поиск" },
    chat: { placeholder: "Напишите сообщение...", online: "Онлайн", offline: "Офлайн", lastSeen: "Был(а) в сети", typing: "печатает..." },
    event: { reminder: "Напоминание", reminderSet: "Напоминание установлено", reminderCleared: "Напоминание отключено", inOneHour: "Начнётся через 1 час" },
  },
} as const;

export type Translations = typeof translations.ko;
