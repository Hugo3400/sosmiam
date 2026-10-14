import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

type Props = {
  /** Contour et coche : encre sur fond clair, crème sur fond sombre */
  clair?: boolean;
  className?: string;
};

/** Le bouclier jaune de Miam Safe, avec sa coche. Décoratif (le texte « Miam Safe » est toujours écrit à côté). */
export function BouclierMiamSafe({ clair = false, className = "" }: Props) {
  const trait = clair ? c.creme : c.encre;
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden="true">
      <path d="M32 3 L59 13 V34 C59 52 47 63 32 69 C17 63 5 52 5 34 V13 Z" fill={c.jaune} stroke={trait} strokeWidth="4" strokeLinejoin="round" />
      <path d="M20 36 L29 45 L45 27" fill="none" stroke={c.encre} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
