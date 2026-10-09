import { useCallback, useState } from "react";

/** Ce que montre le bandeau : le texte, de quoi tout remettre, et un numéro qui relance le bandeau à chaque nouveau geste */
export type BandeauAnnulerAffiche = { texte: string; annuler: () => void; numero: number };

/** Le bandeau « Retiré · Annuler » d'un écran : un seul à la fois, le dernier geste remplace le précédent. */
export function utiliserBandeauAnnuler() {
  const [bandeau, setBandeau] = useState<BandeauAnnulerAffiche | null>(null);
  /** Après un retrait : « Lieu retiré », et la fonction qui le remet */
  const montrer = useCallback((texte: string, annuler: () => void) => setBandeau((avant) => ({ texte, annuler, numero: (avant?.numero ?? 0) + 1 })), []);
  const fermer = useCallback(() => setBandeau(null), []);
  return { bandeau, montrer, fermer };
}
