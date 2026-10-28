import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CLOCHE_PAR_LANGUE } from "~/contenus/textes-cloche";
import type { NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { NotificationCloche } from "~/hooks/utiliser-notifications";

export function decrireNotificationClocheCommunaute(n: NotificationCloche, qui: string, langue: Langue): NotificationDecrite | null {
  const T = choisirTextes(TEXTES_CLOCHE_PAR_LANGUE, langue);
  const titre = n.detail ? citer(n.detail, langue) : T.taSortie;
  const titreEnTete = `${titre.charAt(0).toUpperCase()}${titre.slice(1)}`;
  const id = n.cible?.id ?? "";
  const sortie = n.cible?.type === "miamis" ? ({ pathname: "/potes/miamis/sortie/[id]", params: { id } } as const) : null;
  const idee = n.cible?.type === "idee" ? ({ pathname: "/potes/miamis/idee/[id]", params: { id } } as const) : null;
  const decrire = (emoji: string, texte: string, ouvrir: NotificationDecrite["ouvrir"], indice: string): NotificationDecrite => ({
    emoji,
    texte: lierPonctuation(texte),
    ouvrir,
    ...(ouvrir ? { indice } : {}),
  });

  switch (n.sorte) {
    case "demande-sortie-miamis":
      return decrire("🙋", T.demandeSortie(qui, titre), sortie, T.indiceRepondre);
    case "arrivee-acceptee":
      return decrire("🎉", T.arriveeAcceptee(qui, titre), sortie, T.indiceSortieMiamis);
    case "liste-attente-miamis":
      return decrire("⏳", T.listeAttente(titre), sortie, T.indiceSortieMiamis);
    case "place-liberee-miamis":
      return decrire("🪑", T.placeLiberee(titre), sortie, T.indiceSortieMiamis);
    case "rappel-sortie-miamis":
      return decrire("⏰", T.rappelSortie(titre), sortie, T.indiceSortieMiamis);
    case "sortie-miamis-annulee":
      return decrire("🙅", T.sortieMiamisAnnulee(titreEnTete), null, "");
    case "invitation-habitue":
      return decrire("🔁", T.invitationHabitue(titreEnTete), sortie, T.indiceSortieMiamis);
    case "coucou-reciproque":
      return decrire("👋", T.coucouReciproque(qui), "/potes/miamis/qui-est-la", T.indiceQuiEstLa);
    case "idee-publiee":
      return decrire("💡", T.ideePubliee(titre), idee, T.indiceIdee);
    case "reponse-brigade":
      return decrire("🧑‍🍳", T.reponseBrigade(titre), idee, T.indiceIdee);
    case "idee-du-mois":
      return decrire("🏆", T.ideeDuMois(titreEnTete), idee, T.indiceIdee);
    default:
      return null;
  }
}
