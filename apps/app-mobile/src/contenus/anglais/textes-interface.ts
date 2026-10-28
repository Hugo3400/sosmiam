import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_INTERFACE } from "~/contenus/textes-interface";

export const TEXTES_INTERFACE_ANGLAIS: Traduction<typeof TEXTES_INTERFACE> = {
  annuler: "Cancel",
  retour: "Back",
  fermerSansChanger: "Close without changing anything",
  fermerMenu: "Close the menu",
  bientot: "Coming soon to the app",
  annonceBandeau: (texte: string) => `${texte}. You can undo this.`,
  indiceAnnulerBandeau: "Puts back what you've just removed",
  remis: "It's back",
  etape: (etape: number, total: number) => `Step ${etape} of ${total}`,
  placeDansGroupe: (position: number, total: number) => `, ${position} of ${total}`,
  voirPlus: (prochains: number, nom: string) => `See ${prochains} more ${nom}`,
  voirAutre: "See the other one",
  voirAutres: (restants: number) => `See the other ${restants}`,
  resteEnTout: (restants: number) => `${restants} left in total`,
  reste: (restants: number) => `${restants} more`,
  deplie: "expanded",
  plie: "collapsed",
  sectionBasculee: (titre: string, deplie: boolean) => `${titre}, ${deplie ? "expanded" : "collapsed"}`,
  indicePlier: "Tap to collapse",
  indiceDeplier: "Tap to expand",
  joursCourts: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  joursLongs: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
