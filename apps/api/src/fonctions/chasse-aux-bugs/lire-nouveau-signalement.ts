import { CIBLES_SIGNALEMENT_SECURITE, LONGUEURS_SIGNALEMENT_SECURITE as L } from "../../../../../packages/commun/src/regles/securite.ts";
import type { CibleSignalementSecurite, NouveauSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import { verifierEmail } from "../texte/verifier-email.ts";
import { lireImagesSignalement } from "./lire-images-signalement.ts";
import { lireLienSignalement } from "./lire-lien-signalement.ts";
import { lireTexteSignalement } from "./lire-texte-signalement.ts";

export type LectureNouveauSignalement =
  | { ok: true; signalement: NouveauSignalementSecurite }
  | { ok: false; erreur: "champ-invalide"; champ: string }
  | { ok: false; erreur: "trop-d-images" };

const refuser = (champ: string): LectureNouveauSignalement => ({ ok: false, erreur: "champ-invalide", champ });

const lireNomTableau = (valeur: unknown): string | null | undefined => {
  if (valeur === undefined || valeur === null || (typeof valeur === "string" && valeur.trim() === "")) return null;
  return lireTexteSignalement(valeur, L.nomTableauHonneur.min, L.nomTableauHonneur.max) ?? undefined;
};

export function lireNouveauSignalement(corps: unknown): LectureNouveauSignalement {
  const c = typeof corps === "object" && corps !== null && !Array.isArray(corps) ? (corps as Record<string, unknown>) : {};
  const nom = lireTexteSignalement(c.nom, L.nom.min, L.nom.max);
  if (nom === null) return refuser("nom");
  const email = lireTexteSignalement(c.email, 3, 254)?.toLowerCase() ?? null;
  if (email === null || !verifierEmail(email)) return refuser("email");
  if (!CIBLES_SIGNALEMENT_SECURITE.includes(c.cible as CibleSignalementSecurite)) return refuser("cible");
  const titre = lireTexteSignalement(c.titre, L.titre.min, L.titre.max);
  if (titre === null) return refuser("titre");
  const description = lireTexteSignalement(c.description, L.description.min, L.description.max, true);
  if (description === null) return refuser("description");
  const lien = lireLienSignalement(c.lien);
  if (lien === undefined) return refuser("lien");
  if (c.majeur !== true) return refuser("majeur");
  if (c.reglesAcceptees !== true) return refuser("reglesAcceptees");
  const nomTableauHonneur = lireNomTableau(c.nomTableauHonneur);
  if (nomTableauHonneur === undefined) return refuser("nomTableauHonneur");
  const images = lireImagesSignalement(c.images);
  if (!images.ok) return images.erreur === "trop-d-images" ? { ok: false, erreur: "trop-d-images" } : refuser("images");
  return {
    ok: true,
    signalement: {
      nom, email, cible: c.cible as CibleSignalementSecurite, titre, description, lien, majeur: true, reglesAcceptees: true, nomTableauHonneur, images: images.images,
    },
  };
}
