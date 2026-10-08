import type { LieuSaisi } from "../../services/gestion/lieux.ts";
import { ChampInvalide, lireChoix, lireListe, lireNombre, lireTexte } from "./lire-champs.ts";

// Mêmes valeurs que packages/commun/src/types/lieu.ts (TypeLieu, EnvieLieu)
const TYPES = ["resto", "patisserie", "bar", "sortie"] as const;
const ENVIES = ["terrasse", "vege", "amoureux", "potes", "famille"] as const;
const PRIX = ["€", "€€", "€€€"] as const;
const STATUTS = ["brouillon", "publie", "masque"] as const;
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

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
  };
}
