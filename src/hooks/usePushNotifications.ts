import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("id-preview--"));

const isInIframe = (() => {
  try { return typeof window !== "undefined" && window.self !== window.top; }
  catch { return true; }
})();

export const PUSH_SUPPORTED =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  !isPreviewHost &&
  !isInIframe;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const arrBufToB64 = (buf: ArrayBuffer | null) => {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    PUSH_SUPPORTED ? Notification.permission : "unsupported",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!PUSH_SUPPORTED) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!PUSH_SUPPORTED || !user) return false;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const { data, error } = await supabase.functions.invoke("get-vapid-key");
      if (error || !data?.publicKey) throw new Error("VAPID 키를 가져올 수 없어요");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? arrBufToB64(sub.getKey("p256dh")),
        auth: json.keys?.auth ?? arrBufToB64(sub.getKey("auth")),
        user_agent: navigator.userAgent,
      }, { onConflict: "endpoint" });

      setSubscribed(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!PUSH_SUPPORTED || !user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { supported: PUSH_SUPPORTED, permission, subscribed, loading, subscribe, unsubscribe };
}