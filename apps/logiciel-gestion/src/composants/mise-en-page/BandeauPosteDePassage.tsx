import { LogOut, Luggage } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { TEXTES_PASSAGE as T } from "~/contenus/postes.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { CoffreCle } from "~/stockage/coffre-local.ts";

export function BandeauPosteDePassage({ coffre, onPartir }: { coffre: CoffreCle; onPartir: () => Promise<void> }) {
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, setEnCours] = useState(false);
  if (typeof coffre.expireLe !== "string") return null;

  async function partir() {
    setEnCours(true);
    await onPartir();
  }

  return (
    <>
      <div role="status" className="flex items-center gap-3 border-b-2 border-encre bg-jaune-clair px-8 py-2.5 text-sm">
        <Luggage className="size-4 shrink-0" aria-hidden />
        <p className="flex-1 font-semibold">{T.bandeau(formaterDate(coffre.expireLe, true))}</p>
        <Bouton petit variante="danger" icone={LogOut} onClick={() => setConfirmer(true)}>{T.partir}</Bouton>
      </div>
      <Modale
        titre={T.titreConfirmation}
        ouverte={confirmer}
        onFermer={() => setConfirmer(false)}
        actions={<><Bouton onClick={() => setConfirmer(false)}>{T.annuler}</Bouton><Bouton variante="danger" chargement={enCours} onClick={() => void partir()}>{T.confirmer}</Bouton></>}
      >
        <p className="text-sm">{T.confirmation}</p>
      </Modale>
    </>
  );
}
