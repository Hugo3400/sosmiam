import type { DomaineOffreCarriere, NouvelleCandidature, OffreCarriere, TypeOffreCarriere } from "../../../../packages/commun/src/types/carriere.ts";
import { entetesLangue } from "./langue-courante.server.ts";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
const TYPES = new Set<string>(["benevolat", "freelance"] satisfies TypeOffreCarriere[]);
const DOMAINES = new Set<string>(["moderation", "reseaux-sociaux", "graphisme", "video", "developpement", "autre"] satisfies DomaineOffreCarriere[]);
const FORME_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type LectureOffre = { ok: true; offre: OffreCarriere } | { ok: false; erreur: "offre-inconnue" | "indisponible" };

export type ResultatCandidature =
  | { ok: true }
  | { ok: false; erreur: "champ-invalide"; champ: string }
  | { ok: false; erreur: "offre-inconnue" | "offre-fermee" | "cv-trop-lourd" | "cv-format" | "trop-de-demandes" | "erreur" };

const CODES_PAR_STATUT: Record<number, ResultatCandidature> = {
  404: { ok: false, erreur: "offre-inconnue" },
  409: { ok: false, erreur: "offre-fermee" },
  413: { ok: false, erreur: "cv-trop-lourd" },
  415: { ok: false, erreur: "cv-format" },
  429: { ok: false, erreur: "trop-de-demandes" },
};

export function estIdOffre(id: string | undefined): id is string {
  return typeof id === "string" && FORME_ID.test(id);
}

function enTetesVisiteur(ipVisiteur: string | null): Record<string, string> {
  return { ...entetesLangue(), ...(ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {}) };
}

function lireTextes(valeur: unknown): string[] | null {
  if (!Array.isArray(valeur)) return null;
  return valeur.filter((texte): texte is string => typeof texte === "string" && texte.trim() !== "");
}

function lireOffre(brute: unknown): OffreCarriere | null {
  if (typeof brute !== "object" || brute === null) return null;
  const o = brute as Record<string, unknown>;
  const textes = [o.titre, o.resume, o.description, o.lieu, o.publieeLe];
  if (typeof o.id !== "string" || !estIdOffre(o.id) || !textes.every((texte) => typeof texte === "string")) return null;
  if (typeof o.type !== "string" || !TYPES.has(o.type)) return null;
  const missions = lireTextes(o.missions);
  const profil = lireTextes(o.profil);
  const enEchange = lireTextes(o.enEchange);
  if (!missions || !profil || !enEchange || (o.titre as string).trim() === "") return null;
  return {
    id: o.id,
    titre: o.titre as string,
    type: o.type as TypeOffreCarriere,
    domaine: typeof o.domaine === "string" && DOMAINES.has(o.domaine) ? (o.domaine as DomaineOffreCarriere) : "autre",
    resume: o.resume as string,
    description: o.description as string,
    missions,
    profil,
    enEchange,
    lieu: o.lieu as string,
    publieeLe: o.publieeLe as string,
  };
}

export async function listerOffresCarriere(ipVisiteur: string | null, delai = 3000): Promise<OffreCarriere[] | null> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/carriere/offres`, { headers: enTetesVisiteur(ipVisiteur), signal: AbortSignal.timeout(delai) });
    if (!reponse.ok) return null;
    const corps: unknown = await reponse.json();
    const offres = typeof corps === "object" && corps !== null && "offres" in corps ? corps.offres : null;
    if (!Array.isArray(offres)) return null;
    return offres.map(lireOffre).filter((offre): offre is OffreCarriere => offre !== null);
  } catch {
    return null;
  }
}

export async function lireOffreCarriere(id: string, ipVisiteur: string | null): Promise<LectureOffre> {
  if (!estIdOffre(id)) return { ok: false, erreur: "offre-inconnue" };
  try {
    const reponse = await fetch(`${ADRESSE_API}/carriere/offres/${encodeURIComponent(id)}`, {
      headers: enTetesVisiteur(ipVisiteur),
      signal: AbortSignal.timeout(3000),
    });
    const corps: unknown = await reponse.json().catch(() => null);
    const lu = typeof corps === "object" && corps !== null ? (corps as { erreur?: unknown; offre?: unknown }) : {};
    if (reponse.status === 404 && lu.erreur === "offre-inconnue") return { ok: false, erreur: "offre-inconnue" };
    if (!reponse.ok) return { ok: false, erreur: "indisponible" };
    const offre = lireOffre(lu.offre);
    return offre && offre.id === id ? { ok: true, offre } : { ok: false, erreur: "indisponible" };
  } catch {
    return { ok: false, erreur: "indisponible" };
  }
}

export async function envoyerCandidature(
  offreId: string,
  candidature: NouvelleCandidature,
  piege: string,
  ipVisiteur: string | null,
): Promise<ResultatCandidature> {
  if (!estIdOffre(offreId)) return { ok: false, erreur: "offre-inconnue" };
  try {
    const reponse = await fetch(`${ADRESSE_API}/carriere/offres/${encodeURIComponent(offreId)}/candidatures`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...enTetesVisiteur(ipVisiteur) },
      body: JSON.stringify({ ...candidature, site_web: piege }),
      signal: AbortSignal.timeout(15000),
    });
    if (reponse.ok) return { ok: true };
    const corps: unknown = await reponse.json().catch(() => null);
    const lu = typeof corps === "object" && corps !== null ? (corps as { erreur?: unknown; champ?: unknown }) : {};
    if (reponse.status === 400 && lu.erreur === "champ-invalide" && typeof lu.champ === "string") {
      return { ok: false, erreur: "champ-invalide", champ: lu.champ };
    }
    if (reponse.status === 404 && lu.erreur !== "offre-inconnue") return { ok: false, erreur: "erreur" };
    return CODES_PAR_STATUT[reponse.status] ?? { ok: false, erreur: "erreur" };
  } catch {
    return { ok: false, erreur: "erreur" };
  }
}
