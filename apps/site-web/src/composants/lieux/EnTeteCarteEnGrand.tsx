import { Link } from "react-router";

import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { TEXTES_CARTE_EN_GRAND } from "~/contenus/carte-en-grand";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";

type Props = { lieuId: number; nom: string; logo: string | null | undefined; titre: string; date: string | null };

const CLASSE_BOUTON =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-encre px-4 py-2.5 text-[15px] text-encre no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre";

export function EnTeteCarteEnGrand({ lieuId, nom, logo, titre, date }: Props) {
  const T = TEXTES_CARTE_EN_GRAND;
  const javascriptActif = utiliserJavascriptActif();
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="flex min-w-0 items-center gap-4 md:gap-[18px]">
        {logo && <img src={logo} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-2xl border-2 border-encre bg-white object-cover" />}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[34px] font-extrabold md:text-[40px]">{titre}</h1>
          <p className="text-[15px] text-gris [overflow-wrap:anywhere]">{T.sousTitre(nom, date)}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2.5 print:hidden">
        {javascriptActif && (
          <button type="button" onClick={() => window.print()} className={`${CLASSE_BOUTON} bg-white font-semibold hover:bg-jaune-clair`}>
            <IconeFiche nom="imprimer" />
            {T.imprimer}
          </button>
        )}
        <Link to={`/lieux/${lieuId}`} className={`${CLASSE_BOUTON} bg-jaune font-bold shadow-brut-petit`}>
          <IconeFiche nom="fermer" />
          {T.fermer}
          <span className="sr-only">{T.retourFiche(nom)}</span>
        </Link>
      </div>
    </header>
  );
}
