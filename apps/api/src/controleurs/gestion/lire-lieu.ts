import type { LieuSaisi, ModificationLot } from "../../services/gestion/lieux.ts";
import { ChampInvalide, lireChoix, lireListe, lireNombre, lireTexte } from "./lire-champs.ts";

// Mêmes valeurs que packages/commun/src/types/lieu.ts (TypeLieu, EnvieLieu)
const TYPES = ["resto", "patisserie", "bar", "sortie"] as const;
const ENVIES = ["terrasse", "vege", "amoureux", "potes", "famille"] as const;
const PRIX = ["€", "€€", "€€€"] as const;
const STATUTS = ["brouillon", "publie", "masque"] as const;
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
// Infos pratiques : mêmes valeurs que packages/commun/src/types/infos-pratiques.ts
const ANIMAUX = ["bienvenus", "terrasse", "non"] as const;
const PAIEMENTS = ["cb", "sans-contact", "especes", "tickets-resto", "cheques-vacances"] as const;
const RESERVATIONS = ["inutile", "conseillee", "obligatoire"] as const;
const OUI_NON = ["accessible", "terrasse", "wifi", "enfants", "parking"] as const;

function lireOuverture(valeur: unknown) {
  if (!Array.isArray(valeur) || valeur.length > 14) throw new ChampInvalide("ouverture");
  return valeur.map((creneau) => {
    const { jours, de, a } = (creneau ?? {}) as Record<string, unknown>;
    if (!Array.isArray(jours) || jours.length === 0 || jours.some((jour) => !Number.isInteger(jour) || jour < 0 || jour > 6)) {
      throw new ChampInvalide("ouverture");
    }
    if (typeof de !== "string" || typeof a !== "string" || !HEURE.test(de) || !HEURE.test(a)) throw new ChampInvalide("ouverture");
    return { jours: [...new Set(jours as number[])].sort(), de, a };
  });
}

/** Identifiants d'une sélection (« ids » : 1 à 500 nombres entiers positifs, sans doublon). */
export function lireIds(corps: Record<string, unknown>): number[] {
  const ids = corps.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || ids.some((id) => !Number.isInteger(id) || id < 1 || id > 1e9)) {
    throw new ChampInvalide("ids");
  }
  return [...new Set(ids as number[])];
}

/** Modification groupée de fiches : seuls les champs donnés changent (au moins un). */
export function lireModificationLot(corps: Record<string, unknown>): ModificationLot {
  const modification: ModificationLot = {};
  if (corps.statut !== undefined) modification.statut = lireChoix(corps, "statut", STATUTS);
  if (corps.ville !== undefined) modification.ville = lireTexte(corps, "ville", 80, true);
  if (corps.quartier !== undefined) modification.quartier = lireTexte(corps, "quartier", 60, true);
  if (corps.type !== undefined) modification.type = lireChoix(corps, "type", TYPES);
  if (corps.prix !== undefined) modification.prix = lireChoix(corps, "prix", PRIX);
  if (corps.reservable !== undefined) {
    if (typeof corps.reservable !== "boolean") throw new ChampInvalide("reservable");
    modification.reservable = corps.reservable;
  }
  if (Object.keys(modification).length === 0) throw new ChampInvalide("modification");
  return modification;
}

/**
 * Infos pratiques envoyées (animaux, accès, équipements, paiements, réservation), toutes facultatives : null = pas
 * renseigné. Un champ absent de la demande n'est pas rendu, pour ne jamais effacer ce que le lieu a rempli.
 */
function lireInfosPratiques(corps: Record<string, unknown>): Partial<LieuSaisi> {
  const infos: Partial<LieuSaisi> = {};
  const choixOuNull = <T extends string>(champ: string, choix: readonly T[]) => (corps[champ] === null || corps[champ] === "" ? null : lireChoix(corps, champ, choix));
  if (corps.animaux !== undefined) infos.animaux = choixOuNull("animaux", ANIMAUX);
  if (corps.reservation !== undefined) infos.reservation = choixOuNull("reservation", RESERVATIONS);
  if (corps.paiements !== undefined) infos.paiements = lireListe(corps, "paiements", PAIEMENTS.length, 20, PAIEMENTS);
  for (const champ of OUI_NON) {
    if (corps[champ] === undefined) continue;
    if (corps[champ] !== null && typeof corps[champ] !== "boolean") throw new ChampInvalide(champ);
    infos[champ] = corps[champ] as boolean | null;
  }
  return infos;
}

