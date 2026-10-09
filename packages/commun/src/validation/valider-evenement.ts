import type { ChampEvenement, ReglageEvenement, TarifEvenement, TypeEvenement } from "../types/evenement.ts";
import {
  DESCRIPTION_EVENEMENT_MAX, DUREE_EVENEMENT_MAX_MS, HORIZON_EVENEMENT_MS, PLACES_EVENEMENT_MAX, PLACES_EVENEMENT_MIN,
  PRIX_EVENEMENT_MAX_CENTIMES, SEMAINE_MS, TARIFS_EVENEMENT, TITRE_EVENEMENT_MAX, TITRE_EVENEMENT_MIN, TYPES_EVENEMENT,
} from "../regles/evenements.ts";
import { contientOpenBar } from "../fonctions/evenements/contient-open-bar.ts";
import { parleDAlcool } from "../fonctions/prevention/parle-d-alcool.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

export type ResultatValidationEvenement =
  | { ok: true; evenement: ReglageEvenement }
  | { ok: false; erreur: "evenement-invalide"; champ: ChampEvenement };

/** Une date ISO 8601 avec son fuseau (« Z » ou « +02:00 ») : jamais une heure sans fuseau, qui dépendrait de la machine */
const FORME_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/** L'instant arrondi à la minute (en dessous), ou null s'il est mal écrit */
function lireInstant(brut: unknown): number | null {
  if (typeof brut !== "string" || !FORME_INSTANT.test(brut)) return null;
  const ms = Date.parse(brut);
  return Number.isNaN(ms) ? null : Math.floor(ms / 60_000) * 60_000;
}

/** Un entier entre deux bornes, ou null */
const lireEntier = (brut: unknown, min: number, max: number): number | null =>
  typeof brut === "number" && Number.isInteger(brut) && brut >= min && brut <= max ? brut : null;

/** Une ligne : espaces en trop retirés */
const nettoyerLigne = (texte: string) => texte.replace(/\s+/g, " ").trim();

/** Un paragraphe : espaces en trop retirés, retours à la ligne gardés (une ligne vide au plus d'affilée) */
const nettoyerParagraphe = (texte: string) =>
  texte
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((ligne) => ligne.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Vérifie un événement envoyé par l'équipe d'un lieu (mode pro, espace pro, API), dans l'ordre du formulaire : titre (3 à
 * 60 caractères, sans gros mot), type, description (500 caractères, vide permis, sans gros mot), début (à venir, 3 mois à
 * l'avance au plus ; `debutGarde` : le début déjà enregistré, gardé tel quel même s'il est passé, pour modifier un
 * événement de chaque semaine déjà commencé), fin (après le début, 24 h au plus), « chaque semaine » jusqu'à une date (au
 * moins une semaine après le début, 3 mois à l'avance au plus), tarif, prix (tarif « prix » seulement, 500 € au plus),
 * places, case « alcool ».
 * « Alcool » est coché d'office si le titre ou la description parle d'alcool ; un événement avec alcool ne promet jamais
 * de boire à volonté (« open bar », « à volonté », « illimité »…). Rend l'événement nettoyé (textes sans espaces en trop,
 * dates ISO à la minute, prix à null hors tarif « prix ») ou le premier champ à corriger.
 */
export function validerEvenement(brut: unknown, maintenant: Date, debutGarde: string | null = null): ResultatValidationEvenement {
  const refuser = (champ: ChampEvenement): ResultatValidationEvenement => ({ ok: false, erreur: "evenement-invalide", champ });
  const r = (typeof brut === "object" && brut !== null && !Array.isArray(brut) ? brut : {}) as Partial<Record<ChampEvenement, unknown>>;
  const horizon = maintenant.getTime() + HORIZON_EVENEMENT_MS;

  if (typeof r.titre !== "string") return refuser("titre");
  const titre = nettoyerLigne(r.titre);
  if (titre.length < TITRE_EVENEMENT_MIN || titre.length > TITRE_EVENEMENT_MAX || contientMotInterdit(titre)) return refuser("titre");

  if (typeof r.type !== "string" || !(TYPES_EVENEMENT as readonly string[]).includes(r.type)) return refuser("type");
  const type = r.type as TypeEvenement;

  if (r.description !== undefined && r.description !== null && typeof r.description !== "string") return refuser("description");
  const description = nettoyerParagraphe(r.description ?? "");
  if (description.length > DESCRIPTION_EVENEMENT_MAX || (description !== "" && contientMotInterdit(description))) return refuser("description");

  const debut = lireInstant(r.debut);
  const garde = debutGarde === null ? null : lireInstant(debutGarde);
  if (debut === null || debut > horizon || (debut < maintenant.getTime() && debut !== garde)) return refuser("debut");

  let fin: number | null = null;
  if (r.fin !== undefined && r.fin !== null) {
    fin = lireInstant(r.fin);
    if (fin === null || fin <= debut || fin - debut > DUREE_EVENEMENT_MAX_MS) return refuser("fin");
  }

  let hebdoJusqua: number | null = null;
  if (r.hebdoJusqua !== undefined && r.hebdoJusqua !== null) {
    hebdoJusqua = lireInstant(r.hebdoJusqua);
    if (hebdoJusqua === null || hebdoJusqua < debut + SEMAINE_MS || hebdoJusqua > horizon) return refuser("hebdoJusqua");
  }

  if (typeof r.tarif !== "string" || !(TARIFS_EVENEMENT as readonly string[]).includes(r.tarif)) return refuser("tarif");
  const tarif = r.tarif as TarifEvenement;

  let prixCentimes: number | null = null;
  if (tarif === "prix") {
    prixCentimes = lireEntier(r.prixCentimes, 1, PRIX_EVENEMENT_MAX_CENTIMES);
    if (prixCentimes === null) return refuser("prixCentimes");
  }

  let places: number | null = null;
  if (r.places !== undefined && r.places !== null) {
    places = lireEntier(r.places, PLACES_EVENEMENT_MIN, PLACES_EVENEMENT_MAX);
    if (places === null) return refuser("places");
  }

  if (r.alcool !== undefined && typeof r.alcool !== "boolean") return refuser("alcool");
  const alcool = r.alcool === true || parleDAlcool(`${titre} · ${description}`);
  // Jamais d'« open bar » : le champ qui le promet est à corriger
  if (alcool && contientOpenBar(titre)) return refuser("titre");
  if (alcool && contientOpenBar(description)) return refuser("description");

  const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());
  return {
    ok: true,
    evenement: { titre, type, description, debut: iso(debut)!, fin: iso(fin), hebdoJusqua: iso(hebdoJusqua), tarif, prixCentimes, places, alcool },
  };
}
