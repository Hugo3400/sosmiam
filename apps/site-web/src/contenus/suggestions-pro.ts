import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_SUGGESTIONS_PRO_ANGLAIS } from "~/contenus/anglais/suggestions-pro";
import type { SuggestionFiche } from "~/types/pro";

export const TEXTES_SUGGESTIONS_PRO = {
  meta: {
    titre: (nom: string) => `Suggestions · ${nom}`,
    titreParDefaut: "Suggestions",
    description: "Les suggestions de modification de ta fiche.",
  },
  page: "Suggestions",
  chapo: "Un client repère une erreur sur ta fiche ? Il la propose, l'équipe SOS Miam décide. Ici, tu vois tout.",
  illisibles: "Oups, les suggestions ne se sont pas affichées. Recharge la page dans un instant.",
  vide: {
    titre: "Rien à signaler !",
    texte: "Personne n'a proposé de changement sur ta fiche. Elle doit être nickel.",
  },
  enAttente: (nombre: number) => `En attente (${nombre})`,
  decidees: "Décidées",
  carte: {
    statuts: {
      "en-attente": "L'équipe regarde",
      acceptee: "Acceptée ✓",
      partielle: "Acceptée en partie",
      refusee: "Refusée",
    } satisfies Record<SuggestionFiche["statut"], string>,
    client: "Un client propose",
    toi: "Ta demande",
    le: "Le ",
    decideeLe: " · décidée le ",
    accepte: " · accepté ✓",
    pasRetenu: " · pas retenu",
    avant: "Avant : ",
    apres: ", après : ",
    pourquoi: "Pourquoi : ",
    motEquipe: "Le mot de l'équipe : ",
  },
};

export const TEXTES_SUGGESTIONS_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SUGGESTIONS_PRO>> = {
  fr: TEXTES_SUGGESTIONS_PRO,
  en: TEXTES_SUGGESTIONS_PRO_ANGLAIS,
};
