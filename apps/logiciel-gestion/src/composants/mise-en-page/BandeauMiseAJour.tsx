import { Gift } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import type { MiseAJour } from "~/services/mises-a-jour.ts";

/** « Nouvelle version disponible » en haut de l'écran : ses nouveautés, et le bouton pour l'installer quand Hugo le veut. */
export function BandeauMiseAJour({ miseAJour }: { miseAJour: MiseAJour }) {
  const [etat, setEtat] = useState<{ pourcentage: number | null; erreur: string | null }>({ pourcentage: null, erreur: null });
  const [ferme, setFerme] = useState(false);
  if (ferme) return null;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 border-b-2 border-nuit bg-jaune px-8 py-2.5 text-sm">
      <Gift className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        <strong>La version {miseAJour.version} du logiciel est prête.</strong>
        {miseAJour.notes && <span className="block truncate" title={miseAJour.notes}>{miseAJour.notes}</span>}
        {etat.pourcentage !== null && <span className="block font-semibold">Téléchargement : {etat.pourcentage} % — le logiciel va se fermer puis se rouvrir à jour.</span>}
        {etat.erreur && <span className="block font-semibold text-rouge-texte">{etat.erreur}</span>}
      </p>
      {etat.pourcentage === null && <Bouton petit variante="discret" onClick={() => setFerme(true)}>Plus tard</Bouton>}
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
