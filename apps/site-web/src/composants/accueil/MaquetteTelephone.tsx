import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import type { CategorieLieu } from "~/types/lieux";

// Deux cartes de lieu « à venir » : la forme de l'app, sans faux noms ni faux chiffres (lignes grisées à la place)
const cartes: { categorie: CategorieLieu; degrade: string }[] = [
  { categorie: "resto", degrade: "linear-gradient(135deg, var(--color-jaune), var(--color-tomate))" },
  { categorie: "patisserie", degrade: "linear-gradient(135deg, var(--color-jaune-clair), var(--color-jaune))" },
];

/** Téléphone du haut de l'accueil : la forme de l'app, encore en développement. Aucun lieu inventé. */
export function MaquetteTelephone() {
  return (
    <figure className="justify-self-center">
      <div aria-hidden="true" className="w-[290px] rotate-0 rounded-[44px] bg-encre p-3 shadow-telephone lg:rotate-[4deg] lg:animate-flotte">
        <div className="flex min-h-[520px] flex-col gap-3.5 rounded-[34px] bg-creme px-4 py-5">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>📍 Près de chez toi</span>
            <span className="rounded-lg bg-tomate px-2.5 py-0.5 font-titre text-[.85rem] font-extrabold text-white">SOS</span>
          </div>
          {cartes.map((carte) => (
            <div key={carte.categorie} className="overflow-hidden rounded-[18px] bg-white shadow-douce">
              <div className="grid h-[120px] place-items-center" style={{ background: carte.degrade }}>
                <PictoCategorie type={carte.categorie} className="h-16 w-16" />
              </div>
              <div className="flex flex-col gap-2 px-3 pt-3 pb-3.5">
                <span className="h-3.5 w-3/4 rounded-full bg-encre/15" />
                <span className="h-2.5 w-1/2 rounded-full bg-encre/10" />
                <span className="mt-1 h-5 w-24 rounded-full bg-jaune-clair" />
              </div>
            </div>
          ))}
          <span className="mt-auto rounded-full border-2 border-encre bg-jaune py-3 text-center text-[.95rem] font-bold">À la rescousse !</span>
        </div>
      </div>
      <figcaption className="mt-6 text-center text-sm font-semibold text-gris">📱 Aperçu de l'app, encore en développement</figcaption>
    </figure>
  );
}
