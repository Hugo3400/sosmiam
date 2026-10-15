import type { LectureJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";

type JetonEnvoiOffres = { jeton: string; plateforme: "ios" | "android" };

export function choisirJetonEnvoiOffres(lu: LectureJetonTelephone | null, offres: boolean, jetonGarde: string | null, plateforme: string): JetonEnvoiOffres | null {
  if (lu?.ok) return { jeton: lu.jeton, plateforme: lu.plateforme };
  if (offres || !jetonGarde) return null;
  return plateforme === "ios" || plateforme === "android" ? { jeton: jetonGarde, plateforme } : null;
}
