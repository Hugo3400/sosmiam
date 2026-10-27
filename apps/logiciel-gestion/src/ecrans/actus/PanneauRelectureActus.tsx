import { Ban, PencilLine, Send } from "lucide-react";
import { useState } from "react";

import { POINTS_ARTICLE_ACTUS } from "../../../../../packages/commun/src/regles/actus.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { TEXTES_ACTUS as T, VERIFICATIONS_ACTUS } from "~/contenus/actus.ts";
import type { PublicationActus, RefusActus } from "~/services/actus.ts";
import { ModaleRefusActus } from "./ModaleRefusActus.tsx";

type Props = {
  alcoolRepere: boolean;
  enCours: boolean;
  onPublier: (publication: PublicationActus) => void;
  onRetoucher: (message: string) => void;
  onRefuser: (refus: RefusActus) => void;
};

export function PanneauRelectureActus({ alcoolRepere, enCours, onPublier, onRetoucher, onRefuser }: Props) {
  const [coches, setCoches] = useState<boolean[]>(() => VERIFICATIONS_ACTUS.map(() => false));
  const [aLaUne, setALaUne] = useState(false);
  const [alcool, setAlcool] = useState(false);
  const [message, setMessage] = useState("");
  const [refuser, setRefuser] = useState(false);
  const toutVerifie = coches.every(Boolean);
  const messageValide = message.trim().length >= 10 && message.length <= 1000;

  return (
    <div className="grid content-start gap-3.5">
      <fieldset className="grid gap-2.5 rounded-2xl border-2 border-encre bg-white p-4">
        <legend className="px-1.5 text-sm font-extrabold">{T.aVerifier}</legend>
        {VERIFICATIONS_ACTUS.map(({ cle, texte }, rang) => (
          <div key={cle} className="grid gap-2">
            <CaseACocher
              libelle={texte}
              coche={coches[rang]!}
              onChange={(coche) => setCoches((avant) => avant.map((valeur, i) => (i === rang ? coche : valeur)))}
            />
            {cle === "alcool" && (
              <div className="ml-6.5 rounded-xl bg-creme px-3 py-2">
                <CaseACocher
                  libelle={T.caseAlcool}
                  aide={alcoolRepere ? T.alcoolRepere : T.aideAlcool}
                  coche={alcoolRepere || alcool}
                  desactive={alcoolRepere}
                  onChange={setAlcool}
                />
              </div>
            )}
          </div>
        ))}
      </fieldset>
      <CaseACocher libelle={T.aLaUne} aide={T.aideALaUne} coche={aLaUne} onChange={setALaUne} />
      <Bouton variante="principal" icone={Send} desactive={!toutVerifie || enCours} onClick={() => onPublier({ aLaUne, alcool: !alcoolRepere && alcool })}>{T.publier}</Bouton>
      <p className="text-xs text-gris">{T.aidePublier(POINTS_ARTICLE_ACTUS)}</p>
      <ZoneTexte libelle={T.messageRetouche} valeur={message} onChange={setMessage} maximum={1000} lignes={3} placeholder={T.placeholderRetouche} />
      <Bouton icone={PencilLine} desactive={!messageValide || enCours} onClick={() => onRetoucher(message.trim())}>{T.retoucher}</Bouton>
      <Bouton variante="danger" icone={Ban} desactive={enCours} onClick={() => setRefuser(true)}>{T.refuser}</Bouton>
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
