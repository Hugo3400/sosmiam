import type { AccueilAnimaux, InfosPratiques, MoyenPaiement, ReservationConseillee } from "../types/infos-pratiques.ts";

export type ChampInfosPratiques = "telephone" | "siteWeb" | "instagram" | "autre";
export type ResultatInfosPratiques = { ok: true; infos: InfosPratiques } | { ok: false; erreur: "infos-invalides"; champ: ChampInfosPratiques };

const ANIMAUX: readonly AccueilAnimaux[] = ["bienvenus", "terrasse", "non"];
const RESERVATIONS: readonly ReservationConseillee[] = ["inutile", "conseillee", "obligatoire"];
const PAIEMENTS: readonly MoyenPaiement[] = ["cb", "sans-contact", "especes", "tickets-resto", "cheques-vacances"];
const BOOLEENS = ["accessible", "terrasse", "wifi", "enfants", "parking"] as const;

/** « 0467123456 », « +33 4 67 12 34 56 » → « 04 67 12 34 56 » ; null si ce n'est pas un numéro français */
function normaliserTelephone(brut: string): string | null {
  let chiffres = brut.replace(/[\s.\-()]/g, "");
  if (chiffres.startsWith("+33")) chiffres = `0${chiffres.slice(3)}`;
  else if (chiffres.startsWith("0033")) chiffres = `0${chiffres.slice(4)}`;
  if (!/^0[1-9]\d{8}$/.test(chiffres)) return null;
  return chiffres.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** Un site en https, sans espace, 200 caractères au plus ; null sinon */
function normaliserSite(brut: string): string | null {
  const site = brut.trim();
  if (site.length > 200 || /\s/.test(site)) return null;
  try {
    const adresse = new URL(site);
    return adresse.protocol === "https:" && adresse.hostname.includes(".") ? adresse.toString() : null;
  } catch {
    return null;
  }
}

/** « @lea.mange », « instagram.com/lea.mange » ou « lea.mange » → « lea.mange » ; null sinon */
function normaliserInstagram(brut: string): string | null {
  const nom = brut
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(nom) ? nom : null;
}

/**
 * Vérifie les infos pratiques qu'un lieu remplit lui-même (mode pro, espace pro du site, API) : numéro français,
 * site en https, nom Instagram, valeurs des listes fermées. Les textes vides disparaissent (info non donnée).
 */
export function validerInfosPratiques(brut: unknown): ResultatInfosPratiques {
  const refuser = (champ: ChampInfosPratiques): ResultatInfosPratiques => ({ ok: false, erreur: "infos-invalides", champ });
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return refuser("autre");
  const r = brut as Record<string, unknown>;
  const infos: InfosPratiques = {};

  const texte = (v: unknown) => (typeof v === "string" ? v.trim() : v === undefined || v === null ? "" : null);
  const telephone = texte(r.telephone);
  if (telephone === null) return refuser("telephone");
  if (telephone) {
    const propre = normaliserTelephone(telephone);
    if (!propre) return refuser("telephone");
    infos.telephone = propre;
  }
  const site = texte(r.siteWeb);
  if (site === null) return refuser("siteWeb");
  if (site) {
    const propre = normaliserSite(site);
    if (!propre) return refuser("siteWeb");
    infos.siteWeb = propre;
  }
  const instagram = texte(r.instagram);
  if (instagram === null) return refuser("instagram");
  if (instagram) {
    const propre = normaliserInstagram(instagram);
    if (!propre) return refuser("instagram");
    infos.instagram = propre;
  }

  if (r.animaux !== undefined && r.animaux !== null) {
    if (!ANIMAUX.includes(r.animaux as AccueilAnimaux)) return refuser("autre");
    infos.animaux = r.animaux as AccueilAnimaux;
  }
  if (r.reservation !== undefined && r.reservation !== null) {
    if (!RESERVATIONS.includes(r.reservation as ReservationConseillee)) return refuser("autre");
    infos.reservation = r.reservation as ReservationConseillee;
  }
  for (const cle of BOOLEENS) {
    if (r[cle] === undefined || r[cle] === null) continue;
    if (typeof r[cle] !== "boolean") return refuser("autre");
    if (r[cle]) infos[cle] = true;
  }
  if (r.paiements !== undefined && r.paiements !== null) {
    if (!Array.isArray(r.paiements) || r.paiements.some((p) => !PAIEMENTS.includes(p as MoyenPaiement))) return refuser("autre");
    const paiements = PAIEMENTS.filter((p) => (r.paiements as unknown[]).includes(p));
    if (paiements.length > 0) infos.paiements = paiements;
  }
  return { ok: true, infos };
}
