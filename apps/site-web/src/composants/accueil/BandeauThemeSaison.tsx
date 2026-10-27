import type { CSSProperties } from "react";
import { Link } from "react-router";

import type { ThemeSaisonApi } from "../../../../../packages/commun/src/types/theme-saison.ts";

const CLASSE_BOUTON =
  "mt-5 inline-flex items-center justify-center rounded-full border-2 px-5 py-2.5 font-semibold shadow-[4px_4px_0_var(--ombre)] transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ombre)] focus-visible:outline-3 focus-visible:outline-offset-3";

export function BandeauThemeSaison({ theme }: { theme: ThemeSaisonApi }) {
  const { couleurs, textes } = theme;
  const idTitre = `theme-saison-${theme.id}`;
  const styleBouton = { backgroundColor: couleurs.accent, color: couleurs.surAccent, borderColor: couleurs.texte, outlineColor: couleurs.texte, "--ombre": couleurs.texte } as CSSProperties;

  return (
    <section aria-labelledby={idTitre} className="border-b-2 border-encre" style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}>
      <div className="mx-auto grid w-[min(1120px,100%-32px)] grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-6 sm:gap-x-10 md:py-8">
        <div className="col-start-1 row-start-1 min-w-0 self-center sm:self-end">
          <p className="mb-3 inline-block rounded-full border-2 border-current px-3 py-0.5 text-[.85rem] font-semibold">{textes.etiquette}</p>
          <h2 id={idTitre} className="text-[clamp(1.5rem,4vw,2.3rem)] font-extrabold tracking-tight text-balance">
            {textes.titre}
          </h2>
        </div>
        <div className="col-span-2 row-start-2 min-w-0 self-start sm:col-span-1">
          <p className="mt-2 max-w-[560px] text-[.95rem] md:text-base">{textes.texte}</p>
          {theme.lienInfo ? (
            <a href={theme.lienInfo.adresse} hrefLang={theme.lienInfo.langue} target="_blank" rel="noopener noreferrer" style={styleBouton} className={CLASSE_BOUTON}>
              {textes.bouton}
            </a>
          ) : (
            <Link to="/lieux" style={styleBouton} className={CLASSE_BOUTON}>
              {textes.bouton}
            </Link>
          )}
        </div>
        <img
          src={`/images/tenues-capitaine/${theme.tenue}.svg`}
          alt={textes.tenue}
          width={300}
          height={330}
          className="col-start-2 row-start-1 h-auto w-[84px] self-center sm:row-span-2 sm:w-36 md:w-48"
        />
      </div>
    </section>
  );
}
