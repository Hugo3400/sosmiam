import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function ActusIndisponibles({ reessayer, principal = false }: { reessayer: string; principal?: boolean }) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).indisponible;
  const Titre = principal ? "h1" : "h2";
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-carte border-2 border-dashed border-encre bg-white px-5 py-10 text-center">
      <p aria-hidden="true" className="text-5xl">🛟</p>
      <Titre className="text-2xl font-extrabold">{lierPonctuation(T.titre)}</Titre>
      <p className="max-w-md text-gris">{lierPonctuation(T.texte)}</p>
      <Bouton href={reessayer} petit className="mt-2">{T.reessayer}</Bouton>
    </div>
  );
}
