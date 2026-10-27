import {
  LONGUEUR_MAX_EXPLICATION_SIGNALEMENT,
  LONGUEUR_MAX_PRECISION_SIGNALEMENT,
  LONGUEUR_MIN_EXPLICATION_SIGNALEMENT,
  RAISONS_AVEC_EXPLICATION_OBLIGATOIRE,
} from "../../../../../packages/commun/src/regles/signalement.ts";
import type { SignalementArticleActus } from "../../../../../packages/commun/src/types/signalement.ts";
import { RAISONS_SIGNALER_ARTICLE_ACTUS } from "~/contenus/signaler-article-actus";
import { ecrireErreursSignalerArticleActus } from "~/fonctions/actus/ecrire-erreurs-signaler-article-actus";

export type ChampSignalerArticleActus = "raison" | "explication";

export type ValeursSignalerArticleActus = { raison: string; precision: string; explication: string };

export type CodeErreurSignalerArticleActus = "raison" | "explicationCourte" | "explicationLongue";

export type CibleSignalerArticleActus = { articleId: number; lieuId: number | null };

export type LectureSignalerArticleActus =
  | { ok: true; signalement: SignalementArticleActus; piege: string; valeurs: ValeursSignalerArticleActus }
  | {
      ok: false;
      erreurs: Partial<Record<ChampSignalerArticleActus, string>>;
      codes: Partial<Record<ChampSignalerArticleActus, CodeErreurSignalerArticleActus>>;
      valeurs: ValeursSignalerArticleActus;
    };

export type ReponseSignalerArticleActus =
  | { ok: true }
  | {
      ok: false;
      message: string;
      champ?: ChampSignalerArticleActus;
      erreurs?: Partial<Record<ChampSignalerArticleActus, string>>;
      valeurs?: ValeursSignalerArticleActus;
    };

export const ORDRE_CHAMPS_SIGNALER_ARTICLE_ACTUS: readonly ChampSignalerArticleActus[] = ["raison", "explication"];

function lireTexte(formulaire: FormData, cle: string): string {
  const valeur = formulaire.get(cle);
  return typeof valeur === "string" ? valeur.replace(/\r\n?/g, "\n").trim() : "";
}

export function lireFormulaireSignalerArticleActus(formulaire: FormData, cible: CibleSignalerArticleActus): LectureSignalerArticleActus {
  const raison = RAISONS_SIGNALER_ARTICLE_ACTUS.find((une) => une.cle === lireTexte(formulaire, "raison")) ?? null;
  const precisionLue = raison ? lireTexte(formulaire, `precision-${raison.cle}`) : "";
  const precision = raison?.precisions.includes(precisionLue) && precisionLue.length <= LONGUEUR_MAX_PRECISION_SIGNALEMENT ? precisionLue : null;
  const explication = lireTexte(formulaire, "explication");
  const valeurs: ValeursSignalerArticleActus = { raison: raison?.cle ?? "", precision: precision ?? "", explication };

  const codes: Partial<Record<ChampSignalerArticleActus, CodeErreurSignalerArticleActus>> = {};
  if (!raison) codes.raison = "raison";
  if (explication.length > LONGUEUR_MAX_EXPLICATION_SIGNALEMENT) codes.explication = "explicationLongue";
  else if (raison && RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(raison.cle) && explication.length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT) {
    codes.explication = "explicationCourte";
  }
  if (!raison || Object.keys(codes).length > 0) return { ok: false, erreurs: ecrireErreursSignalerArticleActus(codes, "fr"), codes, valeurs };

  const piege = formulaire.get("site_web");
  const commun = { raison: raison.cle, precision, explication };
  const signalement: SignalementArticleActus =
    cible.lieuId === null
      ? { cible: "article-actu", articleId: cible.articleId, ...commun }
      : { cible: "reponse-actu", articleId: cible.articleId, lieuId: cible.lieuId, ...commun };
  return { ok: true, signalement, piege: typeof piege === "string" ? piege : "", valeurs };
}
