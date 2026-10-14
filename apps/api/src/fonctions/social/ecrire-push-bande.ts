// Les notifications de la bande sur le téléphone (spécification sociale C.5) : quelqu'un a rejoint ta bande par ton lien ou
// ton QR, ou il a dit oui à ta demande. Hors anti-spam, comme les messages (réponse de Hugo du 14/10/2026, I.15 a). Le lien
// n'ouvre qu'un écran de l'app : le profil de la personne, par son identifiant public (jamais l'id de son compte).
import type { MessagePush } from "../../services/notifications/expedier-push.ts";

export type SortePushBande = "bande-ajout" | "bande-acceptee";

/** prenom et idPublic : ceux de la personne qui vient d'entrer dans la bande du destinataire */
export function ecrirePushBande(o: { sorte: SortePushBande; prenom: string; idPublic: string }): MessagePush {
  const lien = `/potes/profil/${o.idPublic}`;
  if (o.sorte === "bande-ajout") return { titre: `🤝 ${o.prenom} a rejoint ta bande`, texte: "Grâce à ton lien. Dis-lui bonjour !", lien };
  return { titre: `🤝 ${o.prenom} a dit oui`, texte: "Vous êtes dans la même bande. Première sortie ?", lien };
}
