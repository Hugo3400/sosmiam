import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRANS_MIAMIS_ANGLAIS } from "~/contenus/anglais/textes-ecrans-miamis";

export const TEXTES_ECRANS_MIAMIS = {
  retour: "Retour",
  fermer: "Fermer",
  fermerMenu: "Fermer le menu",
  unInstant: "Un instant…",
  apresConfirmation: "Après confirmation",
  surTotal: (position: number, total: number) => `${position} sur ${total}`,
  toi: "Toi",
  ouvrirDiscussion: "Ouvre la discussion de la sortie",
  validerPresence: "Valide ta présence avec le QR du comptoir",
  ouvrirFicheLieu: "Ouvre la fiche du lieu",
  ouvrirSortie: "Ouvre la sortie",
  ouvrirSonProfil: "Ouvre son profil",
  voirOuRetirer: "Voir son profil ou le retirer de la sortie",
  placesSortie: (occupees: number, places: number) => `${occupees} / ${places} places`,
  nombrePlaces: (n: number) => `${n} places`,
  jeViensA: (titre: string) => `Je viens à ${titre}`,
  demandeIndice: (pseudo: string) => `@${pseudo} reçoit ta demande et l'accepte, ou pas`,
  caracteres: (n: number, max: number) => `${n}/${max} caractères`,
  chargementSortie: "Chargement de la sortie",
  chargementSorties: "Chargement des sorties",
  accepterLu: (pseudo: string) => `Accepter @${pseudo}`,
  refuserLu: (pseudo: string) => `Refuser @${pseudo}, sans le prévenir`,
  retirerAttenteLu: (pseudo: string) => `Retirer @${pseudo} de la liste d'attente`,
  profilDe: (pseudo: string) => `Profil de @${pseudo}`,
  etiquettesSortie: "Étiquettes de la sortie",
  etiquettesChoisies: (n: number, noms: string) => `${n} choisie${n > 1 ? "s" : ""} : ${noms}`,
  nombreEtiquettes: (n: number) => `${n} étiquettes`,
  sujetSignalement: (titre: string) => `la sortie « ${titre} »`,
  organiserLu: "Organiser une sortie des Miamis",
  modifierEnviesLu: "Modifier mes envies",
  statutLu: (statut: string) => `Statut : ${statut}`,
  etapesLues: (ouEnEst: string, etapes: string) => `${ouEnEst} : ${etapes}`,
} as const;

export const TEXTES_ECRANS_MIAMIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRANS_MIAMIS>> = { fr: TEXTES_ECRANS_MIAMIS, en: TEXTES_ECRANS_MIAMIS_ANGLAIS };
