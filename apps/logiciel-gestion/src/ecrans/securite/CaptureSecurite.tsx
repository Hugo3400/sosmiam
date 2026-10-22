import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireCaptureSecurite } from "~/services/securite.ts";

export function CaptureSecurite({ signalementId, numero }: { signalementId: string; numero: number }) {
  const [adresse, setAdresse] = useState<string | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  useEffect(() => () => void (adresse && URL.revokeObjectURL(adresse)), [adresse]);

  async function charger() {
    setEtat({ enCours: true, erreur: null });
    try {
      setAdresse(URL.createObjectURL(await lireCaptureSecurite(signalementId, numero)));
      setEtat({ enCours: false, erreur: null });
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  if (adresse) return <img src={adresse} alt={`Capture ${numero + 1}`} className="max-h-96 w-fit rounded-xl border border-ligne object-contain" />;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Bouton petit icone={ImageIcon} chargement={etat.enCours} onClick={charger}>Voir la capture {numero + 1}</Bouton>
      {etat.erreur && <span role="alert" className="text-xs font-semibold text-tomate">{etat.erreur}</span>}
    </div>
  );
}
