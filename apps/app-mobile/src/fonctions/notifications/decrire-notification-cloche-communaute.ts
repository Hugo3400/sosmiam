import type { NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { NotificationCloche } from "~/hooks/utiliser-notifications";

export function decrireNotificationClocheCommunaute(n: NotificationCloche, qui: string): NotificationDecrite | null {
  const titre = n.detail ? `« ${n.detail} »` : "ta sortie";
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
      return decrire("🙋", `${qui} demande à venir à ${titre} : à toi de dire oui (ou pas).`, sortie, "Ouvre la sortie pour répondre");
    case "arrivee-acceptee":
      return decrire("🎉", `C'est oui ! ${qui} t'accueille dans ${titre} : la discussion est ouverte.`, sortie, "Ouvre la sortie");
    case "liste-attente-miamis":
      return decrire("⏳", `Acceptée, mais ${titre} est complète : te voilà sur la liste d'attente, au chaud.`, sortie, "Ouvre la sortie");
    case "place-liberee-miamis":
      return decrire("🪑", `Une place s'est libérée : tu es dans ${titre}. Bon appétit !`, sortie, "Ouvre la sortie");
    case "rappel-sortie-miamis":
      return decrire("⏰", `C'est demain : ${titre}. Un empêchement ? Libère ta place en un geste.`, sortie, "Ouvre la sortie");
    case "sortie-miamis-annulee":
      return decrire("🙅", `${titre.charAt(0).toUpperCase()}${titre.slice(1)} est annulée. Une autre t'attend sûrement chez les Miamis !`, null, "");
    case "invitation-habitue":
      return decrire("🔁", `${titre.charAt(0).toUpperCase()}${titre.slice(1)} remet le couvert ! Ta place d'habitué·e est gardée 48 h.`, sortie, "Ouvre la sortie");
    case "coucou-reciproque":
      return decrire("👋", `${qui} et toi, vous vous êtes fait coucou ! Et si vous vous ajoutiez à vos bandes ?`, "/potes/miamis/qui-est-la", "Ouvre « Qui est là ? »");
    case "idee-publiee":
      return decrire("💡", `Ton idée ${titre} est publiée : que les votes commencent !`, idee, "Ouvre l'idée");
    case "reponse-brigade":
      return decrire("🧑‍🍳", `La Brigade a répondu à ${titre}.`, idee, "Ouvre l'idée");
    case "idee-du-mois":
      return decrire("🏆", `${titre.charAt(0).toUpperCase()}${titre.slice(1)} est l'idée du mois ! Merci, et bravo.`, idee, "Ouvre l'idée");
    default:
      return null;
  }
}
