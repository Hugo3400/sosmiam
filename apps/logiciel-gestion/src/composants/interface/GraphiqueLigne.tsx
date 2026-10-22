import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type PointLigne = { cle: string; valeur: number | null; libelle: string; libelleLong: string };

type Props = {
  points: PointLigne[];
  plafond: number;
  graduations: number[];
  formaterGraduation: (valeur: number) => string;
  formaterValeur: (valeur: number) => string;
  mesure: string;
  hauteur?: number;
  sansAxe?: boolean;
};

const MARGE = { haut: 10, droite: 10, gauche: 56 };

function tracer(points: PointLigne[], x: (rang: number) => number, y: (valeur: number) => number) {
  const morceaux: { rangs: number[] }[] = [];
  let courant: number[] = [];
  points.forEach((point, rang) => {
    if (point.valeur === null) {
      if (courant.length) morceaux.push({ rangs: courant });
      courant = [];
    } else courant.push(rang);
  });
  if (courant.length) morceaux.push({ rangs: courant });
  return morceaux.map(({ rangs }) => {
    const ligne = rangs.map((rang, i) => `${i ? "L" : "M"}${x(rang).toFixed(1)},${y(points[rang]?.valeur ?? 0).toFixed(1)}`).join(" ");
    const premier = rangs[0] ?? 0;
    const dernier = rangs[rangs.length - 1] ?? 0;
    return { ligne, aire: `${ligne} L${x(dernier).toFixed(1)},${y(0).toFixed(1)} L${x(premier).toFixed(1)},${y(0).toFixed(1)} Z`, seul: rangs.length === 1 ? premier : null };
  });
}

export function GraphiqueLigne({ points, plafond, graduations, formaterGraduation, formaterValeur, mesure, hauteur = 200, sansAxe = false }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(520);
  const [actif, setActif] = useState<number | null>(null);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => entree && setLargeur(Math.max(260, entree.contentRect.width)));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const bas = sansAxe ? 6 : 24;
  const zoneL = largeur - MARGE.gauche - MARGE.droite;
  const zoneH = hauteur - MARGE.haut - bas;
  const maximum = plafond > 0 ? plafond : 1;
  const x = (rang: number) => MARGE.gauche + (points.length <= 1 ? zoneL : (rang / (points.length - 1)) * zoneL);
  const y = (valeur: number) => MARGE.haut + zoneH - (Math.min(valeur, maximum) / maximum) * zoneH;
  const morceaux = tracer(points, x, y);
  const nombreLibelles = largeur < 420 ? 3 : 5;
  const rangsLibelles = points.length > 1 ? [...new Set(Array.from({ length: nombreLibelles }, (_, i) => Math.round((i / (nombreLibelles - 1)) * (points.length - 1))))] : [0];
  const dernier = [...points.keys()].reverse().find((rang) => points[rang]?.valeur !== null);
  const point = actif === null ? null : points[actif];

  function survoler(evenement: PointerEvent<SVGSVGElement>) {
    const cadre = evenement.currentTarget.getBoundingClientRect();
    const rang = Math.round(((evenement.clientX - cadre.left - MARGE.gauche) / zoneL) * (points.length - 1));
    setActif(Math.max(0, Math.min(points.length - 1, rang)));
  }

  function clavier(evenement: KeyboardEvent<SVGSVGElement>) {
    if (evenement.key !== "ArrowLeft" && evenement.key !== "ArrowRight") return;
    evenement.preventDefault();
    const pas = evenement.key === "ArrowLeft" ? -1 : 1;
    setActif((avant) => Math.max(0, Math.min(points.length - 1, (avant ?? (pas > 0 ? -1 : points.length)) + pas)));
  }

  return (
    <div ref={conteneur} className="relative">
      <svg
        width={largeur}
        height={hauteur}
        role="img"
        aria-label={`${mesure}, ${points.length} mesures. Flèches gauche et droite pour lire les valeurs.`}
        tabIndex={0}
        className="block overflow-visible outline-none focus-visible:outline-3 focus-visible:outline-encre"
        onPointerMove={survoler}
        onPointerLeave={() => setActif(null)}
        onKeyDown={clavier}
        onBlur={() => setActif(null)}
      >
        {graduations.map((graduation) => (
          <g key={graduation}>
            <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(graduation)} y2={y(graduation)} className="stroke-ligne" strokeWidth={1} />
            <text x={MARGE.gauche - 8} y={y(graduation)} dy="0.32em" textAnchor="end" className="chiffres fill-gris text-[11px]">{formaterGraduation(graduation)}</text>
          </g>
        ))}
        {!sansAxe && rangsLibelles.map((rang, i) => (
          <text key={rang} x={x(rang)} y={hauteur - 6} textAnchor={i === 0 ? "start" : i === rangsLibelles.length - 1 ? "end" : "middle"} className="chiffres fill-gris text-[11px]">
            {points[rang]?.libelle}
          </text>
        ))}
        {morceaux.map((morceau) => (
          <g key={morceau.ligne}>
            <path d={morceau.aire} className="fill-graphique/15" />
            <path d={morceau.ligne} fill="none" className="stroke-graphique" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {morceau.seul !== null && <circle cx={x(morceau.seul)} cy={y(points[morceau.seul]?.valeur ?? 0)} r={3} className="fill-graphique" />}
          </g>
        ))}
        {dernier !== undefined && <circle cx={x(dernier)} cy={y(points[dernier]?.valeur ?? 0)} r={4} className="fill-graphique stroke-white" strokeWidth={2} />}
        {point && actif !== null && (
          <g>
            <line x1={x(actif)} x2={x(actif)} y1={MARGE.haut} y2={MARGE.haut + zoneH} className="stroke-encre" strokeWidth={1} />
            {point.valeur !== null && <circle cx={x(actif)} cy={y(point.valeur)} r={5} className="fill-graphique stroke-white" strokeWidth={2} />}
          </g>
        )}
      </svg>
      {point && actif !== null && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-encre bg-white px-3 py-1.5 text-[13px] whitespace-nowrap shadow-brut-petit"
          style={{ left: Math.min(Math.max(x(actif), 80), largeur - 80), top: -46 }}
        >
          <p className="font-bold">{point.libelleLong}</p>
          <p className="chiffres">{point.valeur === null ? "Pas de mesure" : `${mesure} : ${formaterValeur(point.valeur)}`}</p>
        </div>
      )}
    </div>
  );
}
