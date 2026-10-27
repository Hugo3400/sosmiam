import type { Route } from "./+types/programme";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { AppelProgramme } from "~/composants/programme/AppelProgramme";
import { CertifieProgramme } from "~/composants/programme/CertifieProgramme";
import { EtapesProgramme } from "~/composants/programme/EtapesProgramme";
import { FondateursProgramme } from "~/composants/programme/FondateursProgramme";
import { GainsProgramme } from "~/composants/programme/GainsProgramme";
import { GestesProgramme } from "~/composants/programme/GestesProgramme";
import { HautProgramme } from "~/composants/programme/HautProgramme";
import { NiveauxProgramme } from "~/composants/programme/NiveauxProgramme";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { QuestionsProgramme } from "~/composants/programme/QuestionsProgramme";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerDonneesFaq } from "~/fonctions/seo/creer-donnees-faq";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireCodeCommune } from "~/fonctions/fondateurs/lire-code-commune";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { resoudreRecherche } from "~/services/fondateurs.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE, langue);
  return creerMeta({ ...T.meta, langue });
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
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE);
  const langue = utiliserLangue();
  const questions = Object.entries(T.questions.liste).map(([id, question]) => ({ id, ...question }));
  const donneesFaq = creerDonneesFaq([{ cle: "programme", emoji: "🎖️", titre: T.meta.titre, titreGroupe: T.meta.titre, questions }], langue);
  return (
    <>
      <DonneesStructurees donnees={donneesFaq} />
      <HautProgramme />
      <GestesProgramme />
      <GainsProgramme />
      <NiveauxProgramme />
      <EtapesProgramme />
      <FondateursProgramme recherche={loaderData.recherche} />
      <CertifieProgramme />
      <QuestionsProgramme />
      <AppelProgramme />
    </>
  );
}
