import { LienGererCookies } from "~/composants/cookies/LienGererCookies";
import { site } from "~/contenus/legal/informations-legales";
import { ADRESSE_GERER_COOKIES, TEXTES_PAGES_LEGALES_PAR_LANGUE } from "~/contenus/legal/liens-legaux";
import { TEXTES_PIED_DE_PAGE_PAR_LANGUE } from "~/contenus/liens-pied-de-page";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { listerPagesLegales } from "~/fonctions/legal/lister-pages-legales";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function PiedDePageLegal() {
  const langue = utiliserLangue();
  const T = utiliserTextes(TEXTES_PAGES_LEGALES_PAR_LANGUE);
  const pied = utiliserTextes(TEXTES_PIED_DE_PAGE_PAR_LANGUE);
  const liensLegaux = listerPagesLegales(T, langue).slice(0, 5);
  return (
    <footer className="bg-encre py-8 text-creme">
      <nav aria-label={pied.groupes.legal} className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {liensLegaux.map((lien) => <a key={lien.href} href={lien.href} className="opacity-80 hover:opacity-100">{lien.texte}</a>)}
        <LienGererCookies href={ecrireCheminLangue(ADRESSE_GERER_COOKIES, langue)} className="opacity-80 hover:opacity-100">{T.gererCookies}</LienGererCookies>
        <a href={`mailto:${site.emailContact}`} className="opacity-80 hover:opacity-100">{pied.liens.contact}</a>
      </nav>
    </footer>
  );
}
