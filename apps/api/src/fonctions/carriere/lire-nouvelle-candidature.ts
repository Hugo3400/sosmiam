import type { NouvelleCandidature } from "../../../../../packages/commun/src/types/carriere.ts";
import { verifierEmail } from "../texte/verifier-email.ts";
import { lireTexteCarriere } from "./lire-texte-carriere.ts";

export type LectureNouvelleCandidature = { ok: true; candidature: NouvelleCandidature } | { ok: false; champ: string };

const lireLien = (valeur: unknown): string | null | undefined => {
  if (valeur === undefined || valeur === null || (typeof valeur === "string" && valeur.trim() === "")) return null;
  const lien = lireTexteCarriere(valeur, 1, 300);
  if (lien === null || !/^https:\/\/\S+$/i.test(lien)) return undefined;
  try {
    const adresse = new URL(lien);
    return adresse.protocol === "https:" && adresse.hostname.includes(".") && !adresse.username && !adresse.password ? lien : undefined;
  } catch {
    return undefined;
  }
};

const lireCv = (valeur: unknown): NouvelleCandidature["cv"] | undefined => {
  if (valeur === undefined || valeur === null) return null;
  if (typeof valeur !== "object" || Array.isArray(valeur)) return undefined;
  const { nomFichier, base64 } = valeur as Record<string, unknown>;
  if (typeof nomFichier !== "string" || nomFichier.trim() === "" || nomFichier.length > 200) return undefined;
  if (typeof base64 !== "string" || base64 === "") return undefined;
  return { nomFichier: nomFichier.trim(), base64 };
};

export function lireNouvelleCandidature(corps: unknown): LectureNouvelleCandidature {
  const c = typeof corps === "object" && corps !== null && !Array.isArray(corps) ? (corps as Record<string, unknown>) : {};
  const nom = lireTexteCarriere(c.nom, 2, 80);
  if (nom === null) return { ok: false, champ: "nom" };
  const email = lireTexteCarriere(c.email, 3, 254)?.toLowerCase() ?? null;
  if (email === null || !verifierEmail(email)) return { ok: false, champ: "email" };
  const message = lireTexteCarriere(c.message, 20, 3000, true);
  if (message === null) return { ok: false, champ: "message" };
  const lien = lireLien(c.lien);
  if (lien === undefined) return { ok: false, champ: "lien" };
  if (c.majeur !== true) return { ok: false, champ: "majeur" };
  const cv = lireCv(c.cv);
  if (cv === undefined) return { ok: false, champ: "cv" };
  return { ok: true, candidature: { nom, email, message, lien, majeur: true, cv } };
}
