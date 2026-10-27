import { Ban, Send } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { TEXTES_ACTUS } from "~/contenus/actus.ts";
import type { RefusActus, ReponseLieuARelire } from "~/services/actus.ts";
import { ApercuReponseLieuActus } from "./ApercuReponseLieuActus.tsx";
import { ModaleRefusActus } from "./ModaleRefusActus.tsx";

const T = TEXTES_ACTUS.reponses;

type Props = {
  reponses: ReponseLieuARelire[];
  enCours: boolean;
  onPublier: (reponse: ReponseLieuARelire) => void;
  onRefuser: (reponse: ReponseLieuARelire, refus: RefusActus) => void;
};

export function ReponsesLieuxActus({ reponses, enCours, onPublier, onRefuser }: Props) {
  const [aRefuser, setARefuser] = useState<ReponseLieuARelire | null>(null);

  return (
    <div className="grid gap-4">
      <p className="rounded-xl border border-ligne bg-white px-4 py-2.5 text-sm">{T.regle}</p>
      <ul className="grid gap-3">
        {reponses.map((reponse) => (
          <li key={reponse.id} className="grid gap-3 rounded-carte border border-ligne bg-white p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <ApercuReponseLieuActus reponse={reponse} />
            <div className="grid content-start gap-2 lg:w-56">
              <Bouton variante="principal" icone={Send} desactive={enCours} onClick={() => onPublier(reponse)}>{T.publier}</Bouton>
              <Bouton variante="danger" icone={Ban} desactive={enCours} onClick={() => setARefuser(reponse)}>{T.refuser}</Bouton>
            </div>
          </li>
        ))}
      </ul>
      {aRefuser && (
        <ModaleRefusActus
          reponse
          onFermer={() => setARefuser(null)}
          onConfirmer={(refus) => {
            onRefuser(aRefuser, refus);
            setARefuser(null);
          }}
        />
      )}
    </div>
  );
}
