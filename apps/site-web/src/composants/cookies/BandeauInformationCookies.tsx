import type { KeyboardEvent, Ref } from "react";

import { Mascotte } from "~/composants/marque/Mascotte";
import { GESTE_INFORMATION_COOKIES, TEXTES_CONSENTEMENT_PAR_LANGUE } from "~/contenus/cookies-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  retour: string;
  adressePage: string;
  onEchap: () => void;
  refDialogue: Ref<HTMLDivElement>;
};

const CLASSE_BOUTON = [
  "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-encre bg-jaune px-5 py-1.5 text-sm font-semibold",
  "text-encre shadow-brut-petit transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut",
  "active:translate-x-0.5 active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre",
].join(" ");

export function BandeauInformationCookies({ retour, adressePage, onEchap, refDialogue }: Props) {
  const { actionFormulaire, envoyerFormulaire } = utiliserConsentement();
  const T = utiliserTextes(TEXTES_CONSENTEMENT_PAR_LANGUE);

  function quandTouche(evenement: KeyboardEvent<HTMLDivElement>) {
    if (evenement.key !== "Escape") return;
    evenement.preventDefault();
    onEchap();
  }

  return (
    <div
      ref={refDialogue}
      role="region"
      aria-labelledby="bandeau-information-cookies-titre"
      onKeyDown={quandTouche}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 print:hidden"
    >
      <form
        method="post"
        action={actionFormulaire}
        onSubmit={envoyerFormulaire}
        className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3 rounded-carte border-2 border-encre bg-white p-4 shadow-brut-grand sm:flex-row sm:items-center sm:gap-5 sm:p-5"
      >
        <input type="hidden" name="retour" value={retour} />
        <div className="flex items-start gap-4">
          <Mascotte expression="clin" className="hidden size-14 shrink-0 sm:block" />
          <div>
            <h2 id="bandeau-information-cookies-titre" className="font-titre text-lg font-extrabold">
              {lierPonctuation(T.information.titre)}
            </h2>
            <p className="mt-1 text-sm leading-snug text-gris">
              {lierPonctuation(T.information.texte)}{" "}
              <a href={adressePage} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2">
                {T.lienPage}
              </a>
            </p>
          </div>
        </div>
        <button type="submit" name="geste" value={GESTE_INFORMATION_COOKIES} className={`${CLASSE_BOUTON} shrink-0`}>
          {T.information.compris}
        </button>
      </form>
    </div>
  );
}
