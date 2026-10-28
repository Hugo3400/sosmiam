import { createContext, useContext } from "react";

import type { ZoneGeo } from "@sos-miam/commun/contenus/regions-france";
import type { Lieu } from "@sos-miam/commun/types/lieu";

export type LectureLieu = { ok: true; lieu: Lieu } | { ok: false; raison: "inconnu" | "hors-ligne" };

export type EtatLieux = {
  /** Les lieux publiés lus sur le serveur, avant le filtre d'âge */
  lieux: Lieu[];
  /** Un lieu par son identifiant, ou undefined s'il n'est pas dans la liste */
  trouverLieu: (id: number) => Lieu | undefined;
  /** Faux tant que rien n'est encore lu (ni la copie du téléphone, ni le serveur) */
  pret: boolean;
  /** Le serveur n'a pas répondu (la copie du téléphone reste affichée) */
  horsLigne: boolean;
  /** Relit la liste sur le serveur (ouverture, retour dans l'app), et avec elle les zones déjà lues */
  recharger: () => Promise<void>;
  /**
   * Lit un seul lieu absent de la liste (lien partagé, lieu tout juste publié) et l'y ajoute. « inconnu » : absent,
   * brouillon ou masqué ; toujours « inconnu » en démo (la liste d'exemples est complète).
   */
  chargerLieu: (id: number) => Promise<LectureLieu>;
  /**
   * Lit aussi les lieux d'une zone (autour de toi, ta région, une ville choisie) et les ajoute à la liste : sans zone, le
   * serveur n'en rend que 1 000. La zone part arrondie à la grille de 0,5 degré (jamais une position exacte) ; une zone lue
   * il y a moins de 10 minutes n'est pas relue ; seules les 4 dernières sont gardées ; rien en démo (liste complète).
   */
  chargerZone: (zone: ZoneGeo, depuisTaPosition?: boolean) => void;
  oublierZonesDeTaPosition: () => void;
};

export const ContexteLieux = createContext<EtatLieux | null>(null);

/** Les lieux de l'app (FournisseurLieux) : la seule source, à filtrer en visite sans compte (filtrerLieuxSelonAge, âge inconnu). */
export function utiliserLieux(): EtatLieux {
  const valeur = useContext(ContexteLieux);
  if (!valeur) throw new Error("utiliserLieux doit être appelé sous <FournisseurLieux>.");
  return valeur;
}
