import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";

const LIENS_POUR_TOUS = /^\/(explorer|potes|profil|notifications|potes\/messages|lieu\/\d{1,9})?$/;
const LIENS_SANS_COMPTE = /^\/(explorer|potes|profil|lieu\/\d{1,9})?$/;

export type AccesLienAnnonceApp = { compte: boolean };

export function lireLienAnnonceApp(lien: unknown, acces: AccesLienAnnonceApp): string | null {
  if (!estLienPermis(lien) || !LIENS_POUR_TOUS.test(lien)) return null;
  if (!acces.compte && !LIENS_SANS_COMPTE.test(lien)) return null;
  return lien;
}
