import {
  ACCROCHE_ACTUS_MAX, ACCROCHE_ACTUS_MIN, CITATION_ACTUS_MAX, FIN_BON_PLAN_MAX_JOURS, LIEUX_RUBRIQUE_ACTUS, PARAGRAPHES_ACTUS_MAX, PHOTOS_ACTUS_MAX,
  TEXTE_ACTUS_MAX, TEXTE_ACTUS_MIN, TITRE_ACTUS_MAX, TITRE_ACTUS_MIN,
} from "../regles/actus.ts";
import type { ArticleEnvoyeActus, BrouillonArticleActus, ChampArticleActus } from "../types/actus.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

export type ResultatValidationArticleActus = { ok: true; article: ArticleEnvoyeActus } | { ok: false; champs: ChampArticleActus[] };

const JOUR_MS = 86_400_000;

const nettoyerLigne = (texte: string) => texte.replace(/\s+/g, " ").trim();

const decouperParagraphes = (texte: string) => texte.split(/\n\s*\n/).map(nettoyerLigne).filter(Boolean);

const estLigneValide = (texte: string, min: number, max: number) => texte.length >= min && texte.length <= max && !contientMotInterdit(texte);

function lireJourUtc(jour: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return null;
  const [annee, mois, date] = jour.split("-").map(Number) as [number, number, number];
  const temps = Date.UTC(annee, mois - 1, date);
  const lu = new Date(temps);
  return lu.getUTCMonth() === mois - 1 && lu.getUTCDate() === date ? temps : null;
}

function estFinValide(finLe: string | null, aujourdhui: string): boolean {
  if (finLe === null) return false;
  const fin = lireJourUtc(finLe);
  const debut = lireJourUtc(aujourdhui);
  if (fin === null || debut === null) return false;
  return fin > debut && fin <= debut + FIN_BON_PLAN_MAX_JOURS * JOUR_MS;
}

export function validerArticleActus(brouillon: BrouillonArticleActus, aujourdhui: string): ResultatValidationArticleActus {
  const champs: ChampArticleActus[] = [];
  const titre = nettoyerLigne(brouillon.titre);
  const accroche = nettoyerLigne(brouillon.accroche);
  const paragraphes = decouperParagraphes(brouillon.texte);
  const longueurTexte = paragraphes.join("\n\n").length;
  const citation = nettoyerLigne(brouillon.citation);
  const lieux = [...new Set(brouillon.lieux)];
  const bornes = LIEUX_RUBRIQUE_ACTUS[brouillon.rubrique];
  const bonPlan = brouillon.rubrique === "bon-plan";

  if (!brouillon.couverture) champs.push("couverture");
  if (!estLigneValide(titre, TITRE_ACTUS_MIN, TITRE_ACTUS_MAX)) champs.push("titre");
  if (!estLigneValide(accroche, ACCROCHE_ACTUS_MIN, ACCROCHE_ACTUS_MAX)) champs.push("accroche");
  const texteValide = longueurTexte >= TEXTE_ACTUS_MIN && longueurTexte <= TEXTE_ACTUS_MAX && paragraphes.length <= PARAGRAPHES_ACTUS_MAX;
  if (!texteValide || paragraphes.some(contientMotInterdit)) champs.push("texte");
  if (citation.length > 0 && !estLigneValide(citation, 1, CITATION_ACTUS_MAX)) champs.push("citation");
  if (!Number.isInteger(brouillon.photos) || brouillon.photos < 0 || brouillon.photos > PHOTOS_ACTUS_MAX) champs.push("photos");
  if (lieux.length !== brouillon.lieux.length || lieux.length < bornes.min || lieux.length > bornes.max || !lieux.every((id) => Number.isInteger(id) && id >= 0)) {
    champs.push("lieux");
  }
  if (bonPlan && !estFinValide(brouillon.finLe, aujourdhui)) champs.push("fin");
  if (brouillon.collaboration === null) champs.push("collaboration");

  if (champs.length > 0 || brouillon.collaboration === null) return { ok: false, champs };
  return {
    ok: true,
    article: {
      rubrique: brouillon.rubrique,
      titre,
      accroche,
      paragraphes,
      citation: citation.length > 0 ? citation : null,
      photos: brouillon.photos,
      lieux,
      collaboration: brouillon.collaboration,
      finLe: bonPlan ? brouillon.finLe : null,
    },
  };
}
