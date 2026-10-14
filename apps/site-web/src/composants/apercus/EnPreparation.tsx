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
      className={`inline-flex items-center gap-2 rounded-full border-2 border-encre px-4 py-2 text-[.95rem] font-bold shadow-brut-petit ${
        surJaune ? "bg-white" : "bg-jaune"
      } ${className}`}
    >
      <span aria-hidden="true">🚧</span>
      {lierPonctuation(EN_PREPARATION)}
    </p>
  );
}
