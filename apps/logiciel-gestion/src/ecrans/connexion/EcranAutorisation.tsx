import { useState } from "react";

import { Onglets } from "~/composants/interface/Onglets.tsx";
import { TEXTES_AUTORISATION as T } from "~/contenus/postes.ts";
import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { CadreConnexion } from "./CadreConnexion.tsx";
import { FormulaireAutorisationDistance } from "./FormulaireAutorisationDistance.tsx";
import { InstructionsAutorisationServeur } from "./InstructionsAutorisationServeur.tsx";

type Props = {
  coffre: CoffreCle;
  coupe: boolean;
  onConnecte: (poste: string, coffre: CoffreCle) => void;
  onContinuer: () => void;
  onOublierPoste: () => void;
};

export function EcranAutorisation({ coffre, coupe, onConnecte, onContinuer, onOublierPoste }: Props) {
  const [mode, setMode] = useState<(typeof T.modes)[number]["valeur"]>("distance");

  return (
    <CadreConnexion titre={T.titre} sousTitre={T.sousTitre}>
      {coupe && <p role="alert" className="mb-5 rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">{T.coupe}</p>}
      <Onglets libelle={T.titre} valeur={mode} options={T.modes.map(({ valeur, libelle }) => ({ valeur, libelle }))} onChange={setMode} />
      <div className="mt-5">
        {mode === "distance"
          ? <FormulaireAutorisationDistance coffre={coffre} onConnecte={onConnecte} />
          : <InstructionsAutorisationServeur coffre={coffre} onContinuer={onContinuer} />}
      </div>
      <button type="button" className="mt-6 text-sm font-semibold text-gris underline" onClick={() => window.confirm(T.confirmerEffacer) && onOublierPoste()}>
        {T.effacer}
      </button>
    </CadreConnexion>
  );
}
