import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";
import { LienNavigation } from "~/composants/mise-en-page/LienNavigation";
import { MenuMobile } from "~/composants/mise-en-page/MenuMobile";
import { MenuSansJavascript } from "~/composants/mise-en-page/MenuSansJavascript";
import { utiliserEnTete } from "~/hooks/utiliser-en-tete";
import { utiliserEnTeteCollee } from "~/hooks/utiliser-en-tete-collee";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserSectionVisible } from "~/hooks/utiliser-section-visible";

const ID_MENU = "menu-mobile";

const focusVisible = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";
const classeLienBarre =
  `block whitespace-nowrap rounded-full px-3 py-2 text-[.95rem] font-semibold text-encre/85 transition-colors xl:px-4 ${focusVisible} ` +
  "hover:bg-jaune-clair hover:text-encre aria-[current=page]:bg-jaune aria-[current=page]:text-encre aria-[current=true]:bg-jaune aria-[current=true]:text-encre";
const classeBoutonContour =
  `inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-encre bg-white py-2 text-[.9rem] font-semibold transition-colors ${focusVisible} ` +
  "hover:bg-jaune-clair";

/**
 * En-tête des pages publiques de sosmiam.fr, collant en haut de l'écran (une ombre légère dès qu'il est collé).
 * Grands écrans : le logo, six liens au milieu (la section de l'accueil qu'on lit ou la page où l'on est en jaune), puis
 * « Mon compte » et « Préviens-moi » (la newsletter). Sous 1024 px : le logo, « Préviens-moi » dès 768 px, et le bouton
 * « Menu » qui ouvre MenuMobile par-dessus la page (MenuSansJavascript quand JavaScript est coupé).
 */
export function EnTete() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const enTete = useRef<HTMLElement>(null);
  const boutonMenu = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const { textes, liensBarre, lienMonCompte, lienPreviensMoi } = utiliserEnTete();
  const lienLangue = utiliserLienLangue();
  const collee = utiliserEnTeteCollee(enTete);
  const sections = liensBarre.flatMap((lien) => (lien.section ? [lien.section] : []));
  const sectionVisible = utiliserSectionVisible(sections, pathname === "/" || pathname === "/en");
  const fermerMenu = useCallback(() => setMenuOuvert(false), []);

  return (
    <>
      <header
        ref={enTete}
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300
          ${collee ? "border-encre/10 bg-creme/85 shadow-[0_10px_24px_-18px_rgb(26_26_26/0.45)]" : "border-encre/5 bg-creme"}`}
      >
        <div className="mx-auto flex h-[72px] w-[min(1120px,100%-32px)] items-center gap-4">
          <Link to={lienLangue("/")} aria-label={textes.accueil} className="shrink-0 rounded-lg focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-encre">
            <Logo className="h-9 w-auto xl:h-10" />
          </Link>

          <nav aria-label={textes.menuPrincipal} className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-0.5 xl:gap-1">
              {liensBarre.map((lien) => (
                <li key={lien.adresse}>
                  <LienNavigation lien={lien} sectionVisible={lien.section === sectionVisible} className={classeLienBarre} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <LienNavigation lien={lienMonCompte} className={`${classeBoutonContour} pr-4 pl-3 aria-[current=page]:bg-jaune-clair`}>
              <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
                <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <path d="M4.5 20.5c1.2-3.9 4.1-6 7.5-6s6.3 2.1 7.5 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              {lienMonCompte.texte}
            </LienNavigation>
            <Bouton href={lienPreviensMoi.adresse} petit className="whitespace-nowrap">{lienPreviensMoi.texte}</Bouton>
          </div>

          <div className="ml-auto flex items-center gap-3 lg:hidden">
            {/* Dans une enveloppe : la classe « hidden » ne l'emporterait pas sur le « inline-flex » du bouton */}
            <span className="hidden md:inline-flex">
              <Bouton href={lienPreviensMoi.adresse} petit className="whitespace-nowrap">{lienPreviensMoi.texte}</Bouton>
            </span>
            <button
              ref={boutonMenu}
              type="button"
              aria-expanded={menuOuvert}
              aria-controls={ID_MENU}
              onClick={() => setMenuOuvert(true)}
              className={`${classeBoutonContour} px-4 aria-expanded:bg-jaune-clair noscript:hidden`}
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {textes.menu}
            </button>
            <MenuSansJavascript />
          </div>
        </div>
      </header>
      <MenuMobile id={ID_MENU} ouvert={menuOuvert} surFermeture={fermerMenu} boutonMenu={boutonMenu} sectionVisible={sectionVisible} />
    </>
  );
}
