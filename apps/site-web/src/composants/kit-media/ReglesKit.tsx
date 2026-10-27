import { TEXTES_KIT_MEDIA_PAR_LANGUE } from "~/contenus/kit-media";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Les règles à montrer : celles du kit média par défaut (le kit média pro a les siennes) */
  regles?: { readonly peux: readonly string[]; readonly peuxPas: readonly string[] };
};

/** Les règles d'un kit : ce que tu peux faire, et ce que tu ne peux pas faire. */
export function ReglesKit({ regles: reglesDonnees }: Props) {
  const T = utiliserTextes(TEXTES_KIT_MEDIA_PAR_LANGUE);
  const regles = reglesDonnees ?? T.regles;
  const colonnes = [
    { titre: T.colonnesRegles.peux, regles: regles.peux, signe: "✓", fond: "bg-jaune-clair", pastille: "bg-jaune text-encre" },
    { titre: T.colonnesRegles.peuxPas, regles: regles.peuxPas, signe: "✕", fond: "bg-rose-alerte", pastille: "bg-encre text-white" },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {colonnes.map((colonne) => (
        <div key={colonne.titre} className={`rounded-carte border-2 border-encre p-6 ${colonne.fond}`}>
          <h3 className="mb-4 text-xl font-extrabold">{colonne.titre}</h3>
          <ul className="grid gap-3">
            {colonne.regles.map((regle) => (
              <li key={regle} className="relative pl-9">
                <span aria-hidden="true" className={`absolute top-0.5 left-0 grid size-6 place-items-center rounded-full text-sm font-extrabold ${colonne.pastille}`}>
                  {colonne.signe}
                </span>
                {lierPonctuation(regle)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
