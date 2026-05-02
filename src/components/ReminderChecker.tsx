import { useEffect } from "react";

const STORAGE_KEY = "grow_reminders";

type Reminder = { eventId: string; title: string; startsAt: string };

export const ReminderChecker = () => {
  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined" || Notification.permission !== "granted") return;
      try {
        const reminders: Reminder[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        const now = Date.now();
        const surviving = reminders.filter((r) => {
          const diff = new Date(r.startsAt).getTime() - now;
          if (diff < 0) return false; // past, drop it
          if (diff <= 60 * 60 * 1000 && diff > 55 * 60 * 1000) {
            new Notification(`📅 ${r.title}`, {
              body: "1시간 후에 일정이 시작됩니다!",
              icon: "/favicon.ico",
            });
            return false; // fired, drop it
          }
          return true;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(surviving));
      } catch {}
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  return null;
};
