import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { lirePhotoAvis } from "~/services/avis.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

export function PhotoAvis({ avisId }: { avisId: number }) {
  const [adresse, setAdresse] = useState<string | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  useEffect(() => () => void (adresse && URL.revokeObjectURL(adresse)), [adresse]);

  async function charger() {
    setEtat({ enCours: true, erreur: null });
    try {
      setAdresse(URL.createObjectURL(await lirePhotoAvis(avisId)));
      setEtat({ enCours: false, erreur: null });
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  if (adresse) return <img src={adresse} alt="Photo de l'avis" className="max-h-64 w-fit rounded-xl border border-ligne object-contain" />;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Bouton petit icone={ImageIcon} chargement={etat.enCours} onClick={charger}>Voir la photo de l'avis</Bouton>
      <span className="text-xs text-gris">Noté au journal.</span>
      {etat.erreur && <span role="alert" className="text-xs font-semibold text-tomate">{etat.erreur}</span>}
    </div>
  );
}
