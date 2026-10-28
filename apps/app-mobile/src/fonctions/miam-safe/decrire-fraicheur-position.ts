import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE } from "~/contenus/textes-miam-safe-partage";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";

/** Depuis quand une position partagée n'a pas bougé : « à l'instant », « il y a 3 min », « à 21h30 » (une heure ou plus). */
export function decrireFraicheurPosition(leIso: string, langue: Langue, maintenant: Date = new Date()): string {
  const { fraicheur } = choisirTextes(TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE, langue);
  const ecart = maintenant.getTime() - new Date(leIso).getTime();
  if (Number.isNaN(ecart)) return "";
  if (ecart < 60_000) return fraicheur.instant;
  const minutes = Math.floor(ecart / 60_000);
  return minutes < 60 ? fraicheur.ilYa(minutes) : fraicheur.a(ecrireHeureLangue(leIso, langue));
}
