import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_DISCUSSION_SORTIE_ANGLAIS } from "~/contenus/anglais/textes-discussion-sortie";

export const TEXTES_DISCUSSION_SORTIE = {
  refus: {
    vide: "Écris quelque chose avant d'envoyer, même un petit emoji 😉",
    "trop-long": `Ton message dépasse ${LONGUEUR_MAX_MESSAGE} caractères : coupe un peu, la bande t'écoute quand même.`,
    "mot-interdit": "Oups, un mot de ton message ne passe pas chez nous. Tu reformules gentiment ?",
    interdit: "Tu ne fais plus partie de cette sortie : ton message n'est pas parti.",
  },
  quelquUn: "Quelqu'un",
  annonce: (prenom: string, texte: string) => `${prenom} : ${texte}`,
  envoye: "Message envoyé à la bande",
  voirAvant: "Voir les messages d'avant",
  confidentialiteLu:
    "Seuls les participants de la sortie voient cette discussion. Un message qui dérange ? Touche « Options du message » à côté, ou appui long dessus, pour le signaler.",
  confidentialite: "🔒 Seuls les participants de la sortie voient cette discussion. Un message qui dérange ? Appui long dessus, ou « ⋯ », pour le signaler.",
  vide: "Pas encore de message. Lance la discussion : un « qui est chaud ? », un emoji, tout est permis !",
  champ: "Ton message",
  champErreur: (erreur: string) => `Ton message. ${erreur}`,
  indiceChamp: "Tape @ pour mentionner un pote",
  exempleChamp: "Écris à la bande…",
  envoyer: "Envoyer",
  bloque: (prenom: string) => `🚫 C'est fait : tu ne verras plus les messages de ${prenom}`,
  bulle: {
    toiLu: (heure: string, texte: string) => `Toi, ${heure} : ${texte}`,
    enCoursLu: ". En cours d'envoi",
    envoi: "Envoi…",
    pasParti: "Pas parti. Touche pour réessayer.",
    quelquUn: "Quelqu'un",
    messageLu: (debut: string, texte: string) => `${debut} : ${texte}`,
    optionsLu: (prenom: string) => `Options du message de ${prenom}`,
    indiceOptions: "Signaler ce message ou bloquer cette personne",
  },
};

export const TEXTES_DISCUSSION_SORTIE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DISCUSSION_SORTIE>> = { fr: TEXTES_DISCUSSION_SORTIE, en: TEXTES_DISCUSSION_SORTIE_ANGLAIS };
