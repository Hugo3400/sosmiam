import { Bouee } from "~/composants/marque/Bouee";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

const ETOILE = "100,21 102.35,26.76 108.56,27.22 103.8,31.24 105.29,37.28 100,34 94.71,37.28 96.2,31.24 91.44,27.22 97.65,26.76";

/** L'écusson du quartier (piste C du kit de marque) : couverts croisés, bouée et ruban. Décoratif. */
export function Ecusson({ ruban, className = "" }: { ruban: string; className?: string }) {
  // Jusqu'à 9 lettres (« FONDATEUR »), texte du ruban tel quel ; au-delà (« AMBASSADEUR »), plus petit et plus serré
  // dans la même proportion, pour garder la même marge, et toujours centré en hauteur dans le ruban
  const echelle = Math.min(1, 9 / ruban.length);
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill={c.encre} />
      <circle cx="100" cy="100" r="88" fill="none" stroke={c.jaune} strokeWidth="2" strokeDasharray="5 4" />
      <circle cx="100" cy="100" r="80" fill={c.jaune} />
      {/* Fourchette */}
      <g transform="rotate(-38 100 100)" fill={c.encre}>
        <rect x="97" y="96" width="6" height="70" rx="3" />
        <rect x="94" y="66" width="12" height="34" rx="4" />
        <rect x="89" y="60" width="22" height="9" rx="4" />
        <rect x="89" y="34" width="4" height="30" rx="2" />
        <rect x="95" y="34" width="4" height="30" rx="2" />
        <rect x="101" y="34" width="4" height="30" rx="2" />
        <rect x="107" y="34" width="4" height="30" rx="2" />
      </g>
      {/* Couteau */}
      <g transform="rotate(38 100 100)" fill={c.encre}>
        <rect x="95" y="108" width="10" height="60" rx="5" />
        <path d="M95 112V46Q95 30 107 32Q106 72 105 112Z" />
      </g>
      <polygon points={ETOILE} fill={c.tomate} stroke={c.encre} strokeWidth="1.5" strokeLinejoin="round" />
      <Bouee x={62} y={54} taille={76} />
      {/* Ruban */}
      <polygon points="8,140 36,140 36,168 8,168 18,154" fill={c.tomateFonce} stroke={c.encre} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="192,140 164,140 164,168 192,168 182,154" fill={c.tomateFonce} stroke={c.encre} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="22" y="128" width="156" height="32" rx="3" fill={c.tomate} stroke={c.encre} strokeWidth="2.5" />
      <text
        x="100"
        y={echelle === 1 ? 150.5 : 144 + 6.5 * echelle}
        textAnchor="middle"
        className="font-titre"
        fontSize={18 * echelle}
        fontWeight="800"
        letterSpacing={2 * echelle}
        fill={c.blanc}
      >
        {ruban}
      </text>
    </svg>
  );
}
