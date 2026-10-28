import type { Traduction } from "../../types/traduction.ts";
import type { TEXTES_STATUT_AMBASSADEUR } from "../statuts-ambassadeur.ts";

export const TEXTES_STATUT_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_STATUT_AMBASSADEUR> = {
  "en-attente": {
    titre: "Thanks, we've got your request!",
    texte:
      "The SOS Miam team checks every request by hand. As soon as yours is approved, your area opens here, with missions and everything else. Pop back now and then.",
  },
  actif: {
    titre: "Welcome to the ambassadors",
    texte: "On-the-spot missions, reviews to check, messages from the SOS Miam team: it's all here. Thanks for lending a hand to the places near you!",
  },
  refuse: {
    titre: "Your request wasn't accepted",
    texte:
      "Thanks for offering to help. This time, the SOS Miam team didn't accept your request to join the Ambassador programme. You can still follow the adventure and give rescues.",
  },
  suspendu: {
    titre: "Your ambassador area is on hold",
    texte: "It's suspended for now. To talk about it, email us at bonjour@sosmiam.fr – a real person will get back to you.",
  },
};
