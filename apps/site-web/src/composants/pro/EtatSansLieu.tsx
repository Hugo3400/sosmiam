import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_TABLEAU_PRO_PAR_LANGUE } from "~/contenus/tableau-pro";
import { ecrireAdresseSitePrincipal } from "~/fonctions/hotes/ecrire-adresse-site-principal";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Le tableau sans aucun lieu : on donne envie de rattacher le sien (ou de l'inscrire s'il n'est pas sur SOS Miam). */
export function EtatSansLieu() {
  const T = utiliserTextes(TEXTES_TABLEAU_PRO_PAR_LANGUE).sansLieu;
  const langue = utiliserLangue();
  return (
    <div className="flex flex-col items-center rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
      <Mascotte expression="surprise" className="h-24 w-24" />
      <h2 className="mt-4 text-2xl font-extrabold">{lierPonctuation(T.titre)}</h2>
      <p className="mt-2 max-w-md text-gris">
        {lierPonctuation(T.texte)}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Bouton vers="/rattacher">{T.rattacher}</Bouton>
        <Bouton href={ecrireAdresseSitePrincipal("/inscrire-mon-lieu", langue)} variante="blanc">{T.pasSurSosMiam}</Bouton>
      </div>
    </div>
  );
}
