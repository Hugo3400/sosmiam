import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_MESSAGE_MOMENT_PAR_LANGUE } from "~/contenus/textes-blocs-ce-soir";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import type { ChoixFin } from "~/fonctions/pro/lister-fins-ce-soir";

const HEURE_MS = 60 * 60_000;

/** Combien de temps garder le message du moment : jusqu'à la fermeture (si on la connaît), 1 h, 3 h ou 24 h (le maximum). */
export function listerDureesMessage(maintenant: Date, fermeture: string | null, langue: Langue): ChoixFin[] {
  const T = choisirTextes(TEXTES_MESSAGE_MOMENT_PAR_LANGUE, langue);
  const dans = (heures: number, marge = 0) => new Date(maintenant.getTime() + heures * HEURE_MS - marge).toISOString();
  return [
    ...(fermeture ? [{ cle: "fermeture", libelle: T.jusquaFermeture(ecrireHeureLangue(fermeture, langue)), jusqua: null }] : []),
    { cle: "1h", libelle: T.pendant1h, jusqua: dans(1) },
    { cle: "3h", libelle: T.pendant3h, jusqua: dans(3) },
    // Une minute de marge : 24 h est le maximum permis par le serveur
    { cle: "24h", libelle: T.pendant24h, jusqua: dans(24, 60_000) },
  ];
}
