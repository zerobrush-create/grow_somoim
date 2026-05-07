import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText } from "@/i18n/format";

export const PushToggle = () => {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const tr = (value: string) => displayText(value, lang);

  if (!supported) {
    return (
      <div className="mx-4 mt-3 mb-1 rounded-2xl bg-muted/60 border border-border px-4 py-3 text-xs text-muted-foreground">
        {tr("브라우저 푸시는 배포된 사이트(설치 PWA 또는 외부 도메인)에서만 사용할 수 있어요.")}
      </div>
    );
  }

  const handle = async () => {
    try {
      if (subscribed) {
        await unsubscribe();
        toast({ title: tr("푸시 알림이 꺼졌어요") });
      } else {
        const ok = await subscribe();
        if (ok) toast({ title: tr("푸시 알림이 켜졌어요"), description: tr("이제 새 소식을 바로 받을 수 있어요") });
        else if (permission === "denied") toast({ title: tr("권한이 차단되었어요"), description: tr("브라우저 설정에서 알림 권한을 허용해주세요"), variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: tr("오류"), description: e?.message ?? tr("다시 시도해주세요"), variant: "destructive" });
    }
  };

  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl bg-card border border-border px-4 py-3 flex items-center gap-3 shadow-soft">
      <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center">
        {subscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{tr("브라우저 푸시 알림")}</p>
        <p className="text-[11px] text-muted-foreground">{subscribed ? tr("켜져 있어요") : tr("앱이 닫혀있어도 알림을 받아보세요")}</p>
      </div>
      <Button size="sm" variant={subscribed ? "outline" : "default"} disabled={loading} onClick={handle}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : subscribed ? tr("끄기") : tr("켜기")}
      </Button>
    </div>
  );
};

export default PushToggle;
