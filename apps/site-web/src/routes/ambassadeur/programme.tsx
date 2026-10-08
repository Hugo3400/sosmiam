import type { Route } from "./+types/programme";

import { AppelProgramme } from "~/composants/programme/AppelProgramme";
import { EtapesProgramme } from "~/composants/programme/EtapesProgramme";
import { FondateursProgramme } from "~/composants/programme/FondateursProgramme";
import { GainsProgramme } from "~/composants/programme/GainsProgramme";
import { GestesProgramme } from "~/composants/programme/GestesProgramme";
import { HautProgramme } from "~/composants/programme/HautProgramme";
import { NiveauxProgramme } from "~/composants/programme/NiveauxProgramme";
import { QuestionsProgramme } from "~/composants/programme/QuestionsProgramme";
import { descriptionProgramme, questionsProgramme } from "~/contenus/programme-ambassadeur";
import { creerDonneesFaq } from "~/fonctions/seo/creer-donnees-faq";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Programme Ambassadeurs", description: descriptionProgramme }),
    {
      "script:ld+json": creerDonneesFaq([
        { cle: "programme", emoji: "🎖️", titre: "Programme Ambassadeurs", titreGroupe: "Programme Ambassadeurs", questions: questionsProgramme },
      ]),
    },
  ];
}

/**
 * Page /programme (https://ambassadeur.sosmiam.fr, publique et indexée) : le programme Ambassadeurs expliqué simplement,
 * puis « Créer mon compte » ou « J'ai déjà un compte ». Textes : src/contenus/programme-ambassadeur.ts.
 */
export default function PageProgramme() {
  return (
    <>
      <HautProgramme />
      <GestesProgramme />
      <GainsProgramme />
      <NiveauxProgramme />
      <EtapesProgramme />
      <FondateursProgramme />
      <QuestionsProgramme />
      <AppelProgramme />
    </>
  );
}
