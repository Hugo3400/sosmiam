import { Bouton } from "~/composants/interface/Bouton";
import { GroupesMenu } from "~/composants/mise-en-page/GroupesMenu";
import { lienPreviensMoi } from "~/contenus/liens-en-tete";

/**
 * Le menu des petits écrans quand JavaScript est coupé (@media (scripting: none), variante noscript: de Tailwind) : un
 * <details> que le navigateur ouvre et ferme seul, avec les mêmes liens que MenuMobile, dans un panneau posé sous
 * l'en-tête. Avec JavaScript, il reste caché : c'est le bouton « Menu » et son dialogue qui servent.
 */
export function MenuSansJavascript() {
  return (
    <details className="group hidden noscript:block">
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border-2 border-encre bg-white px-4 py-2 text-[.9rem]
          font-semibold group-open:bg-jaune-clair focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre
          [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true" className="text-lg leading-none">☰</span>
        <span className="group-open:hidden">Menu</span>
        <span className="hidden group-open:inline">Fermer</span>
      </summary>
      <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-72px)] overflow-y-auto border-b-2 border-encre bg-creme shadow-douce">
        <nav aria-label="Menu principal" className="mx-auto w-[min(1120px,100%-16px)] py-6">
          <GroupesMenu prefixe="menu-sans-javascript" sectionVisible={null} />
          <div className="mt-6 px-2">
            <Bouton href={lienPreviensMoi.adresse} className="w-full">{lienPreviensMoi.texte}</Bouton>
          </div>
        </nav>
      </div>
    </details>
  );
}
