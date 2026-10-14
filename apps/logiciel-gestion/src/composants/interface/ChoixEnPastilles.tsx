type Props<T extends string> = {
  libelle: string;
  valeur: T;
  options: { valeur: T; libelle: string; compteur?: number }[];
  onChange: (valeur: T) => void;
};

/**
 * Choix parmi beaucoup d'options (familles de l'Espace presse…) : des pastilles séparées qui passent à la ligne proprement,
 * là où les Onglets (une seule pilule) ne tiennent que quelques choix.
 */
export function ChoixEnPastilles<T extends string>({ libelle, valeur, options, onChange }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={libelle} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const choisi = option.valeur === valeur;
        return (
          <button
            key={option.valeur}
            type="button"
            role="radio"
            aria-checked={choisi}
            onClick={() => onChange(option.valeur)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${choisi ? "border-jaune bg-jaune text-nuit" : "border-ligne bg-white text-gris hover:text-encre"}`}
          >
            {option.libelle}
            {option.compteur !== undefined && option.compteur > 0 && (
              <span className={`chiffres rounded-full px-1.5 text-xs ${choisi ? "bg-jaune text-nuit" : "bg-ligne text-encre"}`}>{option.compteur}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
