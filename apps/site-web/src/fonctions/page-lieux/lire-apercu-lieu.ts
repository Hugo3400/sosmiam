import { lireLieuListe } from "~/fonctions/page-lieux/lire-lieu-liste";
import type { ApercuLieu } from "~/types/lieux";

export function lireApercuLieu(brut: unknown): ApercuLieu | null {
  if (typeof brut !== "object" || brut === null) return null;
  const fiche = brut as Record<string, unknown>;
  const lieu = lireLieuListe({ ...fiche, verifie: fiche.estVerifie === true || fiche.verifie === true });
  if (!lieu) return null;
  const adresse = typeof fiche.adresse === "string" && fiche.adresse.trim() ? fiche.adresse.trim() : null;
  return { ...lieu, adresse };
}
