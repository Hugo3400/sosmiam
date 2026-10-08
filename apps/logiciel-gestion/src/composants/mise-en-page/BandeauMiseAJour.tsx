import { Gift } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import type { MiseAJour } from "~/services/mises-a-jour.ts";

/** « Nouvelle version disponible » en haut de l'écran, avec le bouton pour l'installer. */
export function BandeauMiseAJour({ miseAJour }: { miseAJour: MiseAJour }) {
  const [etat, setEtat] = useState<{ pourcentage: number | null; erreur: string | null }>({ pourcentage: null, erreur: null });
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 border-b-2 border-encre bg-jaune px-8 py-2.5 text-sm">
      <Gift className="size-4 shrink-0" aria-hidden />
      <p className="flex-1 font-semibold">
        La version {miseAJour.version} du logiciel est prête.
        {etat.pourcentage !== null && ` Téléchargement : ${etat.pourcentage} %…`}
        {etat.erreur && <span className="text-rouge-texte"> {etat.erreur}</span>}
      </p>
      <Bouton
        petit
        variante="secondaire"
        chargement={etat.pourcentage !== null && !etat.erreur}
        onClick={() => {
          setEtat({ pourcentage: 0, erreur: null });
          miseAJour.installer((pourcentage) => setEtat({ pourcentage, erreur: null })).catch(() => setEtat({ pourcentage: null, erreur: "Installation ratée, réessaie plus tard." }));
        }}
      >
        Installer et redémarrer
      </Bouton>
    </div>
  );
}
