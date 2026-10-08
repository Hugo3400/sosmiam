import { useEffect, useRef, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  texte: string;
  /** Ce qui est copié, pour les lecteurs d'écran : « le texte « Je suis ambassadeur » », « le code de la couleur Tomate » */
  libelle: string;
};

/**
 * Bouton « Copier » : met le texte dans le presse-papier et le dit (« Copié ! », lu par les lecteurs d'écran).
 * Il n'apparaît qu'avec JavaScript et un presse-papier disponible ; sans eux, le texte reste là, à sélectionner à la main.
 */
export function BoutonCopier({ texte, libelle }: Props) {
  const [disponible, setDisponible] = useState(false);
  const [message, setMessage] = useState("");
  const minuteur = useRef<number | undefined>(undefined);

  useEffect(() => {
    setDisponible(Boolean(navigator.clipboard));
    return () => window.clearTimeout(minuteur.current);
  }, []);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setMessage("Copié !");
    } catch {
      setMessage("La copie n'a pas marché : sélectionne le texte à la main.");
    }
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => setMessage(""), 4000);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {disponible && (
        <Bouton petit variante="blanc" onClick={copier}>
          Copier<span className="sr-only"> {libelle}</span>
        </Bouton>
      )}
      <p role="status" className="text-sm font-semibold">{lierPonctuation(message)}</p>
    </div>
  );
}
