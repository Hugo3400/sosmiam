import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireMediaSignale } from "~/services/moderation.ts";

/**
 * La photo ou la note vocale d'un message signalé : chargée seulement quand on la demande (c'est noté au journal), jamais
 * gardée sur ce PC. Plus lisible une fois le signalement jugé.
 */
export function MediaSignale({ signalementId }: { signalementId: number }) {
  const [media, setMedia] = useState<{ adresse: string; type: string } | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  async function charger() {
    setEtat({ enCours: true, erreur: null });
    try {
      const blob = await lireMediaSignale(signalementId);
      setMedia({ adresse: URL.createObjectURL(blob), type: blob.type });
      setEtat({ enCours: false, erreur: null });
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }
  if (media?.type.startsWith("audio/")) return <audio controls src={media.adresse} className="w-40" />;
  if (media) return <img src={media.adresse} alt="Photo signalée" className="w-40 rounded-xl border border-ligne object-contain" />;
  return (
    <div className="grid w-40 content-start gap-2">
      <Bouton petit icone={ImageIcon} chargement={etat.enCours} onClick={charger}>Voir le média signalé</Bouton>
      <p className="text-xs text-gris">Noté au journal.</p>
      {etat.erreur && <p role="alert" className="text-xs font-semibold text-tomate">{etat.erreur}</p>}
    </div>
  );
}
