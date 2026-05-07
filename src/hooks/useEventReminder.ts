import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText } from "@/i18n/format";

const STORAGE_KEY = "grow_reminders";

type Reminder = { eventId: string; title: string; startsAt: string };

const getReminders = (): Reminder[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
};

export const useEventReminder = () => {
  const { lang } = useLanguage();
  const tr = (value: string) => displayText(value, lang);

  const hasReminder = (eventId: string) => getReminders().some((r) => r.eventId === eventId);

  const toggleReminder = async (reminder: Reminder): Promise<boolean> => {
    const rs = getReminders();
    const idx = rs.findIndex((r) => r.eventId === reminder.eventId);

    if (idx >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rs.filter((_, i) => i !== idx)));
      toast({ title: tr("리마인더가 해제되었어요") });
      return false;
    }

    if (!("Notification" in window)) {
      toast({ title: tr("이 브라우저는 알림을 지원하지 않아요"), variant: "destructive" });
      return false;
    }

    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast({ title: tr("알림 권한이 필요해요"), description: tr("브라우저 설정에서 알림을 허용해주세요"), variant: "destructive" });
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...rs, reminder]));
    toast({ title: tr("리마인더가 설정되었어요"), description: tr("일정 1시간 전에 알림을 보내드려요") });
    return true;
  };

  return { hasReminder, toggleReminder };
};
