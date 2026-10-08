/** Trait dessiné à la main sous un mot (comme sous « régale-toi. » sur l'image de partage). À placer dans un parent relatif. */
export function TraitSouligne({ couleur, epaisseur = 14 }: { couleur: string; epaisseur?: number }) {
  return (
    <svg viewBox="0 0 300 30" preserveAspectRatio="none" className="absolute -bottom-[0.18em] left-[2%] h-[0.32em] w-[96%]" aria-hidden="true">
      <path d="M6 20Q80 9 150 14T294 11" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
