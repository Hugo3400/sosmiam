import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PROPOSER_UN_LIEU_ANGLAIS } from "~/contenus/anglais/proposer-un-lieu";

export const TEXTES_PROPOSER_UN_LIEU = {
  meta: { titre: "Proposer un lieu", description: "Propose un lieu indépendant à SOS Miam." },
  titre: "Propose un lieu",
  chapo: (prenom: string) =>
    `Un resto, une pâtisserie, un bar ou une sortie indépendant qui mérite plus de monde ? Raconte-le-nous. S'il rejoint SOS Miam, sa fiche affichera « Déniché par ${prenom} ».`,
  merci: "Merci, c'est envoyé !",
  suivi: "L'équipe lit chaque proposition. Tu suis son avancée juste en dessous.",
  autre: "Proposer un autre lieu",
  rappel: "Rappel : un ambassadeur n'est jamais payé par un lieu qu'il met en avant.",
  mesPropositions: "Mes propositions",
  formulaire: {
    bouton: "Envoyer ma proposition",
    description: { libelle: "Pourquoi ce lieu ?", aide: "Ce qui le rend unique, l'ambiance, pourquoi il mérite plus de monde (20 caractères au moins)." },
    cEstPlutot: "C'est plutôt… ",
    facultatif: "(facultatif)",
  },
  messages: {
    description: "Dis-nous pourquoi ce lieu, en 20 à 1000 caractères.",
    tropDeDemandes: "Doucement ! Trop d'envois d'affilée : réessaie dans quelques minutes.",
    panne: "Oups, ta proposition n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  },
};

export const TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PROPOSER_UN_LIEU>> = {
  fr: TEXTES_PROPOSER_UN_LIEU,
  en: TEXTES_PROPOSER_UN_LIEU_ANGLAIS,
};
