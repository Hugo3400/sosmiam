import type { MessagePush } from "../../services/notifications/expedier-push.ts";

export type EvenementPushCommunaute =
  | { quoi: "demande"; prenom: string; titre: string; sortieId: number }
  | { quoi: "acceptee"; prenom: string; titre: string; sortieId: number }
  | { quoi: "place"; titre: string; sortieId: number }
  | { quoi: "rappel"; titre: string; lieu: string; sortieId: number }
  | { quoi: "habitue"; prenom: string; titre: string; sortieId: number }
  | { quoi: "coucou"; prenom: string };

export function ecrirePushCommunaute(e: EvenementPushCommunaute): MessagePush {
  if (e.quoi === "coucou") return { titre: `👋 ${e.prenom} t'a fait coucou aussi !`, texte: "C'est réciproque : vous pouvez vous ajouter à vos bandes.", lien: "/potes/miamis/qui-est-la" };
  const lien = `/potes/miamis/sortie/${e.sortieId}`;
  switch (e.quoi) {
    case "demande":
      return { titre: `🙋 ${e.prenom} veut venir : ${e.titre}`, texte: "Accepte ou refuse son arrivée dans Communauté.", lien };
    case "acceptee":
      return { titre: `🎉 C'est oui pour ${e.titre} !`, texte: `${e.prenom} t'attend. La discussion de la sortie est ouverte.`, lien };
    case "place":
      return { titre: `🪑 Une place s'est libérée : ${e.titre}`, texte: "Tu passes de la liste d'attente à la sortie. Bon appétit !", lien };
    case "rappel":
      return { titre: `⏰ C'est demain : ${e.titre}`, texte: `Rendez-vous chez ${e.lieu}. Un empêchement ? Libère ta place en un geste.`, lien };
    case "habitue":
      return { titre: `🔁 ${e.prenom} remet ça : ${e.titre}`, texte: "Ta place d'habitué·e est gardée 48 h. Tu viens ?", lien };
  }
}
