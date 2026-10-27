import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MISSIONS_AMBASSADEUR_ANGLAIS } from "~/contenus/anglais/missions-ambassadeur";

export const TEXTES_MISSIONS_AMBASSADEUR = {
  meta: { titre: "Mes missions", description: "Les missions de ton espace ambassadeur SOS Miam." },
  titre: "Mes missions",
  chapo: "Des coups de main proposés par l'équipe, à faire à ton rythme : ni horaires, ni objectifs. Une date est parfois indiquée : c'est un souhait, pas une obligation.",
  bravo: "Mission terminée, bravo ! Merci pour ton compte rendu.",
  aucune: "Pas de mission pour l'instant. Quand l'équipe t'en confie une, elle arrive ici.",
  groupes: { "a-faire": "À faire", faites: "Terminées", annulees: "Annulées" },
  messages: {
    tropCourt: "Écris quelques mots sur ce que tu as fait (5 à 2000 caractères).",
    introuvable: "Cette mission n'est plus à faire : l'équipe l'a peut-être annulée.",
    panne: "Oups, ton compte rendu n'est pas passé. Réessaie dans un instant.",
  },
  carte: {
    avant: "Si possible avant le ",
    faiteLe: "Faite le ",
    annulee: "Annulée par l'équipe",
    cEstFait: "C'est fait !",
    pourLecteurs: (titre: string) => ` : ${titre}`,
    compteRendu: "Ton compte rendu",
    aide: "Ce que tu as fait, en quelques mots (5 caractères au moins).",
  },
};

export const TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MISSIONS_AMBASSADEUR>> = {
  fr: TEXTES_MISSIONS_AMBASSADEUR,
  en: TEXTES_MISSIONS_AMBASSADEUR_ANGLAIS,
};
