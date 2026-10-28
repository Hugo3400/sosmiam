import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INTERFACE_ANGLAIS } from "~/contenus/anglais/textes-interface";

export const TEXTES_INTERFACE = {
  annuler: "Annuler",
  retour: "Retour",
  fermerSansChanger: "Fermer, sans rien changer",
  fermerMenu: "Fermer le menu",
  bientot: "Bientôt dans l'app",
  annonceBandeau: (texte: string) => `${texte}. Tu peux annuler.`,
  indiceAnnulerBandeau: "Remet ce que tu viens de retirer",
  remis: "C'est remis",
  etape: (etape: number, total: number) => `Étape ${etape} sur ${total}`,
  placeDansGroupe: (position: number, total: number) => `, ${position} sur ${total}`,
  voirPlus: (prochains: number, nom: string) => `Voir ${prochains} ${nom} de plus`,
  voirAutre: "Voir l'autre",
  voirAutres: (restants: number) => `Voir les ${restants} autres`,
  resteEnTout: (restants: number) => `Il en reste ${restants} en tout`,
  reste: (restants: number) => `Il en reste ${restants}`,
  deplie: "déplié",
  plie: "plié",
  sectionBasculee: (titre: string, deplie: boolean) => `${titre}, ${deplie ? "déplié" : "plié"}`,
  indicePlier: "Touche pour plier",
  indiceDeplier: "Touche pour déplier",
  joursCourts: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  joursLongs: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
};

export const TEXTES_INTERFACE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INTERFACE>> = { fr: TEXTES_INTERFACE, en: TEXTES_INTERFACE_ANGLAIS };
