import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MEMBRES_SORTIE } from "~/contenus/textes-membres-sortie";

export const TEXTES_MEMBRES_SORTIE_ANGLAIS: Traduction<typeof TEXTES_MEMBRES_SORTIE> = {
  membres: {
    invitationRetiree: (prenom: string) => `${prenom}'s invitation has been withdrawn. All done discreetly 🤫`,
    membreRetire: (prenom: string) => `${prenom} is no longer part of the get-together. All done discreetly 🤫`,
    titre: "Who's coming?",
    enAttente: "Pending",
    organise: "Organiser",
    toi: "You",
    retirerLu: (prenom: string) => `Remove ${prenom}`,
    retirerIndiceAttente: "Their invitation disappears, and they won't be told",
    retirerIndice: "Without telling them, after you confirm",
    retirer: "Remove",
    complet: (max: number) => `Full: ${max} people`,
    inviter: "Invite more friends",
    inviterIndice: "Pick friends from your crew to invite",
    confirmerTitreAttente: (prenom: string) => `Withdraw ${prenom}'s invitation?`,
    confirmerTitre: (prenom: string) => `Remove ${prenom} from the get-together?`,
    confirmerDetailAttente: "Their “You in?” disappears. We won't tell anyone.",
    confirmerDetail: "No more voting or chat in this get-together for them. We won't tell anyone, and you can always invite them again.",
    rester: "Actually, no",
  },
  participants: {
    toi: "you",
    nombre: (n: number) => `${n} going`,
    enAttente: (n: number) => `${n} pending`,
    organiseePar: " · organised by ",
    lu: (nombre: string, prenoms: string, enAttente: number, qui: string | null) =>
      `${nombre}: ${prenoms}.${enAttente > 0 ? ` ${enAttente} yet to reply.` : ""}${qui ? ` Organised by ${qui}.` : ""}`,
  },
};
