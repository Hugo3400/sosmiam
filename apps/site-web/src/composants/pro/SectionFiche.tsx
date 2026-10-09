import type { ReactNode } from "react";

type Props = {
  titre: string;
  /** Petite note sous le titre (« Passent par l'équipe SOS Miam ») */
  note?: ReactNode;
  children: ReactNode;
};

/** Une partie du formulaire « Ma fiche » : un groupe de champs avec son titre (fieldset et légende). */
export function SectionFiche({ titre, note, children }: Props) {
  return (
    <fieldset className="min-w-0 rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-7">
      <legend className="float-left w-full font-titre text-xl font-extrabold">{titre}</legend>
      {note && <div className="clear-both pt-1 text-sm text-gris">{note}</div>}
      <div className="clear-both grid gap-5 pt-4">{children}</div>
    </fieldset>
  );
}
