import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_SORTIE_POTES_ANGLAIS } from "~/contenus/anglais/textes-ecran-sortie-potes";

export const TEXTES_ECRAN_SORTIE_POTES = {
  annuler: "Annuler",
  retour: "Retour",
  introuvableTitre: "Sortie introuvable",
  introuvableTexte: "Elle a peut-être été annulée, ou tu n'en fais plus partie. Pas grave : la prochaine, c'est toi qui l'organises ?",
  dansMinutes: (minutes: number) => `dans ${minutes} min`,
  aujourdhui: "aujourd'hui",
  demain: "demain",
  hier: "hier",
  jourHeure: (jour: string, heure: string) => `${jour} à ${heure}`,
  ongletVote: "Le vote",
  ongletDiscussion: "La discussion",
  ongletMessages: (nom: string, n: number) => `${nom}, ${n} message${n > 1 ? "s" : ""}`,
  ongletPosition: (nom: string, position: number, total: number) => `${nom}, onglet ${position} sur ${total}`,
  terminerTitre: "Terminer le vote ?",
  terminerDetail: "Le lieu qui a le plus de votes l'emporte, et plus personne ne pourra voter.",
  terminer: "Terminer",
  voteTermine: "🏁 Vote terminé : on y va !",
  quitterTitre: "Quitter la sortie ?",
  quitterDetailOrganisateur: "Tu organises cette sortie : tes potes la garderont sans toi, et tu ne verras plus le vote ni la discussion.",
  quitterDetail: "Tu ne verras plus le vote ni la discussion de cette sortie.",
  quitter: "Quitter",
  quitterSortie: "Quitter la sortie",
  annulerSortie: "Annuler la sortie",
  annulerIndice: "La sortie et sa discussion disparaissent pour tout le monde, après confirmation",
  annulerTitre: (titre: string) => `Annuler « ${titre} » ?`,
  annulerDetail: "La sortie et sa discussion disparaissent pour tout le monde, sans retour possible. Pas de panique : une autre se lance en deux minutes.",
  garder: "Je la garde",
  garderIndice: "La sortie continue comme avant",
} as const;

export const TEXTES_ECRAN_SORTIE_POTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_SORTIE_POTES>> = { fr: TEXTES_ECRAN_SORTIE_POTES, en: TEXTES_ECRAN_SORTIE_POTES_ANGLAIS };
