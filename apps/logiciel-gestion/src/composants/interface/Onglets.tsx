type Props<T extends string> = {
  libelle: string;
  valeur: T;
  options: { valeur: T; libelle: string; compteur?: number }[];
  onChange: (valeur: T) => void;
};

/** Choix entre quelques vues (« Jours / Semaines / Mois »), en pastilles. */
export function Onglets<T extends string>({ libelle, valeur, options, onChange }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={libelle} className="inline-flex flex-wrap gap-1 rounded-full border border-ligne bg-white p-1">
      {options.map((option) => {
        const choisi = option.valeur === valeur;
        return (
          <button
            key={option.valeur}
            type="button"
            role="radio"
            aria-checked={choisi}
            onClick={() => onChange(option.valeur)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${choisi ? "bg-nuit text-jaune" : "text-gris hover:bg-creme hover:text-encre"}`}
          >
            {option.libelle}
            {option.compteur !== undefined && option.compteur > 0 && (
              <span className={`chiffres rounded-full px-1.5 text-xs ${choisi ? "bg-jaune text-nuit" : "bg-ligne text-nuit"}`}>{option.compteur}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
