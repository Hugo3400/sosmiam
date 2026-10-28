import { LONGUEUR_MAX_MOT_RECOMMANDATION } from "@sos-miam/commun/regles/potes";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ENVOYER_A_POTE } from "~/contenus/textes-envoyer-a-pote";

export const TEXTES_ENVOYER_A_POTE_ANGLAIS: Traduction<typeof TEXTES_ENVOYER_A_POTE> = {
  erreursMot: {
    vide: "Your note is empty – write something, or leave it out.",
    "trop-long": `${LONGUEUR_MAX_MOT_RECOMMANDATION} characters max – short and sweet is best!`,
    "mot-interdit": "A word in your message doesn't go down well here. Mind rephrasing it?",
  },
  pasParti: "Your place didn't go through. Try again in a moment.",
  envoyeA: (prenoms: string) => `Sent to ${prenoms}!`,
  indisponible: "This place isn't available",
  fermer: "Close",
  envoye: "Sent!",
  saliver: (prenoms: string, nombre: number, lieu: string) => `${prenoms} ${nombre === 1 ? "is" : "are"} going to drool over ${lieu}.`,
  titre: "Send to a friend",
  bandeVide: "Your crew's empty for now. Add a friend and the good finds will start travelling!",
  ajouter: "Add a friend",
  aQui: "Who to?",
  position: (position: number, total: number) => `${position} of ${total}`,
  petitMot: "A note",
  facultatif: "optional",
  exempleMot: "Their pasta will make you weep with joy",
  envoyer: "Send",
  indiceAucun: "Pick at least one friend first",
  indiceEnvoyer: (lieu: string, prenoms: string) => `Sends ${lieu} to ${prenoms}`,
  annuler: "Cancel",
  recue: {
    nouveau: "New",
    envoieLu: (prenom: string, lieu: string, details: string) => `${prenom} sent you ${lieu}, ${details}`,
    sonMot: (mot: string) => `Their note: ${mot}`,
    indiceOuvrir: "Opens the place's page",
    envoie: (prenom: string) => `${prenom} sent you`,
    citerMot: (mot: string) => `“${mot}”`,
    optionsLu: (prenom: string) => `More options for this place sent by ${prenom}`,
    indiceOptions: "Remove it from here, see their profile, report this place sent to you, or block this person",
  },
};
