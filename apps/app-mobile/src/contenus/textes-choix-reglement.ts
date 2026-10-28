import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CHOIX_REGLEMENT_ANGLAIS } from "~/contenus/anglais/textes-choix-reglement";

export const TEXTES_CHOIX_REGLEMENT = {
  details: {
    paye: "+15 points pour le client (+25 pendant un SOS), un tampon",
    reduction: "Pareil que payé : la réduction est indiquée",
    offert: "Visite notée, ni points ni tampon ; son avis sera marqué « Repas offert »",
  },
  titre: "Comment ça s'est réglé ?",
  choixLu: (libelle: string, position: number, total: number, detail: string) => `${libelle}, ${position} sur ${total}. ${detail}`,
  quelleReduction: "Quelle réduction ?",
  reduction: (pourcent: number) => `−${pourcent} %`,
  sansPreciser: "Sans préciser",
  avantageEnPlus: "Un avantage en plus ?",
  glosePartenariat: (mention: string) => mention,
  notePartenariat: (mention: string) => `${mention} : elle sera toujours affichée sur la visite et sur l'avis du client, en toute transparence.`,
};

export const TEXTES_CHOIX_REGLEMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHOIX_REGLEMENT>> = { fr: TEXTES_CHOIX_REGLEMENT, en: TEXTES_CHOIX_REGLEMENT_ANGLAIS };
