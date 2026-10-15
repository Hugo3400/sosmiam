import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";

const LIENS_SANS_COMPTE = /^\/(explorer|potes|profil|lieu\/\d{1,9})?$/;
const LIENS_PRO = /^\/pro(\/|$)/;

export type AccesLienAnnonceApp = { compte: boolean; pro: boolean };

export function lireLienAnnonceApp(lien: unknown, acces: AccesLienAnnonceApp): string | null {
  if (!estLienPermis(lien)) return null;
  if (LIENS_PRO.test(lien) && !acces.pro) return null;
  if (!acces.compte && !LIENS_SANS_COMPTE.test(lien)) return null;
  return lien;
}
