import type { AtoutPro } from "~/contenus/espace-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Une carte de /bienvenue (dans une liste) : ce que l'espace pro apporte, ou ce qui arrive « bientôt ». */
export function CarteAtoutPro({ atout, bientot = false }: { atout: AtoutPro; bientot?: boolean }) {
  return (
    <li
      className={`flex h-full flex-col rounded-carte border-2 border-encre p-5 ${bientot ? "border-dashed bg-creme" : "bg-white shadow-brut"}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className={`grid h-12 w-12 place-items-center rounded-full border-2 border-encre text-2xl ${bientot ? "bg-white" : "bg-jaune"}`}>
          {atout.emoji}
        </span>
        {bientot && <span className="rounded-full bg-encre px-3 py-1 text-sm font-bold text-jaune">Bientôt</span>}
      </span>
      <h3 className="mt-4 text-xl font-extrabold">{lierPonctuation(atout.titre)}</h3>
      <p className="mt-1 text-gris">{lierPonctuation(atout.texte)}</p>
    </li>
  );
}
