import type { ReactNode } from "react";

import { BoutonHautDePage } from "~/composants/legal/BoutonHautDePage";
import { ChapitreLegal } from "~/composants/legal/ChapitreLegal";
import { EnBrefLegal } from "~/composants/legal/EnBrefLegal";
import { EnTeteLegal } from "~/composants/legal/EnTeteLegal";
import { PagesLegalesLiees } from "~/composants/legal/PagesLegalesLiees";
import { SommaireLegal } from "~/composants/legal/SommaireLegal";
import type { DocumentLegal as Document } from "~/contenus/legal/type-legal";
import { regrouperEnChapitres } from "~/fonctions/legal/regrouper-en-chapitres";

type Props = {
  document: Document;
  /** Ce qui s'ajoute après le texte d'une section (par `id` de section) : un formulaire, un bouton… */
  complements?: Partial<Record<string, ReactNode>>;
};

/** Une page légale : titre et date, « En bref », « Au sommaire », chapitres numérotés, « À lire aussi », « Haut de page ». */
export function DocumentLegal({ document, complements }: Props) {
  const chapitres = regrouperEnChapitres(document);
  return (
    <article className="mx-auto w-[min(760px,100%-32px)] py-12 md:py-16">
      <EnTeteLegal titre={document.titre} miseAJour={document.miseAJour} introduction={document.introduction} />
      <EnBrefLegal blocs={document.enBref} />
      <SommaireLegal chapitres={chapitres} />
      {chapitres.map((chapitre) => <ChapitreLegal key={chapitre.id} chapitre={chapitre} complements={complements} />)}
      <PagesLegalesLiees />
      <BoutonHautDePage />
    </article>
  );
}
