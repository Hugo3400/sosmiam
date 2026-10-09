import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import { MESSAGES_SERVICE, type MessageService } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** « 2026-10-12T09:00:00Z » → « 12 octobre 2026 » (jour de ton téléphone) ; null si la date est illisible */
function lireJour(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return formaterDateLongue(`${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`);
}

/**
 * Remplace {lieu} sans bégayer (« chez Nonna Lia » plutôt que « chez Chez Nonna Lia », « du Chou Rieur » plutôt que
 * « de Le Chou Rieur ») ; quand le nom n'est pas connu, « Ce lieu » en début de phrase et « ce lieu » ailleurs.
 */
function remplirLieu(modele: string, lieu: string | null): string {
  if (!lieu) return remplirModele(modele.replace(/^\{lieu\}/, "Ce lieu"), { lieu: "ce lieu" });
  const accorde = modele.replace(/\bchez \{lieu\}/g, () => direChezLieu(lieu)).replace(/\bde \{lieu\}/g, () => direDeLieu(lieu));
  return remplirModele(accorde, { lieu });
}

/**
 * Le texte d'un échec des visites (addition, QR du comptoir, position…), prêt à afficher : le message partagé avec le site
 * (MESSAGES_SERVICE), rempli avec la distance, l'imprécision, le lieu ou la date de fin de pause. Si un détail manque,
 * la phrase est tournée autrement plutôt que de laisser une accolade ou un trou.
 */
export function decrireEchecVisite(erreur: ErreurService, details?: DetailsErreur, lieuNom?: string): MessageService {
  const modele = MESSAGES_SERVICE[erreur];
  const lieu = details?.lieu ?? lieuNom ?? null;
  let { titre, texte } = modele;

  if (erreur === "hors-zone" && typeof details?.distanceM !== "number") {
    texte = "On te situe un peu trop loin de {lieu}. Pour valider, il faut être sur place.";
  }
  if (erreur === "position-imprecise" && typeof details?.precisionM !== "number") {
    texte = "Il ne sait pas bien où tu es, c'est trop flou pour valider. Approche-toi d'une fenêtre, puis réessaie.";
  }
  const jour = lireJour(details?.jusqua);
  if (erreur === "compte-limite" && !jour) titre = "Validations en pause pour l'instant";

  const valeurs: Record<string, string> = {};
  if (typeof details?.distanceM === "number") valeurs.distance = formaterDistance(details.distanceM / 1000);
  if (typeof details?.precisionM === "number") valeurs.precision = formaterDistance(details.precisionM / 1000);
  if (jour) valeurs.date = jour;

  return {
    emoji: modele.emoji,
    titre: remplirLieu(remplirModele(titre, valeurs), lieu),
    texte: remplirLieu(remplirModele(texte, valeurs), lieu),
  };
}
