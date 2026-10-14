import {
  APRES_HEURE_MAX, APRES_HEURE_MIN, EMOJI_DEFI_MAX, EMOJIS_ALCOOL_DEFI, FILTRES_PAR_MESURE, MESURES_DEFI, OBJECTIF_DEFI_MAX, OBJECTIF_DEFI_MIN, ORDRE_DEFI_MAX,
  POINTS_DEFI_MAX, POINTS_DEFI_MIN, TEXTE_DEFI_MAX, TITRE_DEFI_MAX, TYPES_LIEU_DEFI,
} from "../regles/defis.ts";
import { parleDAlcool } from "../fonctions/prevention/parle-d-alcool.ts";
import type { BrouillonDefi, ChampDefi, FiltreDefi, FiltresDefi, MesureDefi } from "../types/defi.ts";
import type { TypeLieu } from "../types/lieu.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

export type ResultatValidationDefi = { ok: true; defi: BrouillonDefi } | { ok: false; erreur: "champ-invalide"; champ: ChampDefi };

/** Une ligne : espaces en trop retirés (retours à la ligne compris : titre et texte s'affichent sur une carte) */
const nettoyerLigne = (texte: string) => texte.replace(/\s+/g, " ").trim();

/** Un entier entre deux bornes, ou null */
const lireEntier = (brut: unknown, min: number, max: number): number | null =>
  typeof brut === "number" && Number.isInteger(brut) && brut >= min && brut <= max ? brut : null;

/** Un jour « AAAA-MM-JJ » qui existe (pas de 30 février), ou null */
function lireJour(brut: unknown): string | null {
  if (typeof brut !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(brut)) return null;
  const [annee, mois, jour] = brut.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return date.getUTCMonth() === mois - 1 && date.getUTCDate() === jour && annee >= 2026 && annee <= 2100 ? brut : null;
}

/** Un emoji (ou quelques-uns) : au moins un pictogramme, un drapeau ou un chiffre encadré (« 3️⃣ »), ni lettre ni espace, ni alcool */
function lireEmoji(brut: unknown): string | null {
  if (typeof brut !== "string") return null;
  const emoji = brut.trim();
  if (emoji.length === 0 || emoji.length > EMOJI_DEFI_MAX || /[\p{L}\s]/u.test(emoji)) return null;
  if (EMOJIS_ALCOOL_DEFI.some((alcool) => emoji.includes(alcool))) return null;
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u.test(emoji) ? emoji : null;
}

/** Un titre ou un texte : une ligne de 1 à `max` caractères, sans gros mot ni alcool (un défi rapporte des points : loi Évin) */
function lireTexte(brut: unknown, max: number): string | null {
  if (typeof brut !== "string") return null;
  const texte = nettoyerLigne(brut);
  return texte.length >= 1 && texte.length <= max && !contientMotInterdit(texte) && !parleDAlcool(texte) ? texte : null;
}

/** Les filtres permis pour cette mesure, chacun bien formé ; null sans filtre ; false s'il y a quelque chose à corriger */
function lireFiltres(brut: unknown, mesure: MesureDefi): FiltresDefi | null | false {
  if (brut === undefined || brut === null) return null;
  if (typeof brut !== "object" || Array.isArray(brut)) return false;
  const permis: readonly FiltreDefi[] = FILTRES_PAR_MESURE[mesure];
  const recus = brut as Record<string, unknown>;
  if (!Object.keys(recus).every((cle) => (permis as readonly string[]).includes(cle))) return false;
  const filtres: FiltresDefi = {};
  // Dans l'ordre de FILTRES_PAR_MESURE : deux défis aux mêmes filtres s'écrivent pareil
  for (const filtre of permis) {
    const valeur = recus[filtre];
    if (valeur === undefined) continue;
    if (filtre === "typesLieu") {
      if (!Array.isArray(valeur) || valeur.length === 0) return false;
      if (!valeur.every((type) => typeof type === "string" && (TYPES_LIEU_DEFI as readonly string[]).includes(type))) return false;
      // Dans l'ordre de TYPES_LIEU_DEFI, une fois chacun
      filtres.typesLieu = TYPES_LIEU_DEFI.filter((type) => valeur.includes(type)) as TypeLieu[];
    } else if (filtre === "apresHeure") {
      const heure = lireEntier(valeur, APRES_HEURE_MIN, APRES_HEURE_MAX);
      if (heure === null) return false;
      filtres.apresHeure = heure;
    } else {
      // pendantSos, avecPhoto : seulement « true » (sans le filtre, tout compte déjà)
      if (valeur !== true) return false;
      filtres[filtre] = true;
    }
  }
  return Object.keys(filtres).length > 0 ? filtres : null;
}

/**
 * Vérifie un défi écrit dans le logiciel de gestion, dans l'ordre du formulaire : emoji (sans alcool), titre (1 à 60
 * caractères), texte (1 à 300), tous deux sans gros mot ni alcool, mesure connue, filtres permis pour cette mesure (types de
 * lieu sans « bar », heure de 12 à 23, « pendant un SOS » et « avec photo » à true), objectif (1 à 100), points (0 à 200),
 * premier jour et dernier jour « AAAA-MM-JJ » (dernier jour absent ou null : sans fin ; jamais avant le premier), publié
 * (faux si absent), ordre (0 à 999, 0 si absent). Un défi rapporte des points : rien n'y pousse à boire (loi Évin). Rend le
 * défi nettoyé (espaces en trop retirés, filtres dans un ordre fixe, filtres vides à null) ou le premier champ à corriger.
 */
export function validerDefi(brut: unknown): ResultatValidationDefi {
  const refuser = (champ: ChampDefi): ResultatValidationDefi => ({ ok: false, erreur: "champ-invalide", champ });
  const r = (typeof brut === "object" && brut !== null && !Array.isArray(brut) ? brut : {}) as Partial<Record<ChampDefi, unknown>>;

  const emoji = lireEmoji(r.emoji);
  if (emoji === null) return refuser("emoji");
  const titre = lireTexte(r.titre, TITRE_DEFI_MAX);
  if (titre === null) return refuser("titre");
  const texte = lireTexte(r.texte, TEXTE_DEFI_MAX);
  if (texte === null) return refuser("texte");

  if (typeof r.mesure !== "string" || !(MESURES_DEFI as readonly string[]).includes(r.mesure)) return refuser("mesure");
  const mesure = r.mesure as MesureDefi;
  const filtres = lireFiltres(r.filtres, mesure);
  if (filtres === false) return refuser("filtres");

  const objectif = lireEntier(r.objectif, OBJECTIF_DEFI_MIN, OBJECTIF_DEFI_MAX);
  if (objectif === null) return refuser("objectif");
  const points = lireEntier(r.points, POINTS_DEFI_MIN, POINTS_DEFI_MAX);
  if (points === null) return refuser("points");

  const debut = lireJour(r.debut);
  if (debut === null) return refuser("debut");
  const fin = r.fin === undefined || r.fin === null ? null : lireJour(r.fin);
  if ((r.fin !== undefined && r.fin !== null && fin === null) || (fin !== null && fin < debut)) return refuser("fin");

  if (r.publie !== undefined && typeof r.publie !== "boolean") return refuser("publie");
  const ordre = r.ordre === undefined ? 0 : lireEntier(r.ordre, 0, ORDRE_DEFI_MAX);
  if (ordre === null) return refuser("ordre");

  return { ok: true, defi: { emoji, titre, texte, mesure, filtres, objectif, points, debut, fin, publie: r.publie ?? false, ordre } };
}
