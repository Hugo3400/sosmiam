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
import { lireCodeCommune } from "~/fonctions/fondateurs/lire-code-commune";
import { resoudreRecherche } from "~/services/fondateurs.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

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
 * « Et dans ta ville ? » : la recherche de l'adresse (?ville=… tapée, ou ?commune=CODE choisie), faite ici pour que la
 * page marche sans JavaScript. La page reste la même pour Google : son adresse canonique est /programme, sans paramètres.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const parametres = new URL(request.url).searchParams;
  const saisie = (parametres.get("ville") ?? "").slice(0, 80);
  const resultat = await resoudreRecherche(saisie, lireCodeCommune(parametres.get("commune")), lireIpVisiteur(request));
  return { recherche: { saisie, resultat } };
}

/**
 * Page /programme (https://ambassadeur.sosmiam.fr, publique et indexée) : le programme Ambassadeurs expliqué simplement,
 * puis « Créer mon compte » ou « J'ai déjà un compte ». Textes : src/contenus/programme-ambassadeur.ts.
 */
export default function PageProgramme({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <HautProgramme />
      <GestesProgramme />
      <GainsProgramme />
      <NiveauxProgramme />
      <EtapesProgramme />
      <FondateursProgramme recherche={loaderData.recherche} />
      <QuestionsProgramme />
      <AppelProgramme />
    </>
  );
}
