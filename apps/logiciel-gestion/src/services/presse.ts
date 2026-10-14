// Espace presse : kits et visuels de SOS Miam à télécharger (presse/ du dépôt et kits médias du site).
import { appeler } from "./client-gestion.ts";

/** À quoi sert un visuel (filtres de l'Espace presse) */
export type CanalPresse =
  | "instagram" | "tiktok" | "facebook" | "x" | "ios" | "android" | "web" | "impression" | "marque" | "textes" | "sons" | "presentation";
/** Dans l'ordre des filtres */
export const CANAUX_PRESSE: Record<CanalPresse, string> = {
  instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", x: "X (Twitter)", ios: "iOS (App Store)", android: "Android (Play Store)",
  web: "Site web", impression: "À imprimer", marque: "Logos et marque", textes: "Textes", sons: "Sons", presentation: "Présentations",
};

export type FichierPresse = {
  id: string; nom: string; format: string;
  /** « 1080 × 1350 px », quand l'export le dit */
  dimensions: string | null;
  octets: number; description: string;
  /** Identifiant d'une petite image d'aperçu (null : pas d'aperçu) */
  apercu: string | null;
  /** Canaux donnés par l'index, ou déduits (nom, dimensions, format) */
  canaux?: CanalPresse[];
};
export type FamillePresse = {
  id: string; titre: string;
  /** « presse » : créations exportées de claude.ai ; « site » : kits médias du site */
  source: "presse" | "site";
  zip: { id: string; nom: string; octets: number } | null;
  fichiers: FichierPresse[];
};

export const listerPresse = () => appeler<{ genere: string | null; familles: FamillePresse[] }>("GET", "/presse");
/** Au-delà, le fichier passe par le navigateur (lien de 10 minutes) : trop lourd pour transiter par le logiciel */
export const OCTETS_MAX_LOGICIEL = 40 * 1024 * 1024;
export const creerLienPresse = (id: string) => appeler<{ ok: true; lien: string; expireLe: string }>("POST", `/presse/fichiers/${id}/lien`, { corps: {} });
/** Un fichier listé (ou un aperçu, ou un zip) */
export const lireFichierPresse = (id: string) => appeler<Blob>("GET", `/presse/fichiers/${id}`, { reponse: "blob" });
