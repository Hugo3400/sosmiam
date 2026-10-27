import { data, isRouteErrorResponse } from "react-router";

import type { Route } from "./+types/offre-carriere";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { DetailOffre } from "~/composants/carriere/DetailOffre";
import { FormulaireCandidature, type ReponseCandidature } from "~/composants/carriere/FormulaireCandidature";
import { MerciCandidature } from "~/composants/carriere/MerciCandidature";
import { OffreAbsente } from "~/composants/carriere/OffreAbsente";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import {
  LIMITE_ENVOI_CANDIDATURE,
  TEXTES_CANDIDATURE_PAR_LANGUE,
  TEXTES_CARRIERE_PAR_LANGUE,
  TEXTES_OFFRE_CARRIERE_PAR_LANGUE,
  type ChampCandidature,
} from "~/contenus/carriere";
import { site } from "~/contenus/legal/informations-legales";
import { lireFormulaireCandidature, type ValeursCandidature } from "~/fonctions/carriere/lire-formulaire-candidature";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerDonneesFilAriane } from "~/fonctions/seo/creer-donnees-fil-ariane";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { envoyerCandidature, estIdOffre, lireOffreCarriere } from "~/services/carriere.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

const ORDRE_CHAMPS: ChampCandidature[] = ["nom", "email", "message", "lien", "cv", "majeur"];

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!estIdOffre(params.id)) throw data(null, { status: 404 });
  const lecture = await lireOffreCarriere(params.id, lireIpVisiteur(request));
  if (lecture.ok) return { offre: lecture.offre };
  if (lecture.erreur === "offre-inconnue") throw data(null, { status: 404 });
  throw data("Offres momentanément indisponibles", { status: 503 });
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches?.flatMap((correspondance) => (correspondance ? [correspondance] : [])));
  const T = choisirTextes(TEXTES_OFFRE_CARRIERE_PAR_LANGUE, langue);
  if (!loaderData) return [{ title: T.introuvableMeta }, { name: "robots", content: "noindex" }];
  const { offre } = loaderData;
  const type = choisirTextes(TEXTES_CARRIERE_PAR_LANGUE, langue).types[offre.type]?.libelle ?? T.offre;
  const resume = offre.resume.trim() || T.resumeParDefaut(type, offre.lieu);
  return creerMeta({
    titre: `${offre.titre} (${type.toLowerCase()})`,
    description: resume.length > 155 ? `${resume.slice(0, 152).trimEnd()}…` : resume,
    langue,
  });
}

function repondreErreurs(
  erreurs: Partial<Record<ChampCandidature, string>>,
  valeurs: ValeursCandidature | undefined,
  cvARemettre: boolean,
  langue: Langue,
): ReponseCandidature {
  const { messages } = choisirTextes(TEXTES_CANDIDATURE_PAR_LANGUE, langue);
  const fautifs = ORDRE_CHAMPS.filter((champ) => erreurs[champ]);
  const message = fautifs.length === 1 ? messages.unChamp : messages.plusieursChamps(fautifs.length);
  return { ok: false, message, champ: fautifs[0], erreurs, valeurs, cvARemettre };
}

export async function action({ request, params }: Route.ActionArgs): Promise<ReponseCandidature> {
  if (!estIdOffre(params.id)) throw data(null, { status: 404 });
  const { langue } = lireLangueRequete(request);
  const { champs, messages } = choisirTextes(TEXTES_CANDIDATURE_PAR_LANGUE, langue);
  if (Number(request.headers.get("content-length")) > LIMITE_ENVOI_CANDIDATURE) {
    return repondreErreurs({ cv: lierPonctuation(champs.cv.erreurPoids) }, undefined, true, langue);
  }
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });

  const lecture = await lireFormulaireCandidature(formulaire, langue);
  if (!lecture.ok) return repondreErreurs(lecture.erreurs, lecture.valeurs, lecture.cvEnvoye, langue);

  const { candidature } = lecture;
  const resultat = await envoyerCandidature(params.id, candidature, lecture.piege, lireIpVisiteur(request));
  if (resultat.ok) return { ok: true, message: lierPonctuation(messages.merci) };
  if (resultat.erreur === "offre-inconnue" || resultat.erreur === "offre-fermee") throw data(null, { status: 404 });

  const valeurs = { nom: candidature.nom, email: candidature.email, message: candidature.message, lien: candidature.lien ?? "", majeur: true };
  const cvARemettre = candidature.cv !== null;
  const { cv } = champs;
  if (resultat.erreur === "cv-trop-lourd") return repondreErreurs({ cv: lierPonctuation(cv.erreurPoids) }, valeurs, cvARemettre, langue);
  if (resultat.erreur === "cv-format") return repondreErreurs({ cv: lierPonctuation(cv.erreurFormat) }, valeurs, cvARemettre, langue);
  if (resultat.erreur === "champ-invalide") {
    const champ = ORDRE_CHAMPS.find((un) => un === resultat.champ);
    if (champ) {
      const texte = champ === "cv" ? cv.erreurFormat : champs[champ].erreur;
      return repondreErreurs({ [champ]: lierPonctuation(texte) }, valeurs, cvARemettre, langue);
    }
    return { ok: false, message: lierPonctuation(messages.champInconnu), valeurs, cvARemettre };
  }
  const message = resultat.erreur === "trop-de-demandes" ? messages.tropDEnvois : messages.erreur;
  return { ok: false, message: lierPonctuation(message), valeurs, cvARemettre };
}

export default function PageOffreCarriere({ loaderData, actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_OFFRE_CARRIERE_PAR_LANGUE);
  const langue = utiliserLangue();
  const { offre } = loaderData;
  if (actionData?.ok) return <MerciCandidature offre={offre} message={actionData.message} />;
  const adresse = (chemin: string) => `https://${site.adresse}${ecrireCheminLangue(chemin, langue)}`;
  const filAriane = creerDonneesFilAriane([
    { nom: T.accueil, adresse: adresse("/") },
    { nom: T.onRecrute, adresse: adresse("/carriere") },
    { nom: offre.titre, adresse: adresse(`/carriere/${offre.id}`) },
  ]);
  return (
    <article className="bg-creme pb-16 md:pb-24">
      <DonneesStructurees donnees={filAriane} />
      <DetailOffre offre={offre} />
      <section id="candidater" aria-labelledby="candidater-titre" className="mx-auto mt-12 w-[min(860px,100%-32px)]">
        <h2 id="candidater-titre" className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold tracking-tight">{T.jeCandidate}</h2>
        <p className="mt-2 mb-6 text-gris">{lierPonctuation(T.candidaterChapo)}</p>
        <FormulaireCandidature />
      </section>
    </article>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <OffreAbsente cas={isRouteErrorResponse(error) && error.status === 404 ? "introuvable" : "indisponible"} />;
}
