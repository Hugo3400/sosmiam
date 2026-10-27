import { BoutonCopier } from "~/composants/kit-media/BoutonCopier";
import { TEXTES_KIT_MEDIA_PAR_LANGUE } from "~/contenus/kit-media";
import { TEXTES_KIT_MEDIA_PRO_PAR_LANGUE } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  titre: string;
  /** L'objet du mail type, à copier à part */
  objet?: string;
  texte: string;
  conseils: readonly string[];
};

/**
 * Un texte du kit média pro (le mot du comptoir, le mail type) tel qu'il sera copié, sauts de ligne compris, avec son
 * bouton « Copier » (avec JavaScript seulement : sans, le texte reste là, à sélectionner) et ses conseils.
 */
export function TexteKitPro({ titre, objet, texte, conseils }: Props) {
  const T = utiliserTextes(TEXTES_KIT_MEDIA_PRO_PAR_LANGUE);
  const copier = utiliserTextes(TEXTES_KIT_MEDIA_PAR_LANGUE).copier;
  const pret = lierPonctuation(texte);
  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
      <h3 className="text-xl leading-tight font-extrabold">{lierPonctuation(titre)}</h3>
      {objet && (
        <div className="grid gap-2">
          <p className="rounded-xl bg-creme p-4 break-words"><span className="font-semibold">{T.objet}</span>{lierPonctuation(objet)}</p>
          <BoutonCopier texte={lierPonctuation(objet)} libelle={T.objetDuMail} />
        </div>
      )}
      <p className="rounded-xl bg-creme p-4 text-[.95rem] break-words whitespace-pre-line">{pret}</p>
      <BoutonCopier texte={pret} libelle={copier.leTexte(titre)} />
      <div>
        <h4 className="mb-2 font-extrabold">{T.conseils}</h4>
        <ul className="grid list-disc gap-1.5 pl-5 text-gris">
          {conseils.map((conseil) => <li key={conseil}>{lierPonctuation(conseil)}</li>)}
        </ul>
      </div>
    </li>
  );
}
