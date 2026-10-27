import type { ReactNode } from "react";

type Props = { libelle: ReactNode; coche: boolean; onChange: (coche: boolean) => void; aide?: ReactNode; desactive?: boolean };

/** Case à cocher avec son libellé cliquable. */
export function CaseACocher({ libelle, coche, onChange, aide, desactive }: Props) {
  return (
    <label className={`flex items-start gap-2.5 text-sm ${desactive ? "cursor-default" : "cursor-pointer"}`}>
      <input type="checkbox" checked={coche} disabled={desactive} onChange={(evenement) => onChange(evenement.target.checked)} className="mt-0.5 size-4 accent-encre disabled:opacity-60" />
      <span>
        <span className="font-semibold">{libelle}</span>
        {aide && <span className="block text-[13px] text-gris">{aide}</span>}
      </span>
    </label>
  );
}
