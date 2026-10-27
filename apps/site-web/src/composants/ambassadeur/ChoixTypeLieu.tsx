import { use } from "react";

import { ContexteFormulaire } from "~/composants/compte/FormulaireCompte";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { STRUCTURE_DEMANDE_LIEU, TEXTES_DEMANDE_LIEU_PAR_LANGUE } from "~/contenus/demande-lieu";
import { TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE } from "~/contenus/proposer-un-lieu";
import { assemblerDemandeLieu } from "~/fonctions/lieux/assembler-demande-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** « C'est plutôt… » : resto, pâtisserie, bar, sortie ou autre (facultatif), en pastilles comme sur /inscrire-mon-lieu. */
export function ChoixTypeLieu() {
  const { prefixe, valeurs } = use(ContexteFormulaire);
  const T = utiliserTextes(TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE).formulaire;
  const typesDemandeLieu = assemblerDemandeLieu(STRUCTURE_DEMANDE_LIEU, utiliserTextes(TEXTES_DEMANDE_LIEU_PAR_LANGUE)).types;
  const idTitre = `${prefixe}-type-titre`;
  return (
    <div className="mb-6">
      <p id={idTitre} className="mb-1.5 block text-sm font-semibold">{T.cEstPlutot}<span className="font-normal text-gris">{T.facultatif}</span></p>
      <div role="radiogroup" aria-labelledby={idTitre} className="flex flex-wrap gap-2.5">
        {typesDemandeLieu.map((type) => (
          <label key={type.valeur} className="group cursor-pointer">
            <input type="radio" name="type" value={type.valeur} defaultChecked={valeurs.type === type.valeur} className="peer sr-only" />
            <span className="flex items-center gap-2 rounded-full border-2 border-encre bg-white py-1.5 pr-4 pl-1.5 font-semibold transition-colors hover:bg-jaune-clair
              peer-checked:bg-encre peer-checked:text-jaune peer-checked:hover:bg-encre
              peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-encre">
              {type.valeur === "autre"
                ? <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full border-2 border-encre bg-jaune text-base">✨</span>
                : <PictoCategorie type={type.valeur} className="h-8 w-8" />}
              {type.libelle}
              {/* Coche visible même en mode de contraste élevé, cachée aux lecteurs d'écran (la radio dit déjà « cochée ») */}
              <span aria-hidden="true" className="hidden group-has-checked:inline">✓</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
