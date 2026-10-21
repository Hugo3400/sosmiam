import type { DomaineOffreCarriere, DonneesOffreCarriere, TypeOffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { lireTexteCarriere } from "./lire-texte-carriere.ts";

export type LectureDonneesOffre = { ok: true; donnees: DonneesOffreCarriere } | { ok: false; champ: string };

const TYPES: readonly TypeOffreCarriere[] = ["benevolat", "freelance"];
const DOMAINES: readonly DomaineOffreCarriere[] = ["moderation", "reseaux-sociaux", "graphisme", "video", "developpement", "autre"];

const lireListe = (valeur: unknown): string[] | null => {
  if (valeur === undefined || valeur === null) return [];
  if (!Array.isArray(valeur) || valeur.length > 12) return null;
  const elements = valeur.map((element) => lireTexteCarriere(element, 2, 300));
  return elements.every((element): element is string => element !== null) ? elements : null;
};

export function lireDonneesOffre(corps: unknown, lieuParDefaut: string): LectureDonneesOffre {
  const c = typeof corps === "object" && corps !== null && !Array.isArray(corps) ? (corps as Record<string, unknown>) : {};
  const titre = lireTexteCarriere(c.titre, 3, 120);
  if (titre === null) return { ok: false, champ: "titre" };
  if (!TYPES.includes(c.type as TypeOffreCarriere)) return { ok: false, champ: "type" };
  if (!DOMAINES.includes(c.domaine as DomaineOffreCarriere)) return { ok: false, champ: "domaine" };
  const resume = lireTexteCarriere(c.resume, 10, 300);
  if (resume === null) return { ok: false, champ: "resume" };
  const description = lireTexteCarriere(c.description, 20, 4000, true);
  if (description === null) return { ok: false, champ: "description" };
  const missions = lireListe(c.missions);
  if (missions === null) return { ok: false, champ: "missions" };
  const profil = lireListe(c.profil);
  if (profil === null) return { ok: false, champ: "profil" };
  const enEchange = lireListe(c.enEchange);
  if (enEchange === null) return { ok: false, champ: "enEchange" };
  const lieu = c.lieu === undefined || c.lieu === null || c.lieu === "" ? lieuParDefaut : lireTexteCarriere(c.lieu, 2, 120);
  if (lieu === null) return { ok: false, champ: "lieu" };
  return { ok: true, donnees: { titre, type: c.type as TypeOffreCarriere, domaine: c.domaine as DomaineOffreCarriere, resume, description, missions, profil, enEchange, lieu } };
}
