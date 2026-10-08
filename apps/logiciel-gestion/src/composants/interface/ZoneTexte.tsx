import { useId, type ReactNode } from "react";

type Props = {
  libelle: ReactNode;
  valeur: string;
  onChange: (valeur: string) => void;
  lignes?: number;
  maximum?: number;
  aide?: ReactNode;
  placeholder?: string;
  className?: string;
  police?: "texte" | "code";
};

/** Zone de texte sur plusieurs lignes, avec un compteur quand il y a un maximum. */
export function ZoneTexte({ libelle, valeur, onChange, lignes = 4, maximum, aide, placeholder, className = "", police = "texte" }: Props) {
  const id = useId();
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">{libelle}</label>
        {maximum && <span className={`chiffres text-xs ${valeur.length > maximum ? "font-bold text-rouge-texte" : "text-gris"}`}>{valeur.length} / {maximum}</span>}
      </div>
      <textarea
        id={id}
        rows={lignes}
        value={valeur}
        placeholder={placeholder}
        onChange={(evenement) => onChange(evenement.target.value)}
        className={`resize-y rounded-xl border border-ligne bg-white px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-encre ${police === "code" ? "font-mono text-[13px]" : ""}`}
      />
      {aide && <p className="text-[13px] text-gris">{aide}</p>}
    </div>
  );
}
