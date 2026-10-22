import type { TypeConversation } from "../../../../../packages/commun/src/types/messagerie.ts";
import type { MessagePush } from "../../services/notifications/expedier-push.ts";

type TypeMessage = "texte" | "lieu" | "photo" | "vocal" | "vote" | "gif";

/** Privé : ce que le pote a fait, sans jamais le contenu */
const DANS_UN_PRIVE: Readonly<Record<TypeMessage, string>> = {
  texte: "Nouveau message. Viens voir !",
  photo: "T'a envoyé une photo.",
  vocal: "T'a laissé une note vocale.",
  lieu: "T'a envoyé un lieu à tester.",
  vote: "A lancé un sondage.",
  gif: "T'a envoyé un GIF.",
};
/** Groupe : « Léa a écrit. », « Léa a envoyé une photo. »… */
const DANS_UN_GROUPE: Readonly<Record<TypeMessage, string>> = {
  texte: "a écrit.",
  photo: "a envoyé une photo.",
  vocal: "a envoyé une note vocale.",
  lieu: "a envoyé un lieu.",
  vote: "a lancé un sondage.",
  gif: "a envoyé un GIF.",
};
/** Discussion d'une sortie : « Léa a écrit dans la discussion. »… */
const DANS_UNE_SORTIE: Readonly<Record<TypeMessage, string>> = {
  texte: "a écrit dans la discussion.",
  photo: "a envoyé une photo dans la discussion.",
  vocal: "a laissé une note vocale dans la discussion.",
  lieu: "a proposé un lieu dans la discussion.",
  vote: "a lancé un sondage dans la discussion.",
  gif: "a envoyé un GIF dans la discussion.",
};

/**
 * La notification d'un nouveau message sur le téléphone (spécification sociale C.5). Jamais le texte du message en clair : il
 * passerait par Apple et Google ; seulement le prénom de l'expéditeur, la sorte de message et le titre du groupe ou de la
 * sortie (écrit dans la politique de confidentialité). Le vrai texte part à côté, chiffré pour chaque téléphone (apercu). Une notification par conversation à l'écran (regroupement
 * « conversation:<id> ») ; le lien n'ouvre qu'un écran de l'app : la discussion, ou la sortie pour sa discussion.
 */
export function ecrirePushMessage(m: {
  prenom: string;
  type: TypeMessage;
  conversation: { id: number; type: TypeConversation; titre: string | null };
  sortieId?: number | null;
}): MessagePush {
  const regroupement = `conversation:${m.conversation.id}`;
  const discussion = `/potes/discussion/${m.conversation.id}`;
  const categorie = "message" as const;
  if (m.conversation.type === "prive") return { titre: `💬 ${m.prenom}`, texte: DANS_UN_PRIVE[m.type], lien: discussion, regroupement, categorie };
  if (m.conversation.type === "groupe") {
    return { titre: `💬 ${m.conversation.titre ?? "Ton groupe"}`, texte: `${m.prenom} ${DANS_UN_GROUPE[m.type]}`, lien: discussion, regroupement, categorie };
  }
  return {
    titre: `🎉 ${m.conversation.titre ?? "Ta sortie"}`,
    texte: `${m.prenom} ${DANS_UNE_SORTIE[m.type]}`,
    lien: m.sortieId ? `/potes/sortie/${m.sortieId}` : discussion,
    regroupement,
    categorie,
  };
}
