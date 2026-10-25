import { useId } from "react";

type Props = {
  etiquette: string;
  min: number;
  max: number;
  pas: number;
  valeur: number;
  valeurTexte?: string;
  onChange: (valeur: number) => void;
};

export function CurseurRecadrage({ etiquette, min, max, pas, valeur, valeurTexte, onChange }: Props) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{etiquette}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        aria-valuetext={valeurTexte}
        onChange={(evenement) => onChange(Number(evenement.currentTarget.value))}
        className="h-6 w-full cursor-pointer accent-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
      />
    </div>
  );
}
