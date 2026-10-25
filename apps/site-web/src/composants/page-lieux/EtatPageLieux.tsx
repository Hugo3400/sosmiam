import { Link } from "react-router";

import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { categoriesLieux } from "~/contenus/categories-lieux";
import { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props =
  | { etat: "bientot" | "indisponible"; adresse: string }
  | { etat: "aucun"; recherche: string | null };

export function EtatPageLieux(props: Props) {
  const T = TEXTES_PAGE_LIEUX.etats;
  const textes =
    props.etat === "aucun"
      ? { titre: T.aucun.titre, texte: T.aucun.texte(props.recherche), lien: T.aucun.lien, vers: "/lieux" }
      : props.etat === "bientot"
        ? { ...T.bientot, vers: "/#adresses" }
        : { ...T.indisponible, vers: props.adresse };
  return (
    <div className="rounded-carte border-2 border-dashed border-encre/40 bg-white px-6 py-10 text-center md:px-10">
      <div className="mb-5 flex justify-center gap-3" aria-hidden="true">
        {categoriesLieux.map((categorie, position) => (
          <PictoCategorie key={categorie.valeur} type={categorie.valeur} className={`h-10 w-10 ${position % 2 ? "rotate-6" : "-rotate-6"}`} />
        ))}
      </div>
      <h2 className="text-2xl font-extrabold">{textes.titre}</h2>
      <p className="mx-auto mt-3 max-w-xl text-gris">{lierPonctuation(textes.texte)}</p>
      {props.etat === "indisponible" ? (
        <a href={textes.vers} className="mt-6 inline-flex rounded-full border-2 border-encre bg-jaune px-6 py-3 font-semibold shadow-brut focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre">
          {textes.lien}
        </a>
      ) : (
        <Link to={textes.vers} className="mt-6 inline-flex rounded-full border-2 border-encre bg-jaune px-6 py-3 font-semibold shadow-brut focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre">
          {textes.lien}
        </Link>
      )}
    </div>
  );
}
