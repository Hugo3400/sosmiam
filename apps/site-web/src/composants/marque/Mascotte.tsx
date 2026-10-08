import { Bouee, type ExpressionBouee } from "~/composants/marque/Bouee";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

type Props = {
  expression: ExpressionBouee;
  className?: string;
};

/** La mascotte du kit de marque (piste A) : la bouée avec sa corde, sur un disque jaune clair. Décorative. */
export function Mascotte({ expression, className = "" }: Props) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <circle cx="80" cy="80" r="72" fill={c.jauneClair} />
      <Bouee x={18} y={18} taille={124} expression={expression} corde />
    </svg>
  );
}
