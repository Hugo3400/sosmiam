import { type RefObject, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";
import { Mascotte } from "~/composants/marque/Mascotte";
import { GroupesMenu } from "~/composants/mise-en-page/GroupesMenu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEnTete } from "~/hooks/utiliser-en-tete";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";

type Props = {
  /** L'id du dialogue, que le bouton « Menu » de l'en-tête désigne (aria-controls) */
  id: string;
  ouvert: boolean;
  /** Le menu s'est fermé (bouton, lien, Échap, écran élargi) : l'en-tête remet son bouton à « fermé » */
  surFermeture: () => void;
  /** Le bouton « Menu » de l'en-tête, qui reprend le focus quand on ferme sans quitter la page */
  boutonMenu: RefObject<HTMLButtonElement | null>;
  sectionVisible: string | null;
};

/**
 * Le menu des petits écrans (moins de 1024 px) : un <dialog> modal plein écran, posé par-dessus la page sans la pousser.
 * Le navigateur garde le focus dedans (le reste de la page devient inerte) et le ferme avec Échap ; la page dessous ne
 * défile plus. Il se ferme aussi avec « Fermer » (le focus revient au bouton « Menu »), à chaque lien choisi (la page
 * suivante ou la section reçoit le focus) et quand l'écran s'élargit. Sans JavaScript, c'est MenuSansJavascript qui sert.
 */
export function MenuMobile({ id, ouvert, surFermeture, boutonMenu, sectionVisible }: Props) {
  const { textes, lienPreviensMoi } = utiliserEnTete();
  const lienLangue = utiliserLienLangue();
  const dialogue = useRef<HTMLDialogElement>(null);
  const boutonFermer = useRef<HTMLButtonElement>(null);
  // Fermeture demandée par la page : l'événement « close » qui suit est déjà traité
  const fermetureVoulue = useRef(false);

  const fermer = useCallback(
    (rendreFocus: boolean) => {
      const element = dialogue.current;
      if (element?.open) {
        fermetureVoulue.current = true;
        element.close();
      }
      surFermeture();
      if (rendreFocus) boutonMenu.current?.focus();
    },
    [surFermeture, boutonMenu],
  );

  useEffect(() => {
    const element = dialogue.current;
    if (!element || !ouvert) return;
    if (!element.open) element.showModal();
    boutonFermer.current?.focus();
    const racine = document.documentElement;
    const debordementAvant = racine.style.overflow;
    racine.style.overflow = "hidden";
    // Au-delà de 1024 px, la barre montre ses liens : le menu n'a plus lieu d'être
    const grandEcran = window.matchMedia("(min-width: 64rem)");
    const surChangement = () => {
      if (grandEcran.matches) fermer(false);
    };
    grandEcran.addEventListener("change", surChangement);
    return () => {
      racine.style.overflow = debordementAvant;
      grandEcran.removeEventListener("change", surChangement);
      if (element.open) {
        fermetureVoulue.current = true;
        element.close();
      }
    };
  }, [ouvert, fermer]);

  // Échap (fermeture faite par le navigateur) : l'en-tête se met à jour et le focus revient au bouton « Menu »
  function surClose() {
    if (fermetureVoulue.current) {
      fermetureVoulue.current = false;
      return;
    }
    surFermeture();
    boutonMenu.current?.focus();
  }

  const quitter = () => fermer(false);

  return (
    <dialog
      ref={dialogue}
      id={id}
      aria-label={textes.menu}
      onClose={surClose}
      className="m-0 h-dvh max-h-none w-full max-w-none translate-y-2 overflow-hidden border-0 bg-creme p-0 text-encre opacity-0
        transition-[opacity,translate,display,overlay] transition-discrete duration-200 ease-out backdrop:bg-encre/30
        open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0"
    >
      <div className="flex h-full flex-col">
        <div className="mx-auto flex h-[72px] w-[min(1120px,100%-32px)] shrink-0 items-center justify-between gap-4">
          <Link to={lienLangue("/")} aria-label={textes.accueil} onClick={quitter} className="rounded-lg focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-encre">
            <Logo className="h-9 w-auto" />
          </Link>
          <button
            ref={boutonFermer}
            type="button"
            onClick={() => fermer(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-encre bg-white px-4 py-2 text-[.9rem] font-semibold transition-colors
              hover:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {textes.fermer}
          </button>
        </div>

        <nav aria-label={textes.menuPrincipal} className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-encre/10">
          <div className="mx-auto w-[min(1120px,100%-16px)] py-5">
            <GroupesMenu prefixe={id} sectionVisible={sectionVisible} surLien={quitter} />
          </div>
        </nav>

        <div className="shrink-0 border-t-2 border-encre bg-jaune pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap items-center gap-x-4 gap-y-3 py-3">
            <Mascotte expression="clin" className="size-12 shrink-0" />
            <p className="min-w-0 flex-[1_1_180px] leading-snug font-semibold">
              {lierPonctuation(textes.appBientot)}
            </p>
            <Bouton href={lienPreviensMoi.adresse} variante="blanc" onClick={quitter} className="w-full whitespace-nowrap md:w-auto">
              {lienPreviensMoi.texte}
            </Bouton>
          </div>
        </div>
      </div>
    </dialog>
  );
}
