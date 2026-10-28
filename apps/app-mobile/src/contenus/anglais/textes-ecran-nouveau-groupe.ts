import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_NOUVEAU_GROUPE } from "~/contenus/textes-ecran-nouveau-groupe";

export const TEXTES_ECRAN_NOUVEAU_GROUPE_ANGLAIS: Traduction<typeof TEXTES_ECRAN_NOUVEAU_GROUPE> = {
  retour: "Back",
  titre: "New group",
  intro: "The brunch squad, the tielle fans or the whole crew: one group, and you can all have a natter together.",
  nom: "The name",
  nomLibelle: "Group name",
  nomPlaceholder: "The hungry Thursday lot",
  caracteres: (n: number, max: number) => `${n}/${max} characters`,
  emoji: "Group emoji",
  avecQui: "Who with?",
  avecQuiTexte: (potes: number, total: number) => `Up to ${potes} friends from your crew (${total} including you).`,
  indiceMax: (potes: number) => `${potes} friends max in a group, plus you`,
  unInstant: "Just a sec…",
  creer: "Create the group",
  creerIndice: "The friends you pick can all chat together",
  erreurs: {
    titreVide: "Give your group a name – even “The Hungry Lot” will do.",
    titreLong: (max: number) => `${max} characters max – keep it short and tasty.`,
    titreMot: "A word in this name doesn't go down well here. Mind rephrasing it?",
    membres: "Add at least one friend – a group on your own is just a diary.",
    titreRefuse: (max: number) => `That name doesn't go down well here: ${max} characters max, and kind words only.`,
    participants: (max: number) => `Pick between 1 and ${max} friends from your crew.`,
    reseau: "The group couldn't be created (the network, probably). Try again in a moment!",
  },
};
