import { createContext, use, type FormEvent } from "react";

import {
  ADRESSE_CHOIX_COOKIES,
  categoriesConsentement,
  type CategorieConsentement,
  type CategorieFacultative,
  type IdCategorieConsentement,
} from "~/contenus/cookies-consentement";
import { aConsenti } from "~/fonctions/consentement/a-consenti";
import type { ChoixConsentement } from "~/types/consentement";

export type ValeurConsentement = {
  /** Bandeau d'aperçu (« ?apercu-cookies », apercu.sosmiam.fr) : partenaire imaginaire */
  apercu: boolean;
  /** Toutes les catégories (avec les « necessaires ») */
  categories: CategorieConsentement[];
  /** Celles sur lesquelles on demande un choix ; vide aujourd'hui : ni bandeau ni panneau */
  aChoisir: CategorieFacultative[];
  /** Le choix encore valable, ou null */
  choix: ChoixConsentement | null;
  /** Vrai si la catégorie peut servir (toujours pour « necessaires ») */
  aConsenti: (categorie: IdCategorieConsentement) => boolean;
  /** Ouvre le panneau « Choisir » avec les choix actuels ; faux s'il n'y a rien à choisir (le lien suit alors son adresse) */
  ouvrirReglages: (declencheur: HTMLElement | null) => boolean;
  /** Envoi d'un formulaire de choix (bandeau, panneau, /cookies, vignette) : traité dans le navigateur, sans recharger */
  envoyerFormulaire: (evenement: FormEvent<HTMLFormElement>) => void;
  /** Adresse (POST) des formulaires de choix, aperçu compris : ils marchent aussi sans JavaScript */
  actionFormulaire: string;
};

/** Sans GestionnaireConsentement (page d'erreur) : rien à choisir, seuls les cookies nécessaires, formulaires envoyés tels quels */
export const ContexteConsentement = createContext<ValeurConsentement>({
  apercu: false,
  categories: categoriesConsentement,
  aChoisir: [],
  choix: null,
  aConsenti: (categorie) => aConsenti(categorie, null),
  ouvrirReglages: () => false,
  envoyerFormulaire: () => {},
  actionFormulaire: ADRESSE_CHOIX_COOKIES,
});

/**
 * Le consentement aux cookies dans un composant : `const { aConsenti } = utiliserConsentement(); aConsenti("publicite")`.
 * Lu par le serveur au premier affichage (pas de clignotement), puis tenu à jour dans le navigateur à chaque choix.
 */
export function utiliserConsentement(): ValeurConsentement {
  return use(ContexteConsentement);
}
