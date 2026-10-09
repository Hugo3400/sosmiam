import { PREFIXE_SANS_MOT_DE_PASSE } from "../securite/creer-empreinte-sans-mot-de-passe.ts";

/** Vrai si l'empreinte gardée n'est pas celle d'un vrai mot de passe (compte créé avec Apple ou Google, jamais changé). */
export function estSansMotDePasse(empreinte: string): boolean {
  return empreinte.startsWith(PREFIXE_SANS_MOT_DE_PASSE);
}
