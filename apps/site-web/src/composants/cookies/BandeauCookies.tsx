import type { KeyboardEvent, Ref } from "react";

import { PanneauChoixCookies } from "~/composants/cookies/PanneauChoixCookies";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_CONSENTEMENT_PAR_LANGUE } from "~/contenus/cookies-consentement";
import { TEXTES_PAGES_LEGALES_PAR_LANGUE } from "~/contenus/legal/liens-legaux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Le panneau « Choisir » est ouvert (à la place de la première couche) */
  panneauOuvert: boolean;
  /** Tout a déjà une réponse : la croix ferme sans rien changer (sinon, elle vaut refus) */
  gestion: boolean;
  /** Page où revenir après un envoi sans JavaScript */
  retour: string;
  /** Sans JavaScript : « Choisir » et « Tout savoir » mènent à la page /cookies (aperçu compris) */
  adresseReglages: string;
  adressePage: string;
  onChoisir: () => void;
  onEchap: () => void;
  refDialogue: Ref<HTMLDivElement>;
};

/** Les trois boutons de la première couche : même style, côte à côte même sur téléphone (le texte passe à la ligne) */
const classeBouton = [
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border-2 border-encre bg-jaune px-2 py-1.5 text-center",
  "text-sm leading-tight font-semibold text-encre shadow-brut-petit transition-[translate,box-shadow] duration-150 sm:px-[18px]",
  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut active:translate-x-0.5 active:translate-y-0.5",
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre",
].join(" ");

/** « a », « a et b », « a, b et c » */
function joindre(morceaux: string[], et: string): string {
  return morceaux.length <= 1 ? morceaux.join("") : `${morceaux.slice(0, -1).join(", ")}${et}${morceaux.at(-1)}`;
}

/**
 * Le bandeau des cookies : en bas de l'écran, non bloquant (dialogue non modal, la page reste utilisable), premier dans
 * la page pour le clavier et les lecteurs d'écran. Trois boutons de même poids (« Tout accepter », « Tout refuser »,
 * « Choisir ») et une croix qui vaut refus. C'est un vrai formulaire (POST /cookies/choix) : il marche sans JavaScript.
 */
export function BandeauCookies({ panneauOuvert, gestion, retour, adresseReglages, adressePage, onChoisir, onEchap, refDialogue }: Props) {
  const { apercu, aChoisir, actionFormulaire, envoyerFormulaire } = utiliserConsentement();
  const javascript = utiliserJavascriptActif();
  const T = utiliserTextes(TEXTES_CONSENTEMENT_PAR_LANGUE);
  const { gererCookies } = utiliserTextes(TEXTES_PAGES_LEGALES_PAR_LANGUE);
  const partenaires = new Set(aChoisir.flatMap((categorie) => categorie.partenaires.map((partenaire) => partenaire.nom))).size;
  const titreId = panneauOuvert ? "bandeau-cookies-titre-panneau" : "bandeau-cookies-titre";
  const texteId = panneauOuvert ? "bandeau-cookies-intro-panneau" : "bandeau-cookies-texte";

  function quandTouche(evenement: KeyboardEvent<HTMLDivElement>) {
    if (evenement.key !== "Escape") return;
    evenement.preventDefault();
    onEchap();
  }

  return (
    <div
      ref={refDialogue}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titreId}
      aria-describedby={texteId}
      onKeyDown={quandTouche}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 print:hidden"
    >
      <form
        method="post"
        action={actionFormulaire}
        onSubmit={envoyerFormulaire}
        className="pointer-events-auto relative mx-auto max-h-[85vh] max-w-3xl overflow-y-auto rounded-carte border-2 border-encre bg-white p-4 shadow-brut-grand sm:p-6"
      >
        <input type="hidden" name="retour" value={retour} />
        <button
          type="submit"
          name="geste"
          value="fermer"
          aria-label={gestion ? T.fermerSansChanger : T.fermerSansAccepter}
          title={gestion ? T.fermerSansChanger : T.fermerSansAccepter}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full border-2 border-encre bg-white text-xl leading-none
            font-bold hover:bg-creme focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          <span aria-hidden="true">×</span>
        </button>
        {apercu && (
          <p className="mr-10 mb-3 rounded-xl bg-rose-alerte px-3 py-1.5 text-[.8rem] font-semibold text-rouge-texte sm:text-sm">
            {lierPonctuation(T.apercu)}
          </p>
        )}
        {panneauOuvert ? (
          <PanneauChoixCookies prefixe="bandeau" Titre="h2" />
        ) : (
          <>
            <div className="flex items-start gap-4 pr-9">
              <Mascotte expression="clin" className="hidden size-16 shrink-0 sm:block" />
              <div>
                <h2 id={titreId} className="font-titre text-lg font-extrabold sm:text-xl">{lierPonctuation(T.titre)}</h2>
                <div id={texteId} className="mt-1.5 grid gap-1.5 text-sm leading-snug text-gris sm:text-[.95rem] sm:leading-normal">
                  <p>
                    {lierPonctuation(`${T.invitation(joindre(aChoisir.map((categorie) => categorie.pourBandeau), T.et), partenaires > 1)} ${T.sansAccord}`)}
                  </p>
                  <p className="text-[.8rem] sm:text-sm">
                    {lierPonctuation(`${T.changerDAvis(gererCookies)} ${T.portee}`)}{" "}
                    <a href={adressePage} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2">
                      {T.lienPage}
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5">
              <button type="submit" name="geste" value="tout-accepter" className={classeBouton}>{T.toutAccepter}</button>
              <button type="submit" name="geste" value="tout-refuser" className={classeBouton}>{T.toutRefuser}</button>
              {javascript ? (
                <button type="button" onClick={onChoisir} className={classeBouton}>{T.choisir}</button>
              ) : (
                <a href={adresseReglages} className={classeBouton}>{T.choisir}</a>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
