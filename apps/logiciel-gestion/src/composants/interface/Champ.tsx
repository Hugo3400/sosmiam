import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  libelle: ReactNode;
  valeur: string;
  onChange: (valeur: string) => void;
  aide?: ReactNode;
  erreur?: string | null;
};

/** Champ de saisie avec son libellé, une aide et un message d'erreur. */
export function Champ({ libelle, valeur, onChange, aide, erreur, className = "", ...reste }: Props) {
  const id = useId();
  return (
    <div className={`grid content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">{libelle}</label>
      <input
        id={id}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={aide || erreur ? `${id}-aide` : undefined}
        className="h-10 rounded-xl border border-ligne bg-white px-3 text-[15px] outline-none transition-colors focus:border-encre aria-invalid:border-rouge-texte"
        {...reste}
      />
      {(aide || erreur) && (
        <p id={`${id}-aide`} className={`text-[13px] ${erreur ? "font-semibold text-rouge-texte" : "text-gris"}`}>{erreur ?? aide}</p>
      )}
    </div>
  );
}
