import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { Logo } from "~/composants/interface/Logo";

const liens = [
  { href: "/#comment", texte: "Comment ça marche" },
  { href: "/#adresses", texte: "Les adresses" },
  { href: "/#big-sos", texte: "BIG SOS" },
  { href: "/#pros", texte: "Pour les pros" },
  { href: "/#ambassadeurs", texte: "Ambassadeurs" },
  { href: "/faq", texte: "FAQ" },
];

/** En-tête collant : logo, liens vers les sections, et menu burger sous 1024 px (Échap le ferme). */
export function EnTete() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const boutonMenu = useRef<HTMLButtonElement>(null);
  const fermer = () => setMenuOuvert(false);

  useEffect(() => {
    if (!menuOuvert) return;
    function fermerAvecEchap(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setMenuOuvert(false);
      boutonMenu.current?.focus();
    }
    document.addEventListener("keydown", fermerAvecEchap);
    return () => document.removeEventListener("keydown", fermerAvecEchap);
  }, [menuOuvert]);

  return (
    <header className="sticky top-0 z-50 border-b border-encre/5 bg-creme/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-[min(1120px,100%-32px)] items-center justify-between gap-4">
        <Link to="/" aria-label="SOS Miam, accueil" onClick={fermer}>
          <Logo />
        </Link>

        {/* Le bouton vient avant le menu : après l'ouverture, Tab passe directement aux liens */}
        <button
          ref={boutonMenu}
          type="button"
          className="p-2 lg:hidden"
          aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOuvert}
          aria-controls="menu-principal"
          onClick={() => setMenuOuvert(!menuOuvert)}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className={`my-[5px] block h-[2.5px] w-6 rounded bg-encre transition-transform duration-200
              ${menuOuvert && i === 0 ? "translate-y-[7.5px] rotate-45" : ""}
              ${menuOuvert && i === 1 ? "opacity-0" : ""}
              ${menuOuvert && i === 2 ? "-translate-y-[7.5px] -rotate-45" : ""}`} />
          ))}
        </button>

        <nav
          id="menu-principal"
          aria-label="Menu principal"
          className={`${menuOuvert ? "flex" : "hidden"} absolute inset-x-0 top-[72px] flex-col gap-4 border-b-2 border-encre bg-creme px-4 pt-6 pb-7
            lg:static lg:flex lg:flex-row lg:items-center lg:gap-3 lg:border-0 lg:bg-transparent lg:p-0 xl:gap-7`}
        >
          {liens.map((lien) => {
            const classes = "whitespace-nowrap font-medium decoration-jaune decoration-[3px] underline-offset-4 hover:underline";
            // Les sections de l'accueil (/#…) restent des ancres ; les autres pages passent par le routeur
            return lien.href.includes("#")
              ? <a key={lien.href} href={lien.href} onClick={fermer} className={classes}>{lien.texte}</a>
              : <Link key={lien.href} to={lien.href} onClick={fermer} className={classes}>{lien.texte}</Link>;
          })}
          <Bouton href="/#inscription" petit onClick={fermer} className="whitespace-nowrap">Je m'inscris</Bouton>
        </nav>
      </div>
    </header>
  );
}
