import { useState } from "react";

import { TitreSection } from "~/composants/interface/TitreSection";
import { AucunLieu } from "~/composants/lieux/AucunLieu";
import { CarteLieu } from "~/composants/lieux/CarteLieu";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { Section } from "~/composants/mise-en-page/Section";
import { categoriesLieux } from "~/contenus/categories-lieux";
import type { CategorieLieu, LieuPublic } from "~/types/lieux";

/**
 * Les vrais lieux publiés (lus par l'accueil auprès de l'API), filtrables par catégorie.
 * Aucun lieu inventé : s'il n'y en a pas encore, ou si la liste ne peut pas être lue, on l'affiche franchement.
 */
export function IlsOntBesoinDeToi({ lieux }: { lieux: LieuPublic[] | null }) {
  const [filtre, setFiltre] = useState<CategorieLieu | "tous">("tous");
  const presentes = categoriesLieux.filter((categorie) => lieux?.some((lieu) => lieu.type === categorie.valeur));
  const visibles = (lieux ?? []).filter((lieu) => filtre === "tous" || lieu.type === filtre);
  const filtres = [{ valeur: "tous" as const, libelle: "Tout" }, ...presentes];

  return (
    <Section id="adresses" fond="creme">
      <TitreSection chapo="Des lieux nouveaux ou trop calmes, qui méritent plus de monde.">Ils ont besoin de toi</TitreSection>

      {!lieux || lieux.length === 0 ? (
        <AucunLieu indisponible={lieux === null} />
      ) : (
        <>
          {/* Filtres seulement s'il y a plusieurs catégories, et seulement celles qui ont des lieux */}
          {presentes.length > 1 && (
            <div className="mb-9 flex flex-wrap justify-center gap-2.5" role="group" aria-label="Filtrer les lieux">
              {filtres.map((categorie) => (
                <button
                  key={categorie.valeur}
                  type="button"
                  aria-pressed={filtre === categorie.valeur}
                  onClick={() => setFiltre(categorie.valeur)}
                  className={`flex items-center gap-2 rounded-full border-2 border-encre py-2.5 text-[.95rem] font-semibold transition-colors
                    ${categorie.valeur === "tous" ? "px-5" : "pr-5 pl-2.5"}
                    ${filtre === categorie.valeur ? "bg-encre text-jaune" : "bg-white hover:bg-jaune-clair"}`}
                >
                  {categorie.valeur !== "tous" && <PictoCategorie type={categorie.valeur} className="h-7 w-7 shrink-0" />}
                  {categorie.libelle}
                </button>
              ))}
            </div>
          )}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
            {visibles.map((lieu) => (
              <li key={lieu.id}>
                <CarteLieu lieu={lieu} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
