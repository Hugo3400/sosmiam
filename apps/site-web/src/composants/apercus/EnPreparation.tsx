import { EN_PREPARATION } from "~/contenus/apercus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Sur fond jaune : pastille blanche */
  surJaune?: boolean;
  className?: string;
};

/** « En préparation : ça peut encore changer », en haut et en bas de chaque aperçu. */
export function EnPreparation({ surJaune = false, className = "" }: Props) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-2xl border-2 border-encre px-3.5 py-2 text-left text-[.9rem] font-bold shadow-brut-petit sm:rounded-full sm:px-4 sm:text-[.95rem] ${
        surJaune ? "bg-white" : "bg-jaune"
      } ${className}`}
    >
      <span aria-hidden="true">🚧</span>
      {lierPonctuation(EN_PREPARATION)}
    </p>
  );
}
