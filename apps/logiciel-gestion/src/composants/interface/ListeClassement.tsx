import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";

type Props = {
  elements: { valeur: string; nombre: number }[];
  /** Comment afficher chaque valeur (nom du pays…) */
  nommer?: (valeur: string) => string;
  vide?: string;
  maximum?: number;
};

/** Classement en barres horizontales : libellé, barre proportionnelle, nombre au bout. */
export function ListeClassement({ elements, nommer = (v) => v, vide = "Rien pour l'instant.", maximum = 8 }: Props) {
  if (elements.length === 0) return <p className="py-4 text-sm text-gris">{vide}</p>;
  const plus = Math.max(...elements.map((e) => e.nombre), 1);
  return (
    <ol className="grid gap-2">
      {elements.slice(0, maximum).map((element) => (
        <li key={element.valeur} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
          <span className="truncate" title={nommer(element.valeur)}>{nommer(element.valeur)}</span>
          <span className="chiffres font-semibold">{formaterNombre(element.nombre)}</span>
          <span className="col-span-2 h-1.5 rounded-full bg-ligne/60" aria-hidden>
            <span className="block h-full rounded-full bg-graphique" style={{ width: `${Math.max(2, (element.nombre / plus) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
