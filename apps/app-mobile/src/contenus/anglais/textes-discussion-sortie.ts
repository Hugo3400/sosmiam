import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_DISCUSSION_SORTIE } from "~/contenus/textes-discussion-sortie";

export const TEXTES_DISCUSSION_SORTIE_ANGLAIS: Traduction<typeof TEXTES_DISCUSSION_SORTIE> = {
  refus: {
    vide: "Write something before you send – even a little emoji 😉",
    "trop-long": `Your message is over ${LONGUEUR_MAX_MESSAGE} characters. Trim it a little – the crew's still listening.`,
    "mot-interdit": "Oops, a word in your message doesn't go down well here. Mind rephrasing it?",
    interdit: "You're no longer part of this get-together, so your message didn't go through.",
  },
  quelquUn: "Someone",
  annonce: (prenom: string, texte: string) => `${prenom}: ${texte}`,
  envoye: "Message sent to the crew",
  voirAvant: "See earlier messages",
  confidentialiteLu:
    "Only the people in this get-together can see this chat. A message bothering you? Tap “Message options” next to it, or long-press it, to report it.",
  confidentialite: "🔒 Only the people in this get-together can see this chat. A message bothering you? Long-press it, or tap “⋯”, to report it.",
  vide: "No messages yet. Get the chat going – a “who's up for it?”, an emoji, anything goes!",
  champ: "Your message",
  champErreur: (erreur: string) => `Your message. ${erreur}`,
  indiceChamp: "Type @ to mention a friend",
  exempleChamp: "Message the crew…",
  envoyer: "Send",
  bloque: (prenom: string) => `🚫 Done – you won't see ${prenom}'s messages any more`,
  bulle: {
    toiLu: (heure: string, texte: string) => `You, ${heure}: ${texte}`,
    enCoursLu: ". Sending",
    envoi: "Sending…",
    pasParti: "Not sent. Tap to try again.",
    quelquUn: "Someone",
    messageLu: (debut: string, texte: string) => `${debut}: ${texte}`,
    optionsLu: (prenom: string) => `Message options for ${prenom}`,
    indiceOptions: "Report this message or block this person",
  },
};
