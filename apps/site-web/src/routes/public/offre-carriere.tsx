import { data, isRouteErrorResponse } from "react-router";

import type { Route } from "./+types/offre-carriere";

import { DetailOffre } from "~/composants/carriere/DetailOffre";
import { FormulaireCandidature, type ReponseCandidature } from "~/composants/carriere/FormulaireCandidature";
import { MerciCandidature } from "~/composants/carriere/MerciCandidature";
import { OffreAbsente } from "~/composants/carriere/OffreAbsente";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { champsCandidature, LIMITE_ENVOI_CANDIDATURE, messagesCandidature, typesOffre, type ChampCandidature } from "~/contenus/carriere";
import { site } from "~/contenus/legal/informations-legales";
import { lireFormulaireCandidature, type ValeursCandidature } from "~/fonctions/carriere/lire-formulaire-candidature";
import { creerDonneesFilAriane } from "~/fonctions/seo/creer-donnees-fil-ariane";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { envoyerCandidature, estIdOffre, lireOffreCarriere } from "~/services/carriere.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

const ORDRE_CHAMPS: ChampCandidature[] = ["nom", "email", "message", "lien", "cv", "majeur"];

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!estIdOffre(params.id)) throw data(null, { status: 404 });
  const lecture = await lireOffreCarriere(params.id, lireIpVisiteur(request));
  if (lecture.ok) return { offre: lecture.offre };
  if (lecture.erreur === "offre-inconnue") throw data(null, { status: 404 });
  throw data("Offres momentanément indisponibles", { status: 503 });
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Offre introuvable — SOS Miam" }, { name: "robots", content: "noindex" }];
  const { offre } = loaderData;
  const type = typesOffre.find((t) => t.valeur === offre.type)?.libelle ?? "Offre";
  const resume = offre.resume.trim() || `${type} chez SOS Miam, ${offre.lieu}.`;
  return creerMeta({
    titre: `${offre.titre} (${type.toLowerCase()})`,
    description: resume.length > 155 ? `${resume.slice(0, 152).trimEnd()}…` : resume,
  });
}

function repondreErreurs(erreurs: Partial<Record<ChampCandidature, string>>, valeurs: ValeursCandidature | undefined, cvARemettre: boolean): ReponseCandidature {
  const fautifs = ORDRE_CHAMPS.filter((champ) => erreurs[champ]);
  const message = fautifs.length === 1 ? messagesCandidature.unChamp : messagesCandidature.plusieursChamps(fautifs.length);
  return { ok: false, message, champ: fautifs[0], erreurs, valeurs, cvARemettre };
}

export async function action({ request, params }: Route.ActionArgs): Promise<ReponseCandidature> {
  if (!estIdOffre(params.id)) throw data(null, { status: 404 });
  if (Number(request.headers.get("content-length")) > LIMITE_ENVOI_CANDIDATURE) {
    return repondreErreurs({ cv: lierPonctuation(champsCandidature.cv.erreurPoids) }, undefined, true);
  }
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });

  const lecture = await lireFormulaireCandidature(formulaire);
  if (!lecture.ok) return repondreErreurs(lecture.erreurs, lecture.valeurs, lecture.cvEnvoye);

  const { candidature } = lecture;
  const resultat = await envoyerCandidature(params.id, candidature, lecture.piege, lireIpVisiteur(request));
  if (resultat.ok) return { ok: true, message: lierPonctuation(messagesCandidature.merci) };
  if (resultat.erreur === "offre-inconnue" || resultat.erreur === "offre-fermee") throw data(null, { status: 404 });

  const valeurs = { nom: candidature.nom, email: candidature.email, message: candidature.message, lien: candidature.lien ?? "", majeur: true };
  const cvARemettre = candidature.cv !== null;
  const { cv } = champsCandidature;
  if (resultat.erreur === "cv-trop-lourd") return repondreErreurs({ cv: lierPonctuation(cv.erreurPoids) }, valeurs, cvARemettre);
  if (resultat.erreur === "cv-format") return repondreErreurs({ cv: lierPonctuation(cv.erreurFormat) }, valeurs, cvARemettre);
  if (resultat.erreur === "champ-invalide") {
    const champ = ORDRE_CHAMPS.find((un) => un === resultat.champ);
    if (champ) {
      const texte = champ === "cv" ? cv.erreurFormat : champsCandidature[champ].erreur;
      return repondreErreurs({ [champ]: lierPonctuation(texte) }, valeurs, cvARemettre);
    }
    return { ok: false, message: lierPonctuation(messagesCandidature.champInconnu), valeurs, cvARemettre };
  }
  const message = resultat.erreur === "trop-de-demandes" ? messagesCandidature.tropDEnvois : messagesCandidature.erreur;
  return { ok: false, message: lierPonctuation(message), valeurs, cvARemettre };
}

export default function PageOffreCarriere({ loaderData, actionData }: Route.ComponentProps) {
  const { offre } = loaderData;
  if (actionData?.ok) return <MerciCandidature offre={offre} message={actionData.message} />;
  const accueil = `https://${site.adresse}/`;
  const filAriane = creerDonneesFilAriane([
    { nom: "Accueil", adresse: accueil },
    { nom: "On recrute", adresse: `${accueil}carriere` },
    { nom: offre.titre, adresse: `${accueil}carriere/${offre.id}` },
  ]);
  return (
    <article className="bg-creme pb-16 md:pb-24">
      <DonneesStructurees donnees={filAriane} />
      <DetailOffre offre={offre} />
      <section id="candidater" aria-labelledby="candidater-titre" className="mx-auto mt-12 w-[min(860px,100%-32px)]">
        <h2 id="candidater-titre" className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold tracking-tight">Je candidate</h2>
        <p className="mt-2 mb-6 text-gris">{lierPonctuation("Pas besoin d'une lettre de motivation au cordeau : dis-nous simplement qui tu es et ce qui te donne envie.")}</p>
        <FormulaireCandidature />
      </section>
    </article>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <OffreAbsente cas={isRouteErrorResponse(error) && error.status === 404 ? "introuvable" : "indisponible"} />;
}
