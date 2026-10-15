import { DELAI_MAX_SORTIE_JOURS, DELAI_MIN_SORTIE_MINUTES, LONGUEUR_MAX_TITRE_SORTIE } from "../regles/potes.ts";
import {
  LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS,
  MAX_ETIQUETTES_SORTIE_MIAMIS,
  MAX_PLACES_SORTIE_MIAMIS,
  MIN_PLACES_SORTIE_MIAMIS,
  TRANCHES_AGE,
} from "../regles/sorties-miamis.ts";
import { normaliserEtiquette } from "../fonctions/etiquettes/normaliser-etiquette.ts";
import type { RefusEtiquetteLibre } from "../types/etiquette.ts";
import type { EtiquetteSortieMiamis, NouvelleSortieMiamis, PublicSortieMiamis } from "../types/sorties-miamis.ts";
import { lireEtiquetteLibre } from "./lire-etiquette-libre.ts";
import { nettoyerTexteSocial } from "./nettoyer-texte-social.ts";
import { verifierTexteSocial } from "./verifier-texte-social.ts";

const MINUTE_MS = 60_000;
const JOUR_MS = 24 * 60 * MINUTE_MS;
const FORME_DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const ID_LIEU_MAX = 999_999_999;
const GENRES = ["femme", "homme", "autre"];

export type ChampNouvelleSortieMiamis = "titre" | "description" | "quand" | "lieuId" | "public" | "etiquettes" | "places" | "reglages";

export type ResultatNouvelleSortieMiamis =
  | { ok: true; sortie: NouvelleSortieMiamis }
  | { ok: false; champ: ChampNouvelleSortieMiamis; raison?: "mot-interdit" | RefusEtiquetteLibre };

type Brut = { [Champ in keyof NouvelleSortieMiamis]?: unknown };

function lirePublic(brut: unknown): PublicSortieMiamis | null {
  if (typeof brut !== "object" || brut === null) return null;
  const p = brut as { type?: unknown; genre?: unknown; tranche?: unknown };
  if (p.type === "tous" || p.type === "nouveaux" || p.type === "ambassadeurs") return { type: p.type };
  if (p.type === "genre" && GENRES.includes(String(p.genre))) return { type: "genre", genre: p.genre as "femme" | "homme" | "autre" };
  if (p.type === "age" && TRANCHES_AGE.some((t) => t === p.tranche)) return { type: "age", tranche: p.tranche as (typeof TRANCHES_AGE)[number] };
  return null;
}

function lireEtiquettes(brut: unknown): { ok: true; etiquettes: EtiquetteSortieMiamis[] } | { ok: false; raison?: RefusEtiquetteLibre } {
  if (!Array.isArray(brut) || brut.length > MAX_ETIQUETTES_SORTIE_MIAMIS) return { ok: false };
  const etiquettes: EtiquetteSortieMiamis[] = [];
  for (const element of brut) {
    const nom = typeof element === "object" && element !== null ? (element as { nom?: unknown }).nom : undefined;
    if (typeof nom !== "string") return { ok: false };
    const lue = lireEtiquetteLibre(nom);
    if (!lue.ok) return { ok: false, raison: lue.refus };
    if (etiquettes.some((e) => normaliserEtiquette(e.nom) === normaliserEtiquette(lue.nom))) continue;
    etiquettes.push({ nom: lue.nom, officielle: lue.officielle });
  }
  return { ok: true, etiquettes };
}

export function validerNouvelleSortieMiamis(s: Brut, maintenant: Date): ResultatNouvelleSortieMiamis {
  if (typeof s.titre !== "string") return { ok: false, champ: "titre" };
  const titre = verifierTexteSocial(s.titre, LONGUEUR_MAX_TITRE_SORTIE);
  if (titre === "mot-interdit") return { ok: false, champ: "titre", raison: "mot-interdit" };
  if (titre !== "ok") return { ok: false, champ: "titre" };

  const descriptionBrute = typeof s.description === "string" ? nettoyerTexteSocial(s.description) : null;
  if (descriptionBrute === null) return { ok: false, champ: "description" };
  if (descriptionBrute !== "") {
    const description = verifierTexteSocial(descriptionBrute, LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS);
    if (description === "mot-interdit") return { ok: false, champ: "description", raison: "mot-interdit" };
    if (description !== "ok") return { ok: false, champ: "description" };
  }

  const quand = typeof s.quand === "string" && FORME_DATE_ISO.test(s.quand) ? Date.parse(s.quand) : Number.NaN;
  const ecart = quand - maintenant.getTime();
  if (Number.isNaN(quand) || ecart < DELAI_MIN_SORTIE_MINUTES * MINUTE_MS || ecart > DELAI_MAX_SORTIE_JOURS * JOUR_MS) return { ok: false, champ: "quand" };

  if (typeof s.lieuId !== "number" || !Number.isInteger(s.lieuId) || s.lieuId < 0 || s.lieuId > ID_LIEU_MAX) return { ok: false, champ: "lieuId" };

  const publicSortie = lirePublic(s.public);
  if (!publicSortie) return { ok: false, champ: "public" };

  const etiquettes = lireEtiquettes(s.etiquettes);
  if (!etiquettes.ok) return { ok: false, champ: "etiquettes", ...(etiquettes.raison ? { raison: etiquettes.raison } : {}) };

  if (typeof s.places !== "number" || !Number.isInteger(s.places) || s.places < MIN_PLACES_SORTIE_MIAMIS || s.places > MAX_PLACES_SORTIE_MIAMIS) {
    return { ok: false, champ: "places" };
  }
  if (typeof s.placeGardeePourNouveau !== "boolean" || typeof s.recurrente !== "boolean") return { ok: false, champ: "reglages" };

  return {
    ok: true,
    sortie: {
      titre: nettoyerTexteSocial(s.titre),
      description: descriptionBrute,
      quand: new Date(quand).toISOString(),
      lieuId: s.lieuId,
      public: publicSortie,
      etiquettes: etiquettes.etiquettes,
      places: s.places,
      placeGardeePourNouveau: s.placeGardeePourNouveau,
      recurrente: s.recurrente,
    },
  };
}
