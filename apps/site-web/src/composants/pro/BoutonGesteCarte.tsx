import type { ReactNode } from "react";

import { nommerBoutonCarte } from "~/fonctions/carte/nommer-bouton-carte";

type Props = {
  /** « ajouter-plat:1 », « monter-plat:1:3 »… (fonctions/carte/appliquer-geste-carte.ts) */
  geste: string;
  /** L'id du bouton qui reprend le focus après le geste précédent (le même bouton, à sa nouvelle place) */
  focus: string | null;
  /** Le mot visible (« Monter ») ; la suite, pour les lecteurs d'écran, dans `precision` */
  children: ReactNode;
  /** Ce sur quoi agit le bouton, lu seulement (« le plat 2, Tiramisu ») */
  precision?: string;
  emoji?: string;
  /** Plus visible : « Ajouter un plat », « Ajouter une section » */
  ajout?: boolean;
  danger?: boolean;
};

/**
 * Un bouton de l'éditeur de carte : un vrai bouton d'envoi (name « geste »), pour que tout marche sans JavaScript.
 * L'action de la page change le brouillon et réaffiche le formulaire, sans rien enregistrer.
 */
export function BoutonGesteCarte({ geste, focus, children, precision, emoji, ajout, danger }: Props) {
  const id = nommerBoutonCarte(geste);
  const couleurs = ajout
    ? "border-encre bg-jaune shadow-brut hover:shadow-brut-grand px-4 py-2"
    : danger
      ? "border-rouge-texte/60 bg-white text-rouge-texte px-3 py-1.5 text-sm"
      : "border-encre/30 bg-white px-3 py-1.5 text-sm hover:border-encre";
  return (
    <button
      type="submit"
      name="geste"
      value={geste}
      id={id}
      autoFocus={focus === id}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 font-semibold transition-[translate,box-shadow,border-color] duration-150
        focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre ${couleurs}`}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span>{children}{precision && <span className="sr-only">{` ${precision}`}</span>}</span>
    </button>
  );
}
