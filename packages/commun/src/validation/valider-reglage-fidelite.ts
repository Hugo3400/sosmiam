import type { ReglageFidelite } from "../types/fidelite.ts";
import {
  RECOMPENSE_LONGUEUR_MAX,
  RECOMPENSE_LONGUEUR_MIN,
  VISITES_FIDELITE_MAX,
  VISITES_FIDELITE_MIN,
} from "../regles/fidelite.ts";
import { contientMotAlcool } from "../fonctions/fidelite/contient-mot-alcool.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

type ChampFidelite = "recompense" | "recompenseSansAlcool" | "visitesRequises";
type ResultatReglageFidelite =
  | { ok: true; reglage: ReglageFidelite }
  | { ok: false; erreur: "programme-invalide"; champ: ChampFidelite };

const estTexteRecompense = (texte: string) =>
  texte.length >= RECOMPENSE_LONGUEUR_MIN && texte.length <= RECOMPENSE_LONGUEUR_MAX && !contientMotInterdit(texte);

/**
 * Vérifie le réglage de la carte de fidélité d'un lieu (mode pro, espace pro du site, API), dans l'ordre du formulaire :
 * récompense (3 à 60 caractères, sans insulte), version sans alcool, nombre de visites (3 à 10).
 * « Alcool » est coché d'office si la récompense contient un mot d'alcool ; la version pour les moins de 18 ans est
 * alors obligatoire et ne doit pas en contenir. Rend le réglage nettoyé (textes sans espaces autour, version sans
 * alcool à null quand il n'y a pas d'alcool), ou le premier champ à corriger.
 */
export function validerReglageFidelite(r: ReglageFidelite): ResultatReglageFidelite {
  const refuser = (champ: ChampFidelite): ResultatReglageFidelite => ({ ok: false, erreur: "programme-invalide", champ });

  if (typeof r.recompense !== "string") return refuser("recompense");
  const recompense = r.recompense.trim();
  if (!estTexteRecompense(recompense)) return refuser("recompense");

  const alcool = r.alcool === true || contientMotAlcool(recompense);
  let recompenseSansAlcool: string | null = null;
  if (alcool) {
    if (typeof r.recompenseSansAlcool !== "string") return refuser("recompenseSansAlcool");
    recompenseSansAlcool = r.recompenseSansAlcool.trim();
    if (!estTexteRecompense(recompenseSansAlcool) || contientMotAlcool(recompenseSansAlcool)) return refuser("recompenseSansAlcool");
  }

  const visites = r.visitesRequises;
  if (typeof visites !== "number" || !Number.isInteger(visites) || visites < VISITES_FIDELITE_MIN || visites > VISITES_FIDELITE_MAX) {
    return refuser("visitesRequises");
  }

  return { ok: true, reglage: { actif: r.actif === true, visitesRequises: visites, recompense, alcool, recompenseSansAlcool } };
}
