type Props = {
  /** Centre et rayon du disque, en pixels du visuel */
  x: number;
  y: number;
  rayon: number;
  /** Couleur du disque (« none » : l'anneau seul) */
  fond: string;
  /** Couleur des points de l'anneau, un peu plus grand que le disque */
  points: string;
};

/** Grand disque et son anneau de points, derrière l'illustration d'un visuel (comme sur l'image de partage). */
export function DisqueDecor({ x, y, rayon, fond, points }: Props) {
  const anneau = rayon + 44;
  return (
    <svg
      className="absolute"
      style={{ left: x - anneau, top: y - anneau, width: anneau * 2, height: anneau * 2 }}
      viewBox={`${-anneau} ${-anneau} ${anneau * 2} ${anneau * 2}`}
    >
      <circle r={rayon} fill={fond} />
      <circle r={anneau - 5} fill="none" stroke={points} strokeWidth="9" strokeLinecap="round" strokeDasharray="0.1 30" />
    </svg>
  );
}
