import { useId, type ReactNode } from "react";

type Props<T extends string> = {
  libelle: ReactNode;
  valeur: T;
  options: { valeur: T; libelle: string }[];
  onChange: (valeur: T) => void;
  className?: string;
  libelleMasque?: boolean;
};

/** Liste déroulante avec son libellé (masqué visuellement si besoin, mais toujours lu par les lecteurs d'écran). */
export function Selecteur<T extends string>({ libelle, valeur, options, onChange, className = "", libelleMasque }: Props<T>) {
  const id = useId();
  return (
    <div className={`grid content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className={libelleMasque ? "sr-only" : "text-sm font-semibold"}>{libelle}</label>
      <select
        id={id}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value as T)}
        className="h-10 rounded-xl border border-ligne bg-white px-3 text-[15px] outline-none focus:border-encre"
      >
        {options.map((option) => <option key={option.valeur} value={option.valeur}>{option.libelle}</option>)}
      </select>
    </div>
  );
}
