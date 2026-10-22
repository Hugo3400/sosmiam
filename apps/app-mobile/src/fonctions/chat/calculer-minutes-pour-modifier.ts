import { DELAI_MODIFICATION_MESSAGE_MINUTES } from "@sos-miam/commun/regles/chat";

const MINUTE_MS = 60_000;

export function calculerMinutesPourModifier(iso: string, maintenant: Date): number {
  const envoye = new Date(iso).getTime();
  if (Number.isNaN(envoye)) return 0;
  const reste = DELAI_MODIFICATION_MESSAGE_MINUTES * MINUTE_MS - (maintenant.getTime() - envoye);
  if (reste <= 0) return 0;
  return Math.min(DELAI_MODIFICATION_MESSAGE_MINUTES, Math.ceil(reste / MINUTE_MS));
}
