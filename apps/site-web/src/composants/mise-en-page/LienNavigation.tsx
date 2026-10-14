import type { ReactNode } from "react";
import { NavLink } from "react-router";

import type { LienEnTete } from "~/contenus/liens-en-tete";
import { creerAdresseLien } from "~/fonctions/hotes/creer-adresse-lien";

type Props = {
  lien: LienEnTete;
  /** Sa section de l'accueil est à l'écran : aria-current="true" */
  sectionVisible?: boolean;
  /** Les classes ; aria-[current=page] (la page où l'on est) et aria-[current=true] (la section qu'on lit) les mettent en valeur */
  className: string;
  onClick?: () => void;
  /** Le contenu, à la place du texte du lien (le menu des petits écrans y ajoute sa petite phrase) */
  children?: ReactNode;
};

/**
 * Un lien de l'en-tête de sosmiam.fr : l'adresse complète vers l'espace ambassadeur ou pro (rechargement complet) ; un
 * <a href="/#…"> vers une section de l'accueil (sans « # » dans l'adresse avec JavaScript, utiliserAncresSansDiese) ;
 * sinon un <NavLink>, qui pose aria-current="page" sur la page où l'on est.
 */
export function LienNavigation({ lien, sectionVisible = false, className, onClick, children }: Props) {
  const contenu = children ?? lien.texte;
  if (lien.site !== "principal") {
    return <a href={creerAdresseLien(lien.site, lien.adresse, "principal")} onClick={onClick} className={className}>{contenu}</a>;
  }
  if (lien.section) {
    return <a href={lien.adresse} aria-current={sectionVisible ? "true" : undefined} onClick={onClick} className={className}>{contenu}</a>;
  }
  return <NavLink to={lien.adresse} end onClick={onClick} className={className}>{contenu}</NavLink>;
}
