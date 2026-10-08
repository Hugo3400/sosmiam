import { BoutonCopier } from "~/composants/kit-media/BoutonCopier";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Un texte prêt à poster du kit média, tel qu'il sera copié (sauts de ligne compris), avec son bouton « Copier ». */
export function TexteAPoster({ titre, texte }: { titre: string; texte: string }) {
  const pret = lierPonctuation(texte);
  return (
    <li className="flex flex-col gap-4 rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
      <h3 className="text-lg leading-tight font-extrabold">{lierPonctuation(titre)}</h3>
      <p className="flex-1 rounded-xl bg-creme p-4 text-[.95rem] break-words whitespace-pre-line">{pret}</p>
      <BoutonCopier texte={pret} libelle={`le texte « ${titre} »`} />
    </li>
  );
}
