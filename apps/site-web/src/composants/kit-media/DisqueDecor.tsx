type Props = {
  rayon: number;
  /** Couleur du disque */
  fond: string;
  /** Couleur des points de l'anneau, un peu plus grand que le disque */
  points: string;
};

/**
 * Grand disque et son anneau de points, centré derrière une illustration (comme sur l'image de partage). À placer dans
 * un parent relatif, avant l'illustration (elle-même relative, pour passer devant).
 */
export function DisqueDecor({ rayon, fond, points }: Props) {
  const anneau = rayon + 32;
  return (
    <svg
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      width={anneau * 2}
      height={anneau * 2}
      viewBox={`${-anneau} ${-anneau} ${anneau * 2} ${anneau * 2}`}
    >
      <circle r={rayon} fill={fond} />
      <circle r={anneau - 5} fill="none" stroke={points} strokeWidth="9" strokeLinecap="round" strokeDasharray="0.1 30" />
    </svg>
  );
}
