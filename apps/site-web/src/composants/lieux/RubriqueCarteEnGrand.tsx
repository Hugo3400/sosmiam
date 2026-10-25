import { ElementCarteDuLieu } from "~/composants/lieux/ElementCarteDuLieu";
import { MESSAGE_SANITAIRE_ALCOOL } from "~/contenus/legal/prevention";
import type { RubriqueCarte } from "~/types/carte";

export function RubriqueCarteEnGrand({ rubrique }: { rubrique: RubriqueCarte }) {
  return (
    <section aria-labelledby={rubrique.id} className="mb-6 flex break-inside-avoid flex-col gap-3 rounded-carte border-2 border-encre bg-white px-5 py-5 md:px-6 md:py-[22px] print:rounded-none">
      <h2 id={rubrique.id} lang="fr" className="text-[22px] font-extrabold [overflow-wrap:anywhere]">{rubrique.titre}</h2>
      <ul lang="fr">
        {rubrique.elements.map((element, rang) => <ElementCarteDuLieu key={`${rang}-${element.nom}`} element={element} />)}
      </ul>
      {rubrique.alcool && <p className="rounded-[10px] bg-jaune-clair px-2.5 py-2 text-xs font-bold [print-color-adjust:exact]">{MESSAGE_SANITAIRE_ALCOOL}</p>}
    </section>
  );
}
