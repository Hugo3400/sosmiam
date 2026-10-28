import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_FIDELITE_ANGLAIS } from "~/contenus/anglais/textes-fidelite";

export const TEXTES_FIDELITE = {
  toi: "Toi",
  retour: "Retour",
  titre: "Ta carte de fidélité",
  mesCartes: "Mes cartes de fidélité",
  carteRateeTitre: "Ta carte est restée en cuisine",
  carteRateeTexte: "La connexion fait des siennes, rien de grave : elle arrive dès que le réseau revient. Pas un tampon ne se perd en route, promis.",
  cartesRateesTitre: "Tes cartes sont restées en cuisine",
  cartesRateesTexte: "La connexion fait des siennes, rien de grave : tout arrive dès que le réseau revient. Pas un tampon ne se perd en route, promis.",
  relireIndice: "Relit tes cartes de fidélité",
  pasDeCarte: "Pas de carte ici pour l'instant : elle naît avec ta première visite validée.",
  chargementCarte: "On sort ta carte…",
  chargementCartes: "On sort tes cartes…",
  carteLu: (lieu: string, tampons: number, sur: number, restantes: number, recompense: string) =>
    `${lieu}. ${tampons} tampon${tampons > 1 ? "s" : ""} sur ${sur}. Encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}.`,
  progression: (tampons: number, sur: number, restantes: number, recompense: string) =>
    `${tampons}/${sur} · encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}`,
  programmeEnPause: "⏸ Le lieu a mis son programme en pause.",
  explication: (chezLieu: string) =>
    `Un tampon à chaque visite validée ${chezLieu} : addition demandée dans l'app ou QR du comptoir. La récompense est choisie par le lieu.`,
  visitesIci: (nombre: number) => `Tes visites ici (${nombre})`,
  voirFiche: "Voir la fiche du lieu",
  videTitre: "Pas encore de carte",
  videTexte: "Une visite validée dans un lieu qui a une carte de fidélité, et le premier tampon est posé. La récompense ? C'est le lieu qui la choisit.",
  validerVisite: "Valider une visite",
  intro: "Un tampon à chaque visite validée. Carte pleine : ta récompense t'attend, à demander au comptoir.",
  codeLegende: "Montre ce code à l'équipe : elle t'offre ta récompense",
  codeValable: (heure: string) => `Valable jusqu'à ${heure}. Après, il suffit d'en redemander un.`,
  annulation: "Annulation…",
  annulerDemande: "Annuler la demande",
  pretTitre: "🎁 Ta récompense est prête !",
  autres: (autres: number) => ` (et ${autres} autre${autres > 1 ? "s" : ""} derrière)`,
  auComptoir: (deLieu: string, _lieu: string) => `Au comptoir ${deLieu}, touche le bouton : un code s'affiche, l'équipe te l'offre.`,
  unInstant: "Un instant…",
  demanderRecompense: "Demander ma récompense",
  recompenseAttend: (recompense: string) => `🎁 ${recompense} t'attend !`,
  encore: (restantes: number, recompense: string) => `Encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}`,
  carteDe: (lieu: string) => `Carte de fidélité ${lieu}`,
  tamponsSur: (tampons: number, sur: number) => `${tampons} tampon${tampons > 1 ? "s" : ""} sur ${sur}`,
  programmePauseLu: "Programme en pause",
  ouvrirEnGrand: "Ouvre ta carte en grand",
  programmePause: (jours: number) => `⏸ Programme en pause : une récompense prête reste valable ${jours} jours.`,
  miniPreteLu: (lieu: string, recompense: string) => `Carte de fidélité ${lieu} : ${recompense} t'attend !`,
  miniProgressionLu: (lieu: string, tampons: number, sur: number, recompense: string) =>
    `Carte de fidélité ${lieu} : ${tampons} tampon${tampons > 1 ? "s" : ""} sur ${sur}, pour ${recompense}`,
  ouvrirCarte: "Ouvre la carte de fidélité",
  messageSanitaireLu: (messageFrancais: string) => messageFrancais,
};

export const TEXTES_FIDELITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FIDELITE>> = { fr: TEXTES_FIDELITE, en: TEXTES_FIDELITE_ANGLAIS };
