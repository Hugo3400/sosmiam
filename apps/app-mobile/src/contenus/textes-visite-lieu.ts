import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_VISITE_LIEU_ANGLAIS } from "~/contenus/anglais/textes-visite-lieu";

export const TEXTES_VISITE_LIEU = {
  titre: "Tu passes chez eux ?",
  recompensePrete: (libelle: string) => `${libelle} t'attend !`,
  autresDerriere: (n: number) => `Et ${n} autre${n > 1 ? "s" : ""} derrière. `,
  montrerCode: "Ouvre ta carte et montre le code à l'équipe.",
  recompensePreteLu: (libelle: string, texte: string) => `Carte de fidélité : ${libelle} t'attend ! ${texte}`,
  progression: (tampons: number, sur: number, restantes: number, recompense: string) =>
    `${tampons}/${sur} · encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}`,
  progressionLu: (tampons: number, sur: number, restantes: number, recompense: string) =>
    `Carte de fidélité : ${tampons} tampon${tampons > 1 ? "s" : ""} sur ${sur}, encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}`,
  unTampon: ", un tampon",
  gainsSos: (pointsSos: number, points: number, tampon: string) =>
    `Ils sont en SOS ce soir : ta visite vaut +${pointsSos} points au lieu de +${points}${tampon}, et tu pourras laisser un avis vérifié. Demande l'addition au moment de payer.`,
  gains: (points: number, tampon: string) => `Au moment de payer, demande l'addition ici : +${points} points${tampon}, et tu pourras laisser un avis vérifié.`,
  bientot: "Bientôt : demande l'addition dans l'app pour que ta visite compte.",
  reessayer: "Réessayer",
  reessayerIndice: "Relit les infos de visite de ce lieu",
  demandeEnCoursLu: "Ta demande d'addition est en cours ici. Voir le code",
  demandeEnCoursIndice: "Ouvre ta demande, avec le code à montrer au moment de payer",
  demandeEnCours: "Ta demande est en cours",
  montrerTonCode: "Montre ton code au moment de payer. ",
  voirCode: "Voir le code",
  scannerIndice: "Ouvre l'appareil photo pour scanner le QR du comptoir",
  scanner: "Ou scanne le QR que te montre l'équipe",
  fideliteIndice: "Ouvre tes cartes de fidélité",
  reserverTexte: "Gratuit, sans carte bancaire : le lieu te répond dans l'app.",
  reserverLu: (titre: string) => `${titre}. Gratuit, sans carte bancaire : le lieu te répond dans l'app.`,
  reserverIndice: "Choisis le jour, l'heure et combien vous êtes",
};

export const TEXTES_VISITE_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_VISITE_LIEU>> = { fr: TEXTES_VISITE_LIEU, en: TEXTES_VISITE_LIEU_ANGLAIS };
