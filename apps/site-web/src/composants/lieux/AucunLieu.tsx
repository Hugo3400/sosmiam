import { Bouton } from "~/composants/interface/Bouton";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { TEXTES_AUCUN_LIEU_PAR_LANGUE } from "~/contenus/aucun-lieu";
import { categoriesLieux } from "~/contenus/categories-lieux";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Quand aucun lieu n'est publié (ou que la liste ne peut pas s'afficher) : on le dit franchement, sans faux lieux. */
export function AucunLieu({ indisponible }: { indisponible: boolean }) {
  const T = utiliserTextes(TEXTES_AUCUN_LIEU_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const proposerUnLieu = `mailto:bonjour@sosmiam.fr?subject=${encodeURIComponent(T.courriel.objet)}&body=${encodeURIComponent(T.courriel.texte)}`;
  return (
    <div className="mx-auto max-w-3xl rounded-carte border-2 border-dashed border-encre/40 bg-white px-6 py-12 text-center md:px-12">
      <div className="mb-6 flex justify-center gap-3" aria-hidden="true">
        {categoriesLieux.map((categorie, position) => (
          <PictoCategorie key={categorie.valeur} type={categorie.valeur} className={`h-12 w-12 ${position % 2 ? "rotate-6" : "-rotate-6"}`} />
        ))}
      </div>
      <h3 className="text-2xl font-extrabold md:text-3xl">
        {indisponible ? T.titre.indisponible : T.titre.vide}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-gris">
        {indisponible ? T.texte.indisponible : T.texte.vide}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Bouton href={lien("/#inscription")}>{T.previensMoi}</Bouton>
        <Bouton href={proposerUnLieu} variante="blanc">{T.proposer}</Bouton>
      </div>
    </div>
  );
}