/** Lit et vérifie une fiche de lieu envoyée par le logiciel. Lève ChampInvalide sur le premier champ qui ne va pas. */
export function lireLieuSaisi(corps: Record<string, unknown>): LieuSaisi {
  const couleurs = lireListe(corps, "couleurs", 2, 9);
  if (couleurs.length !== 2 || couleurs.some((couleur) => !/^#[0-9a-fA-F]{6}$/.test(couleur))) throw new ChampInvalide("couleurs");
  const siteWeb = lireTexte(corps, "siteWeb", 200);
  if (siteWeb && !/^https:\/\/[^\s]+$/.test(siteWeb)) throw new ChampInvalide("siteWeb");
  return {
    nom: lireTexte(corps, "nom", 80, true),
    type: lireChoix(corps, "type", TYPES),
    emoji: lireTexte(corps, "emoji", 16, true),
    info: lireTexte(corps, "info", 60, true),
    texte: lireTexte(corps, "texte", 1000, true),
    adresse: lireTexte(corps, "adresse", 160),
    quartier: lireTexte(corps, "quartier", 60, true),
    ville: lireTexte(corps, "ville", 80, true),
    latitude: lireNombre(corps, "latitude", -90, 90, false),
    longitude: lireNombre(corps, "longitude", -180, 180, false),
    prix: lireChoix(corps, "prix", PRIX),
    prixMoyen: lireNombre(corps, "prixMoyen", 0, 1000),
    couleurs,
    horaires: lireTexte(corps, "horaires", 160, true),
    ouverture: lireOuverture(corps.ouverture ?? []),
    plat: lireTexte(corps, "plat", 80, true),
    tags: lireListe(corps, "tags", 12, 40),
    envies: lireListe(corps, "envies", ENVIES.length, 20, ENVIES),
    reservable: corps.reservable === true,
    telephone: lireTexte(corps, "telephone", 30),
    siteWeb,
    instagram: lireTexte(corps, "instagram", 60)?.replace(/^@/, "") ?? null,
    decouvertPar: lireTexte(corps, "decouvertPar", 40),
    statut: lireChoix(corps, "statut", STATUTS),
    note: lireTexte(corps, "note", 1000),
    ...lireInfosPratiques(corps),
  };
}

/** Une fiche valable de départ : les champs acceptés d'une suggestion y sont posés, puis vérifiés comme dans le formulaire */
const FICHE_DE_DEPART = {
  nom: "x", type: "resto", emoji: "x", info: "x", texte: "x", quartier: "x", ville: "x", prix: "€", couleurs: ["#FFD60A", "#FF4D3D"],
  horaires: "x", plat: "x", statut: "brouillon",
};

/**
 * Les champs acceptés d'une suggestion, vérifiés avec les mêmes règles que le formulaire de lieu (ChampInvalide sur le
 * premier qui ne va pas). Seuls ces champs sont vérifiés : une fiche importée incomplète (sans quartier…) n'empêche rien.
 */
export function lireChampsSuggeres(proposition: Record<string, unknown>, champs: readonly string[]): Partial<LieuSaisi> {
  const verifiee = lireLieuSaisi({ ...FICHE_DE_DEPART, ...Object.fromEntries(champs.map((champ) => [champ, proposition[champ]])) });
  return Object.fromEntries(champs.map((champ) => [champ, verifiee[champ as keyof LieuSaisi]])) as Partial<LieuSaisi>;
}

const EMOJIS_TYPE: Record<(typeof TYPES)[number], string> = { resto: "🍽️", patisserie: "🥐", bar: "🍹", sortie: "🎳" };

/**
 * Une ligne d'import de lieux (fichier CSV lu par le logiciel) : seuls le nom et la ville sont obligatoires ; ce qui est
 * donné est vérifié comme dans le formulaire, le reste est laissé vide. La fiche arrive en brouillon : le contrôle
 * qualité dira ce qu'il faut compléter avant de la mettre en ligne.
 */
export function lireLieuImporte(corps: Record<string, unknown>): LieuSaisi {
  const vide = (champ: string) => corps[champ] === undefined || corps[champ] === null || corps[champ] === "";
  const type = vide("type") ? "resto" : lireChoix(corps, "type", TYPES);
  const siteWeb = lireTexte(corps, "siteWeb", 200);
  if (siteWeb && !/^https:\/\/[^\s]+$/.test(siteWeb)) throw new ChampInvalide("siteWeb");
  return {
    nom: lireTexte(corps, "nom", 80, true),
    type,
    emoji: EMOJIS_TYPE[type],
    info: lireTexte(corps, "info", 60) ?? "",
    texte: lireTexte(corps, "texte", 1000) ?? "",
    adresse: lireTexte(corps, "adresse", 160),
    quartier: lireTexte(corps, "quartier", 60) ?? "",
    ville: lireTexte(corps, "ville", 80, true),
    latitude: lireNombre(corps, "latitude", -90, 90, false),
    longitude: lireNombre(corps, "longitude", -180, 180, false),
    prix: vide("prix") ? "€€" : lireChoix(corps, "prix", PRIX),
    prixMoyen: lireNombre(corps, "prixMoyen", 0, 1000),
    couleurs: ["#FFD60A", "#FF4D3D"],
    horaires: lireTexte(corps, "horaires", 160) ?? "",
    ouverture: [],
    plat: lireTexte(corps, "plat", 80) ?? "",
    tags: [],
    envies: [],
    reservable: false,
    telephone: lireTexte(corps, "telephone", 30),
    siteWeb,
    instagram: lireTexte(corps, "instagram", 60)?.replace(/^@/, "") ?? null,
    decouvertPar: null,
    statut: "brouillon",
    note: null,
  };
}
