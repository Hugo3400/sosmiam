import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CARTE_LIEU_ANGLAIS } from "~/contenus/anglais/textes-carte-lieu";

export const TEXTES_CARTE_LIEU = {
  carte: "La carte",
  formules: "Les formules",
  pasEncoreCarte: "Pas encore de carte par ici",
  pasEncoreFormules: "Pas encore de formules par ici",
  pasEncoreTexte: (nom: string, formules: boolean) => `${nom} n'a pas encore mis ${formules ? "ses formules" : "sa carte"} dans l'app. Demande sur place, on te dira tout !`,
  seulementCeQuiMeVa: "Seulement ce qui me va",
  gardes: (gardes: number, total: number, regimes: string) => `${gardes} sur ${total} ${gardes > 1 ? "te vont" : "te va"}, d'après les repères du lieu (${regimes})`,
  reperes: (regimes: string) => `D'après les repères indiqués par le lieu (${regimes})`,
  rienIndique: (regimes: string) => `Rien n'est indiqué ${regimes} sur cette carte pour l'instant. Demande sur place : il y a parfois moyen d'adapter un plat !`,
  toutAfficher: "Tout afficher",
  prixIndicatifs: "Prix indicatifs : la carte peut changer, le lieu a toujours le dernier mot. Une allergie ? Signale-la toujours sur place.",
  miseAJour: (date: string) => `Mise à jour par le lieu le ${date}`,
  apercu: {
    signatures: "Ce que la maison fait de mieux",
    avantGout: "Un petit avant-goût",
    voirTout: (formules: boolean, nombre: number) => `${formules ? "Voir toutes les formules" : "Voir toute la carte"} (${nombre})`,
    voirToutIndice: (formules: boolean, deLieu: string) => `Ouvre ${formules ? "toutes les formules" : "la carte complète"} ${deLieu}, rangée par sections`,
  },
  element: {
    specialite: "spécialité de la maison",
    gratuitLu: "gratuit",
    gratuit: "Gratuit",
    signature: "⭐ Signature",
  },
  sectionLu: (titre: string, position: number, total: number) => `${titre}, section ${position} sur ${total}`,
  sectionIndice: "Fait défiler la carte jusqu'à cette section",
};

export const TEXTES_CARTE_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTE_LIEU>> = { fr: TEXTES_CARTE_LIEU, en: TEXTES_CARTE_LIEU_ANGLAIS };
