import type { ValiderPropositionLieu } from "../commun/charger-valider-proposition-lieu.ts";
import { retirerChampsInchanges } from "../suggestions/retirer-champs-inchanges.ts";

/** Champs que le gérant change tout de suite (mêmes noms que les colonnes de Lieu) */
const DIRECTS = [
  "horaires", "texte", "telephone", "siteWeb", "instagram",
  "animaux", "accessible", "terrasse", "wifi", "enfants", "parking", "paiements", "reservation",
];
/** Champs qui passent par l'équipe */
const PAR_EQUIPE = ["nom", "adresse"];
/** Colonnes obligatoires de Lieu : effacées, elles deviennent un texte vide (pas null) */
const TEXTES_OBLIGATOIRES = ["horaires", "texte"];

type Valeur = string | boolean | string[] | null;
export type ModificationPreparee =
  | { ok: true; directs: Record<string, Valeur>; parEquipe: Record<string, Valeur>; message: string | null }
  | { ok: false; champ: string };

const estVide = (valeur: unknown) =>
  valeur === null || (typeof valeur === "string" && valeur.trim() === "") || (Array.isArray(valeur) && valeur.length === 0);

/**
 * Prépare un PATCH de l'espace pro sur une fiche. Contrairement à un client, le gérant peut EFFACER une info : un champ
 * direct envoyé à null, "" ou [] devient inconnu (null ; texte vide pour les horaires et le texte, colonnes
 * obligatoires ; liste vide pour les paiements). Les autres valeurs passent par `valider` (validerPropositionLieu de
 * packages/commun : longueurs, gros mots, numéro français, site en https…). Le nom et l'adresse ne s'effacent pas : ils
 * sont vérifiés de la même façon et mis à part pour l'équipe. Enfin, seuls les champs qui changent vraiment par rapport
 * à `fiche` restent. Un champ inconnu : « autre » ; rien d'envoyé : « vide ».
 */
export function preparerModificationFiche(
  corps: Record<string, unknown>, fiche: Record<string, unknown>, valider: ValiderPropositionLieu,
): ModificationPreparee {
  const champs = Object.keys(corps).filter((champ) => champ !== "message");
  if (champs.some((champ) => !DIRECTS.includes(champ) && !PAR_EQUIPE.includes(champ))) return { ok: false, champ: "autre" };
  if (champs.length === 0) return { ok: false, champ: "vide" };

  const effaces: Record<string, Valeur> = {};
  const aVerifier: Record<string, unknown> = {};
  for (const champ of champs) {
    if (DIRECTS.includes(champ) && estVide(corps[champ])) {
      effaces[champ] = TEXTES_OBLIGATOIRES.includes(champ) ? "" : champ === "paiements" ? [] : null;
    } else {
      aVerifier[champ] = corps[champ];
    }
  }

  let verifies: Record<string, Valeur> = {};
  let message: string | null = null;
  if (Object.keys(aVerifier).length > 0) {
    const resultat = valider({ proposition: aVerifier, message: corps.message });
    if (!resultat.ok) return { ok: false, champ: resultat.champ };
    verifies = resultat.suggestion.proposition as Record<string, Valeur>;
    message = resultat.suggestion.message;
  }

  const tout: Record<string, Valeur> = { ...verifies, ...effaces };
  const garder = (liste: string[]) => Object.fromEntries(Object.entries(tout).filter(([champ]) => liste.includes(champ)));
  return {
    ok: true,
    directs: retirerChampsInchanges(garder(DIRECTS), fiche) as Record<string, Valeur>,
    parEquipe: retirerChampsInchanges(garder(PAR_EQUIPE), fiche) as Record<string, Valeur>,
    message,
  };
}
