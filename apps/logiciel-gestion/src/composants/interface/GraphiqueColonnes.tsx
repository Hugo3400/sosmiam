import { useEffect, useRef, useState } from "react";

import { calculerGraduations } from "~/fonctions/graphiques/calculer-graduations.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court.ts";

export type PointColonne = {
  cle: string;
  /** Sous la colonne : « 8 oct. », « S41 » */
  libelle: string;
  /** Dans l'info-bulle : « jeudi 8 octobre 2026 » */
  libelleLong: string;
  valeur: number;
  /** Autres lignes de l'info-bulle (« 12 visites », « 9 visiteurs ») */
  details?: string[];
  /** Période pas encore finie : colonne plus claire */
  enCours?: boolean;
  /** Valeur de la période correspondante juste avant (comparaison) */
  avant?: number;
  libelleAvant?: string;
};

const HAUTEUR = 220;
const MARGE = { haut: 12, droite: 8, bas: 28, gauche: 44 };

/**
 * Colonnes d'une mesure dans le temps, avec info-bulle au survol et au clavier, et un tableau pour les lecteurs d'écran.
 * `comparer` : chaque période a, juste à sa gauche, une colonne grise pour la même période d'avant (avec une légende).
 */
export function GraphiqueColonnes({ points, mesure, comparer = false }: { points: PointColonne[]; mesure: string; comparer?: boolean }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(640);
  const [actif, setActif] = useState<number | null>(null);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => entree && setLargeur(Math.max(280, entree.contentRect.width)));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const graduations = calculerGraduations(Math.max(...points.map((p) => Math.max(p.valeur, comparer ? (p.avant ?? 0) : 0)), 0));
  const plafond = graduations[graduations.length - 1] ?? 1;
  const zoneL = largeur - MARGE.gauche - MARGE.droite;
  const zoneH = HAUTEUR - MARGE.haut - MARGE.bas;
  const bande = zoneL / Math.max(points.length, 1);
  // Avec comparaison, deux colonnes par période (2 px d'écart entre elles)
  const epaisseur = Math.max(2, Math.min(comparer ? 14 : 24, comparer ? (bande - 6) / 2 : bande - 2));
  const y = (valeur: number) => MARGE.haut + zoneH - (valeur / plafond) * zoneH;
  // Un libellé d'axe toutes les n colonnes, pour qu'ils ne se chevauchent pas
  const pasLibelles = Math.max(1, Math.ceil(48 / bande));
  const point = actif === null ? null : points[actif];

  return (
    <div ref={conteneur} className="relative" onPointerLeave={() => setActif(null)}>
      <svg width={largeur} height={HAUTEUR} role="img" aria-label={`${mesure}, ${points.length} périodes`} className="block overflow-visible">
        {graduations.map((graduation) => (
          <g key={graduation}>
            <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(graduation)} y2={y(graduation)} stroke="#EDE6D3" strokeWidth={1} />
            <text x={MARGE.gauche - 8} y={y(graduation)} dy="0.32em" textAnchor="end" className="chiffres fill-gris text-[11px]">
              {formaterNombreCourt(graduation)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = MARGE.gauche + i * bande + (comparer ? bande / 2 + 1 : (bande - epaisseur) / 2);
          const hauteur = Math.max(0, MARGE.haut + zoneH - y(p.valeur));
          const rayon = Math.min(4, hauteur, epaisseur / 2);
          const bas = MARGE.haut + zoneH;
          const xAvant = MARGE.gauche + i * bande + bande / 2 - 1 - epaisseur;
          const hauteurAvant = comparer ? Math.max(0, MARGE.haut + zoneH - y(p.avant ?? 0)) : 0;
          const rayonAvant = Math.min(4, hauteurAvant, epaisseur / 2);
          return (
            <g key={p.cle}>
              {hauteurAvant > 0 && (
                <path
                  d={`M${xAvant},${bas} V${bas - hauteurAvant + rayonAvant} Q${xAvant},${bas - hauteurAvant} ${xAvant + rayonAvant},${bas - hauteurAvant} H${xAvant + epaisseur - rayonAvant} Q${xAvant + epaisseur},${bas - hauteurAvant} ${xAvant + epaisseur},${bas - hauteurAvant + rayonAvant} V${bas} Z`}
                  fill="#B8B2A6"
                />
              )}
              {hauteur > 0 && (
                <path
                  d={`M${x},${bas} V${bas - hauteur + rayon} Q${x},${bas - hauteur} ${x + rayon},${bas - hauteur} H${x + epaisseur - rayon} Q${x + epaisseur},${bas - hauteur} ${x + epaisseur},${bas - hauteur + rayon} V${bas} Z`}
                  className="fill-graphique transition-opacity"
                  opacity={p.enCours ? 0.45 : actif === null || actif === i ? 1 : 0.7}
                />
              )}
              {i % pasLibelles === 0 && (
                <text x={MARGE.gauche + i * bande + bande / 2} y={HAUTEUR - 8} textAnchor="middle" className="fill-gris text-[11px]">{p.libelle}</text>
              )}
              {/* Zone de survol : toute la hauteur de la bande, plus facile à viser que la colonne */}
              <rect
                x={MARGE.gauche + i * bande}
                y={MARGE.haut}
                width={bande}
                height={zoneH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${p.libelleLong} : ${formaterNombre(p.valeur)} ${mesure.toLowerCase()}`}
                onPointerEnter={() => setActif(i)}
                onFocus={() => setActif(i)}
                onBlur={() => setActif(null)}
                className="outline-none"
              />
            </g>
          );
        })}
        <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={MARGE.haut + zoneH} y2={MARGE.haut + zoneH} stroke="#5C5A55" strokeWidth={1} />
      </svg>

      {point && actif !== null && (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 rounded-xl border border-encre bg-white px-3 py-2 text-[13px] shadow-brut-petit"
          style={{ left: Math.min(Math.max(MARGE.gauche + actif * bande + bande / 2, 90), largeur - 90), top: Math.max(0, y(point.valeur) - 78) }}
        >
          <p className="font-bold first-letter:uppercase">{point.libelleLong}{point.enCours ? " (en cours)" : ""}</p>
          <p className="chiffres">{formaterNombre(point.valeur)} {mesure.toLowerCase()}</p>
          {point.details?.map((ligne) => <p key={ligne} className="chiffres text-gris">{ligne}</p>)}
          {comparer && point.avant !== undefined && (
            <p className="chiffres mt-1 border-t border-ligne pt-1 text-gris">Période d'avant{point.libelleAvant ? ` (${point.libelleAvant})` : ""} : {formaterNombre(point.avant)}</p>
          )}
        </div>
      )}

      {comparer && (
        <p className="mt-1 flex flex-wrap gap-4 text-[13px] text-gris">
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-graphique" aria-hidden /> Période affichée</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#B8B2A6]" aria-hidden /> Période d'avant</span>
        </p>
      )}
      <table className="sr-only">
        <caption>{mesure}</caption>
        <thead><tr><th scope="col">Période</th><th scope="col">{mesure}</th>{comparer && <th scope="col">Période d'avant</th>}</tr></thead>
        <tbody>
          {points.map((p) => <tr key={p.cle}><th scope="row">{p.libelleLong}</th><td>{p.valeur}</td>{comparer && <td>{p.avant ?? 0}</td>}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
