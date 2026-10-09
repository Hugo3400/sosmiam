import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

/** Rond noir et sa coche jaune, devant chaque atout de l'affiche et du flyer. */
export function PuceAtout({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={c.encre} />
      <path d="M11 20.5l6 6 12-13" fill="none" stroke={c.jaune} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
