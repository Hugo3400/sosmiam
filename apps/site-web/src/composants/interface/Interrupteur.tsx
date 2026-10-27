type Props = {
  id: string;
  /** Nom et valeur envoyés quand il est sur « Oui » (il marche aussi sans JavaScript, c'est une case à cocher) */
  nom: string;
  valeur: string;
  coche: boolean;
  /** Le libellé est ailleurs (titre d'une catégorie…) : son id, et celui de l'explication */
  libelleId: string;
  descriptionId?: string;
  oui: string;
  non: string;
};

/** Interrupteur Oui / Non : une case à cocher (rôle « switch »), dessinée en piste jaune avec son bouton encre. */
export function Interrupteur({ id, nom, valeur, coche, libelleId, descriptionId, oui, non }: Props) {
  return (
    <label htmlFor={id} className="inline-flex shrink-0 cursor-pointer items-center gap-2 font-semibold">
      <input
        id={id}
        type="checkbox"
        role="switch"
        name={nom}
        value={valeur}
        defaultChecked={coche}
        aria-labelledby={libelleId}
        aria-describedby={descriptionId}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 rounded-full border-2 border-encre bg-white transition-colors peer-checked:bg-jaune
          peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-encre
          after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-full after:bg-encre after:transition-transform
          peer-checked:after:translate-x-5"
      />
      <span aria-hidden="true" className="w-7 text-sm peer-checked:hidden">{non}</span>
      <span aria-hidden="true" className="hidden w-7 text-sm peer-checked:inline">{oui}</span>
    </label>
  );
}
