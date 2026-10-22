import type { Notification } from "expo-notifications";

const FORME_REGROUPEMENT = /^conversation:(\d{1,12})$/;

const lireChamp = (objet: unknown, champ: string): unknown =>
  typeof objet === "object" && objet !== null ? (objet as Record<string, unknown>)[champ] : undefined;

export function lireConversationNotification(notification: Notification | null | undefined): number | null {
  if (!notification) return null;
  const { content, trigger } = notification.request;
  const payload = trigger && "payload" in trigger ? trigger.payload : undefined;
  const regroupement = [lireChamp(content.data, "tag"), lireChamp(lireChamp(payload, "aps"), "thread-id"), notification.request.identifier]
    .find((valeur): valeur is string => typeof valeur === "string" && FORME_REGROUPEMENT.test(valeur));
  const id = regroupement ? Number(FORME_REGROUPEMENT.exec(regroupement)![1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
