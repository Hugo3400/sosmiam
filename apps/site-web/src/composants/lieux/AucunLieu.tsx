import { Bouton } from "~/composants/interface/Bouton";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { categoriesLieux } from "~/contenus/categories-lieux";

const PROPOSER_UN_LIEU = `mailto:bonjour@sosmiam.fr?subject=${encodeURIComponent("Je propose un lieu à SOS Miam")}&body=${encodeURIComponent(
  "Salut l'équipe SOS Miam !\n\nNom du lieu : \nVille et quartier : \nPourquoi il mérite plus de monde : \n",
)}`;

/** Quand aucun lieu n'est publié (ou que la liste ne peut pas s'afficher) : on le dit franchement, sans faux lieux. */
export function AucunLieu({ indisponible }: { indisponible: boolean }) {
  return (
    <div className="mx-auto max-w-3xl rounded-carte border-2 border-dashed border-encre/40 bg-white px-6 py-12 text-center md:px-12">
      <div className="mb-6 flex justify-center gap-3" aria-hidden="true">
        {categoriesLieux.map((categorie, position) => (
          <PictoCategorie key={categorie.valeur} type={categorie.valeur} className={`h-12 w-12 ${position % 2 ? "rotate-6" : "-rotate-6"}`} />
        ))}
      </div>
      <h3 className="text-2xl font-extrabold md:text-3xl">
        {indisponible ? "Les lieux font une petite pause" : "Les premières pépites arrivent"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-gris">
        {indisponible
          ? "Impossible d'afficher les lieux pour le moment. Reviens dans un instant !"
          : "Aucun lieu n'est encore publié : les premiers restos, pâtisseries, bars et sorties arrivent avec le lancement, partout en France. Ici, que du vrai : pas de faux lieux pour faire joli."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Bouton href="/#inscription">Préviens-moi au lancement</Bouton>
        <Bouton href={PROPOSER_UN_LIEU} variante="blanc">Proposer une pépite</Bouton>
      </div>
    </div>
  );
}
