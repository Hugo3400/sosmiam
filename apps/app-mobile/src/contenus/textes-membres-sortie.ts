import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MEMBRES_SORTIE_ANGLAIS } from "~/contenus/anglais/textes-membres-sortie";

export const TEXTES_MEMBRES_SORTIE = {
  membres: {
    invitationRetiree: (prenom: string) => `L'invitation de ${prenom} est retirée. En toute discrétion 🤫`,
    membreRetire: (prenom: string) => `${prenom} ne fait plus partie de la sortie. En toute discrétion 🤫`,
    titre: "Qui vient ?",
    enAttente: "En attente",
    organise: "Organise",
    toi: "Toi",
    retirerLu: (prenom: string) => `Retirer ${prenom}`,
    retirerIndiceAttente: "Son invitation disparaît, sans qu'on le prévienne",
    retirerIndice: "Sans le prévenir, après confirmation",
    retirer: "Retirer",
    complet: (max: number) => `Complet : ${max} personnes`,
    inviter: "Inviter d'autres potes",
    inviterIndice: "Choisis des potes de ta bande à inviter",
    confirmerTitreAttente: (prenom: string) => `Retirer l'invitation de ${prenom} ?`,
    confirmerTitre: (prenom: string) => `Retirer ${prenom} de la sortie ?`,
    confirmerDetailAttente: "Son « Tu viens ? » disparaît. On ne prévient personne.",
    confirmerDetail: "Plus de vote ni de discussion pour cette sortie. On ne prévient personne, et tu pourras toujours l'inviter de nouveau.",
    rester: "Finalement non",
  },
  participants: {
    toi: "toi",
    nombre: (n: number) => `${n} participant${n > 1 ? "s" : ""}`,
    enAttente: (n: number) => `${n} en attente`,
    organiseePar: " · organisée par ",
    lu: (nombre: string, prenoms: string, enAttente: number, qui: string | null) =>
      `${nombre} : ${prenoms}.${enAttente > 0 ? ` ${enAttente} en attente de réponse.` : ""}${qui ? ` Organisée par ${qui}.` : ""}`,
  },
};

export const TEXTES_MEMBRES_SORTIE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MEMBRES_SORTIE>> = { fr: TEXTES_MEMBRES_SORTIE, en: TEXTES_MEMBRES_SORTIE_ANGLAIS };
