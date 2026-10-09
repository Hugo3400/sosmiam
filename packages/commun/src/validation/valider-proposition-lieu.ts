import type { NouvelleSuggestionLieu, PropositionLieu } from "../types/proposition-lieu.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";
import { validerInfosPratiques } from "./valider-infos-pratiques.ts";

export type ChampPropositionLieu = "nom" | "adresse" | "horaires" | "texte" | "telephone" | "siteWeb" | "instagram" | "message" | "vide" | "autre";
export type ResultatPropositionLieu =
  | { ok: true; suggestion: NouvelleSuggestionLieu }
  | { ok: false; erreur: "proposition-invalide"; champ: ChampPropositionLieu };

/** Longueurs maximales, celles des colonnes du modèle Lieu de l'API */
const LONGUEURS = { nom: 80, adresse: 160, horaires: 160, texte: 1000 } as const;
const LONGUEUR_MESSAGE = 1000;
const TEXTES = ["nom", "adresse", "horaires", "texte"] as const;

/**
 * Vérifie une proposition de modification de fiche (app, site, API) : textes non vides, pas trop longs, sans gros mot ;
 * infos pratiques passées par validerInfosPratiques ; au moins un champ proposé ; « Pourquoi ? » facultatif.
 * Rend la suggestion nettoyée (seulement les champs envoyés), ou le premier champ à corriger.
 */
export function validerPropositionLieu(brut: unknown): ResultatPropositionLieu {
  const refuser = (champ: ChampPropositionLieu): ResultatPropositionLieu => ({ ok: false, erreur: "proposition-invalide", champ });
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return refuser("autre");
  const { proposition, message } = brut as { proposition?: unknown; message?: unknown };
  if (typeof proposition !== "object" || proposition === null || Array.isArray(proposition)) return refuser("vide");
  const p = proposition as Record<string, unknown>;
  const propre: PropositionLieu = {};

  for (const cle of TEXTES) {
    if (p[cle] === undefined) continue;
    if (typeof p[cle] !== "string") return refuser(cle);
    const valeur = (p[cle] as string).trim();
    if (valeur.length === 0 || valeur.length > LONGUEURS[cle] || contientMotInterdit(valeur)) return refuser(cle);
    propre[cle] = valeur;
  }

  // Les infos pratiques : seulement les clés envoyées (une case décochée s'envoie à false, et reste « non » côté équipe)
  const clesPratiques = Object.keys(p).filter((cle) => !(TEXTES as readonly string[]).includes(cle));
  if (clesPratiques.length > 0) {
    const pratiques = validerInfosPratiques(Object.fromEntries(clesPratiques.map((cle) => [cle, p[cle]])));
    if (!pratiques.ok) return refuser(pratiques.champ === "autre" ? "autre" : pratiques.champ);
    Object.assign(propre, pratiques.infos);
    for (const cle of ["accessible", "terrasse", "wifi", "enfants", "parking"] as const) if (p[cle] === false) propre[cle] = false;
  }
  if (Object.keys(propre).length === 0) return refuser("vide");

  let mot: string | null = null;
  if (message !== undefined && message !== null) {
    if (typeof message !== "string") return refuser("message");
    const valeur = message.trim();
    if (valeur.length > LONGUEUR_MESSAGE || contientMotInterdit(valeur)) return refuser("message");
    mot = valeur || null;
  }
  return { ok: true, suggestion: { proposition: propre, message: mot } };
}
