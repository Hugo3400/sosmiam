import type { MouseEvent, ReactNode } from "react";

import { utiliserConsentement } from "~/hooks/utiliser-consentement";

type Props = {
  /** Sans JavaScript, ou sans rien à choisir : la page des réglages (/cookies#mes-choix, adresse complète sur un autre hôte) */
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * Le lien « Gérer mes cookies » des pieds de page (sur les trois hôtes) : il rouvre le panneau « Choisir » avec les choix
 * actuels, modifiables. Sans JavaScript, ou tant qu'aucune catégorie n'est active, il suit son adresse.
 */
export function LienGererCookies({ href, className, children }: Props) {
  const { ouvrirReglages } = utiliserConsentement();

  function quandClic(evenement: MouseEvent<HTMLAnchorElement>) {
    if (evenement.button !== 0 || evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;
    if (ouvrirReglages(evenement.currentTarget)) evenement.preventDefault();
  }

  return <a href={href} onClick={quandClic} className={className}>{children}</a>;
}
