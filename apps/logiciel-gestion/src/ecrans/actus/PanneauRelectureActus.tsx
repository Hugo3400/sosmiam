import { Ban, PencilLine, Send } from "lucide-react";
import { useState } from "react";

import { POINTS_ARTICLE_ACTUS } from "../../../../../packages/commun/src/regles/actus.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { TEXTES_ACTUS as T, VERIFICATIONS_ACTUS } from "~/contenus/actus.ts";
import { ModaleRefusActus } from "./ModaleRefusActus.tsx";

type Props = {
  onPublier: () => void;
  onRetoucher: (message: string) => void;
  onRefuser: (refus: { motif: string; motivation: string }) => void;
};

export function PanneauRelectureActus({ onPublier, onRetoucher, onRefuser }: Props) {
  const [coches, setCoches] = useState<boolean[]>(() => VERIFICATIONS_ACTUS.map(() => false));
  const [message, setMessage] = useState("");
  const [refuser, setRefuser] = useState(false);
  const toutVerifie = coches.every(Boolean);
  const messageValide = message.trim().length >= 10 && message.length <= 1000;

  return (
    <div className="grid content-start gap-3.5">
      <fieldset className="grid gap-2.5 rounded-2xl border-2 border-encre bg-white p-4">
        <legend className="px-1.5 text-sm font-extrabold">{T.aVerifier}</legend>
        {VERIFICATIONS_ACTUS.map((verification, rang) => (
          <CaseACocher
            key={verification}
            libelle={verification}
            coche={coches[rang]!}
            onChange={(coche) => setCoches((avant) => avant.map((valeur, i) => (i === rang ? coche : valeur)))}
          />
        ))}
      </fieldset>
      <Bouton variante="principal" icone={Send} desactive={!toutVerifie} onClick={onPublier}>{T.publier}</Bouton>
      <p className="text-xs text-gris">{T.aidePublier(POINTS_ARTICLE_ACTUS)}</p>
      <ZoneTexte libelle={T.messageRetouche} valeur={message} onChange={setMessage} maximum={1000} lignes={3} placeholder={T.placeholderRetouche} />
      <Bouton icone={PencilLine} desactive={!messageValide} onClick={() => onRetoucher(message.trim())}>{T.retoucher}</Bouton>
      <Bouton variante="danger" icone={Ban} onClick={() => setRefuser(true)}>{T.refuser}</Bouton>
      <p className="text-xs leading-snug text-gris">{T.prevenu}</p>
      {refuser && (
        <ModaleRefusActus
          onFermer={() => setRefuser(false)}
          onConfirmer={(refus) => {
            setRefuser(false);
            onRefuser(refus);
          }}
        />
      )}
    </div>
  );
}
