// Espace presse : kits et visuels de SOS Miam à télécharger (presse/ du dépôt et kits médias du site).
import { appeler } from "./client-gestion.ts";

export type FichierPresse = {
  id: string; nom: string; format: string;
  /** « 1080 × 1350 px », quand l'export le dit */
  dimensions: string | null;
  octets: number; description: string;
  /** Identifiant d'une petite image d'aperçu (null : pas d'aperçu) */
  apercu: string | null;
};
export type FamillePresse = {
  id: string; titre: string;
  /** « presse » : créations exportées de claude.ai ; « site » : kits médias du site */
  source: "presse" | "site";
  zip: { id: string; nom: string; octets: number } | null;
  fichiers: FichierPresse[];
};

export const listerPresse = () => appeler<{ genere: string | null; familles: FamillePresse[] }>("GET", "/presse");
/** Un fichier listé (ou un aperçu, ou un zip) */
export const lireFichierPresse = (id: string) => appeler<Blob>("GET", `/presse/fichiers/${id}`, { reponse: "blob" });
