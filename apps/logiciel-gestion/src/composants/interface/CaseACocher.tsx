import type { ReactNode } from "react";

type Props = { libelle: ReactNode; coche: boolean; onChange: (coche: boolean) => void; aide?: ReactNode };

/** Case à cocher avec son libellé cliquable. */
export function CaseACocher({ libelle, coche, onChange, aide }: Props) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" checked={coche} onChange={(evenement) => onChange(evenement.target.checked)} className="mt-0.5 size-4 accent-encre" />
      <span>
        <span className="font-semibold">{libelle}</span>
        {aide && <span className="block text-[13px] text-gris">{aide}</span>}
      </span>
    </label>
  );
}
