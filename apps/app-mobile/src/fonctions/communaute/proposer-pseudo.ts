import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";

import { potesExemples } from "~/contenus/potes-exemples";

// Place gardée pour les chiffres : la racine fait au plus 16 caractères, le pseudo au plus 20
const LONGUEUR_MAX_RACINE = 16;
// Racine de secours quand le prénom n'a aucune lettre latine (« 李 ») ou qu'il tombe sur un mot interdit
const RACINE_DE_SECOURS = "miam";
const ESSAIS = 30;

/**
 * Propose un pseudo à partir du prénom : en minuscules, sans accents, suivi de chiffres au hasard (« Léa-Rose » → « lea.rose42 »),
 * de la forme FORME_PSEUDO (estPseudoValide) et différent des pseudos des potes d'exemple. L'unicité pour de vrai se vérifiera avec les comptes (API).
 */
export function proposerPseudo(prenom: string, hasard: () => number = Math.random): string {
  const racine =
    prenom
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/ß/g, "ss")
      // Espaces, tirets et apostrophes deviennent un seul point (« Jean-Pierre » → « jean.pierre »)
      .replace(/[^a-z0-9]+/g, ".")
      .slice(0, LONGUEUR_MAX_RACINE)
      .replace(/^\.+|\.+$/g, "") || RACINE_DE_SECOURS;
  const base = contientMotInterdit(racine) ? RACINE_DE_SECOURS : racine;
  const pris = new Set(potesExemples.map((pote) => pote.pseudo));

  for (let essai = 0; essai < ESSAIS; essai++) {
    // 2 chiffres d'abord (« lea42 »), 3 si ça coince
    const chiffres = essai < ESSAIS / 2 ? 10 + Math.floor(hasard() * 90) : 100 + Math.floor(hasard() * 900);
    const candidat = `${base}${chiffres}`;
    if (estPseudoValide(candidat) && !pris.has(candidat)) return candidat;
  }
  // Ne devrait jamais arriver (hasard truqué) : un pseudo de secours, valable lui aussi
  return `${RACINE_DE_SECOURS}${Date.now() % 100_000}`;
}
