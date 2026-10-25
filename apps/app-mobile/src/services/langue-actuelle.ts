import { LANGUE_PAR_DEFAUT, type Langue } from "@sos-miam/commun/regles/langues";

let actuelle: Langue = LANGUE_PAR_DEFAUT;

export const lireLangueActuelle = (): Langue => actuelle;

export function poserLangueActuelle(langue: Langue): void {
  actuelle = langue;
}
