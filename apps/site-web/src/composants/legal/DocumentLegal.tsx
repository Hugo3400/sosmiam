import type { ReactNode } from "react";

import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";

import { BoutonHautDePage } from "~/composants/legal/BoutonHautDePage";
import { ChapitreLegal } from "~/composants/legal/ChapitreLegal";
import { EnBrefLegal } from "~/composants/legal/EnBrefLegal";
import { EnTeteLegal } from "~/composants/legal/EnTeteLegal";
import { PagesLegalesLiees } from "~/composants/legal/PagesLegalesLiees";
import { SommaireLegal } from "~/composants/legal/SommaireLegal";
import { MENTIONS_TRADUCTION_COURTOISIE } from "~/contenus/anglais/legal/cadre-legal";
import type { DocumentLegal as Document } from "~/contenus/legal/type-legal";
import { regrouperEnChapitres } from "~/fonctions/legal/regrouper-en-chapitres";
import { ContexteLangue, utiliserLangue, utiliserLanguesServies } from "~/hooks/utiliser-langue";

type Props = {
  document: Document;
  /** Ce qui s'ajoute après le texte d'une section (par `id` de section) : un formulaire, un bouton… */
  complements?: Partial<Record<string, ReactNode>>;
  langueDocument?: Langue;
  traductionContraignante?: boolean;
};

/** Une page légale : titre et date, « En bref », « Au sommaire », chapitres numérotés, « À lire aussi », « Haut de page ». */
export function DocumentLegal({ document, complements, langueDocument = "fr", traductionContraignante = false }: Props) {
  const chapitres = regrouperEnChapitres(document);
  const langue = utiliserLangue();
  const servies = utiliserLanguesServies();
  const article = (
    <article lang={langueDocument !== langue ? langueDocument : undefined} className="mx-auto w-[min(760px,100%-32px)] py-12 md:py-16">
      {langueDocument === "en" && (
        <p className="mb-8 rounded-xl border-2 border-encre bg-jaune-clair px-4 py-3 text-sm font-semibold">
          {MENTIONS_TRADUCTION_COURTOISIE.toutes}
          {traductionContraignante && ` ${MENTIONS_TRADUCTION_COURTOISIE.contraignante}`}
        </p>
      )}
      <EnTeteLegal titre={document.titre} miseAJour={document.miseAJour} introduction={document.introduction} />
      <EnBrefLegal blocs={document.enBref} />
      <SommaireLegal chapitres={chapitres} />
      {chapitres.map((chapitre) => <ChapitreLegal key={chapitre.id} chapitre={chapitre} complements={complements} />)}
      <PagesLegalesLiees />
      <BoutonHautDePage />
    </article>
  );
  return langueDocument === langue ? article : <ContexteLangue value={{ langue: langueDocument, servies }}>{article}</ContexteLangue>;
}
