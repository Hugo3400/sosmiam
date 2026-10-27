import {
  LONGUEUR_MAX_EXPLICATION_SIGNALEMENT,
  LONGUEUR_MAX_PRECISION_SIGNALEMENT,
  LONGUEUR_MIN_EXPLICATION_SIGNALEMENT,
  RAISONS_AVEC_EXPLICATION_OBLIGATOIRE,
} from "../../../../../packages/commun/src/regles/signalement.ts";
import type { SignalementImageLieu } from "../../../../../packages/commun/src/types/signalement.ts";
import { RAISONS_SIGNALER_IMAGE } from "~/contenus/signaler-image";
import { ecrireErreursSignalerImage } from "~/fonctions/lieux/ecrire-erreurs-signaler-image";
import type { ImageSignalable } from "~/fonctions/lieux/lister-images-signalables";

export type ChampSignalerImage = "quelle" | "raison" | "explication";

export type ValeursSignalerImage = { quelle: string; raison: string; precision: string; explication: string };

export type CodeErreurSignalerImage = "quelle" | "raison" | "explicationCourte" | "explicationLongue";

export type LectureSignalerImage =
  | { ok: true; signalement: SignalementImageLieu; piege: string; valeurs: ValeursSignalerImage }
  | {
      ok: false;
      erreurs: Partial<Record<ChampSignalerImage, string>>;
      codes: Partial<Record<ChampSignalerImage, CodeErreurSignalerImage>>;
      valeurs: ValeursSignalerImage;
    };

export type ReponseSignalerImage =
  | { ok: true }
  | { ok: false; message: string; champ?: ChampSignalerImage; erreurs?: Partial<Record<ChampSignalerImage, string>>; valeurs?: ValeursSignalerImage };

export const ORDRE_CHAMPS_SIGNALER_IMAGE: readonly ChampSignalerImage[] = ["quelle", "raison", "explication"];

function lireTexte(formulaire: FormData, cle: string): string {
  const valeur = formulaire.get(cle);
  return typeof valeur === "string" ? valeur.replace(/\r\n?/g, "\n").trim() : "";
}

function estImage(valeur: string): valeur is ImageSignalable {
  return valeur === "banniere" || valeur === "logo";
}

export function lireFormulaireSignalerImage(formulaire: FormData, lieuId: number): LectureSignalerImage {
  const quelle = lireTexte(formulaire, "quelle");
  const raison = RAISONS_SIGNALER_IMAGE.find((une) => une.cle === lireTexte(formulaire, "raison")) ?? null;
  const precisionLue = raison ? lireTexte(formulaire, `precision-${raison.cle}`) : "";
  const precision = raison?.precisions.includes(precisionLue) && precisionLue.length <= LONGUEUR_MAX_PRECISION_SIGNALEMENT ? precisionLue : null;
  const explication = lireTexte(formulaire, "explication");
  const valeurs: ValeursSignalerImage = { quelle, raison: raison?.cle ?? "", precision: precision ?? "", explication };

  const codes: Partial<Record<ChampSignalerImage, CodeErreurSignalerImage>> = {};
  if (!estImage(quelle)) codes.quelle = "quelle";
  if (!raison) codes.raison = "raison";
  if (explication.length > LONGUEUR_MAX_EXPLICATION_SIGNALEMENT) codes.explication = "explicationLongue";
  else if (raison && RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(raison.cle) && explication.length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT) {
    codes.explication = "explicationCourte";
  }
  if (!estImage(quelle) || !raison || Object.keys(codes).length > 0) return { ok: false, erreurs: ecrireErreursSignalerImage(codes, "fr"), codes, valeurs };

  const piege = formulaire.get("site_web");
  return {
    ok: true,
    signalement: { cible: "image-lieu", lieuId, quelle, raison: raison.cle, precision, explication },
    piege: typeof piege === "string" ? piege : "",
    valeurs,
  };
}
