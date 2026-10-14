type Props = {
  titre: string;
  /** Petit texte au-dessus du titre (« Sortie des Miamis ») */
  surTitre?: string;
  /** Flèche de retour à gauche (écran ouvert depuis un autre) */
  retour?: boolean;
};

/** Haut d'un écran dessiné : flèche de retour facultative, sur-titre et titre. */
export function EnTeteEcran({ titre, surTitre, retour = false }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-4 pt-1 pb-3">
      {retour && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ligne bg-white text-[15px]">‹</span>}
      <div className="min-w-0">
        {surTitre && <span className="block text-[10px] font-bold tracking-[.08em] text-gris uppercase">{surTitre}</span>}
        <span className="block font-titre text-[22px] leading-tight font-extrabold">{titre}</span>
      </div>
    </div>
  );
}
