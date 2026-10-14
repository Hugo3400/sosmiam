import type { KeyboardEvent, Ref } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { PanneauChoixCookies } from "~/composants/cookies/PanneauChoixCookies";
import { Mascotte } from "~/composants/marque/Mascotte";
import { textesConsentement } from "~/contenus/cookies-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";

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

/** « a », « a et b », « a, b et c » */
function joindre(morceaux: string[]): string {
  return morceaux.length <= 1 ? morceaux.join("") : `${morceaux.slice(0, -1).join(", ")} et ${morceaux.at(-1)}`;
}

/**
 * Le bandeau des cookies : en bas de l'écran, non bloquant (dialogue non modal, la page reste utilisable), premier dans
 * la page pour le clavier et les lecteurs d'écran. Trois boutons de même poids (« Tout accepter », « Tout refuser »,
 * « Choisir ») et une croix qui vaut refus. C'est un vrai formulaire (POST /cookies/choix) : il marche sans JavaScript.
 */
export function BandeauCookies({ panneauOuvert, gestion, retour, adresseReglages, adressePage, onChoisir, onEchap, refDialogue }: Props) {
  const { apercu, aChoisir, actionFormulaire, envoyerFormulaire } = utiliserConsentement();
  const javascript = utiliserJavascriptActif();
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
        className="pointer-events-auto relative mx-auto max-h-[85vh] max-w-3xl overflow-y-auto rounded-carte border-2 border-encre bg-white p-5 shadow-brut-grand sm:p-6"
      >
        <input type="hidden" name="retour" value={retour} />
        <button
          type="submit"
          name="geste"
          value="fermer"
          aria-label={gestion ? textesConsentement.fermerSansChanger : textesConsentement.fermerSansAccepter}
          title={gestion ? textesConsentement.fermerSansChanger : textesConsentement.fermerSansAccepter}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full border-2 border-encre bg-white text-xl leading-none
            font-bold hover:bg-creme focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          <span aria-hidden="true">×</span>
        </button>
        {apercu && (
          <p className="mb-3 mr-10 rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">
            {lierPonctuation(textesConsentement.apercu)}
          </p>
        )}
        {panneauOuvert ? (
          <PanneauChoixCookies prefixe="bandeau" Titre="h2" />
        ) : (
          <>
            <div className="flex items-start gap-4 pr-10">
              <Mascotte expression="clin" className="hidden size-16 shrink-0 sm:block" />
              <div>
                <h2 id={titreId} className="font-titre text-xl font-extrabold">{lierPonctuation(textesConsentement.titre)}</h2>
                <div id={texteId} className="mt-2 grid gap-1.5 text-[.95rem] text-gris">
                  <p>
                    {lierPonctuation(
                      `Pour ${joindre(aChoisir.map((categorie) => categorie.pourBandeau))}, ${partenaires > 1 ? "des partenaires aimeraient" : "un partenaire aimerait"} poser des cookies dans ton navigateur. ${textesConsentement.sansAccord}`,
                    )}
                  </p>
                  <p className="text-sm">
                    {lierPonctuation(`${textesConsentement.changerDAvis} ${textesConsentement.portee}`)}{" "}
                    <a href={adressePage} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2">
                      {textesConsentement.lienPage}
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <Bouton type="submit" name="geste" value="tout-accepter" petit className="w-full">{textesConsentement.toutAccepter}</Bouton>
              <Bouton type="submit" name="geste" value="tout-refuser" petit className="w-full">{textesConsentement.toutRefuser}</Bouton>
              {javascript ? (
                <Bouton onClick={onChoisir} petit className="w-full">{textesConsentement.choisir}</Bouton>
              ) : (
                <Bouton href={adresseReglages} petit className="w-full">{textesConsentement.choisir}</Bouton>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
