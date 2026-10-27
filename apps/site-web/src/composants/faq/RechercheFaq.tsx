import { TEXTES_PAGE_FAQ_PAR_LANGUE } from "~/contenus/faq/page-faq";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  valeur: string;
  onChange: (valeur: string) => void;
};

/** Champ de recherche de la FAQ. */
export function RechercheFaq({ valeur, onChange }: Props) {
  const T = utiliserTextes(TEXTES_PAGE_FAQ_PAR_LANGUE);
  return (
    <label className="mx-auto mb-5 flex max-w-[560px] items-center gap-2.5 rounded-full border-2 border-encre bg-white px-5 py-3
      shadow-brut-petit transition-shadow focus-within:shadow-[5px_5px_0_var(--color-encre)]
      focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-encre">
      <span aria-hidden="true">🔎</span>
      <span className="sr-only">{T.recherche.libelle}</span>
      <input
        type="search"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={T.recherche.exemple}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent font-medium outline-none"
      />
    </label>
  );
}
