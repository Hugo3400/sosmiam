import { data } from "react-router";

import type { Route } from "./+types/fondateur";
import { EtatCandidature } from "~/composants/ambassadeur/EtatCandidature";
import { FormulaireCandidature } from "~/composants/ambassadeur/FormulaireCandidature";
import { PresentationFondateurs } from "~/composants/ambassadeur/PresentationFondateurs";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { envoyerCandidature, lireCandidature } from "~/services/comptes.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { EnvieFondateur } from "~/types/compte";

const nom = "candidature";
const ENVIES: EnvieFondateur[] = ["denicher", "fiches", "selections", "faire-savoir"];

const messages: Record<string, string> = {
  pepites: "Parle-nous de tes 3 pépites, en 20 à 1500 caractères.",
  envies: "Coche au moins une chose que tu aimerais faire.",
  reseaux: "Tes réseaux font 200 caractères au plus.",
  motivation: "Dis-nous pourquoi toi, en 20 à 600 caractères.",
  partantRencontre: "Réponds oui ou non.",
  connuPar: "Cette réponse fait 120 caractères au plus.",
};

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Devenir fondateur", description: "Candidate pour être l'un des 10 ambassadeurs fondateurs de SOS Miam." }), { name: "robots", content: "noindex" }];
}

/** La candidature « fondateur » du compte, s'il y en a une. */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton } = await exigerAmbassadeurActif(request);
  const reponse = await lireCandidature(jeton, lireIpVisiteur(request));
  if (!reponse.ok) {
    await redirigerSiSessionFermee(request, reponse.erreur);
    throw data("Candidature illisible", { status: 503 });
  }
  return { candidature: reponse.candidature };
}

/** Vérifie la candidature (mêmes règles que l'API) et l'envoie. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  // Les retours à la ligne sont gardés dans les textes longs
  const lire = (champ: string) => String(formulaire.get(champ) ?? "").replace(/[ \t]+/g, " ").trim();
  const envies = formulaire.getAll("envies").map(String).filter((envie): envie is EnvieFondateur => ENVIES.includes(envie as EnvieFondateur));
  const valeurs = {
    pepites: lire("pepites"),
    envies: envies.join(","),
    reseaux: lire("reseaux"),
    motivation: lire("motivation"),
    partantRencontre: lire("partantRencontre"),
    connuPar: lire("connuPar"),
  };

  const erreurs: Record<string, string> = {};
  if (valeurs.pepites.length < 20 || valeurs.pepites.length > 1500) erreurs.pepites = messages.pepites;
  if (envies.length === 0) erreurs.envies = messages.envies;
  if (valeurs.reseaux.length > 200) erreurs.reseaux = messages.reseaux;
  if (valeurs.motivation.length < 20 || valeurs.motivation.length > 600) erreurs.motivation = messages.motivation;
  if (valeurs.partantRencontre !== "oui" && valeurs.partantRencontre !== "non") erreurs.partantRencontre = messages.partantRencontre;
  if (valeurs.connuPar.length > 120) erreurs.connuPar = messages.connuPar;
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs, valeurs };

  const reponse = await envoyerCandidature(jeton, lireIpVisiteur(request), {
    pepites: valeurs.pepites,
    envies: [...new Set(envies)],
    ...(valeurs.reseaux ? { reseaux: valeurs.reseaux } : {}),
    motivation: valeurs.motivation,
    partantRencontre: valeurs.partantRencontre === "oui",
    ...(valeurs.connuPar ? { connuPar: valeurs.connuPar } : {}),
    piege: lire("piege"),
  });
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "champ-invalide" && reponse.champ && messages[reponse.champ]) {
    return { ok: false, formulaire: nom, erreurs: { [reponse.champ]: messages[reponse.champ] }, valeurs };
  }
  const message = reponse.erreur === "candidature-existante"
    ? "Tu as déjà une candidature : pas besoin d'en envoyer une autre."
    : reponse.erreur === "trop-de-demandes"
      ? "Doucement ! Trop d'envois d'affilée : réessaie dans quelques minutes."
      : "Oups, ta candidature n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs };
}

/** Page /espace/fondateur : les 10 fondateurs et le formulaire, ou bien l'état de la candidature. */
export default function PageFondateur({ loaderData, actionData }: Route.ComponentProps) {
  const { candidature } = loaderData;
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation(`On lance SOS Miam avec 10 ambassadeurs fondateurs.${candidature ? "" : " Et si tu en faisais partie ?"}`)}
      >
        Ambassadeurs fondateurs
      </TitreSection>
      {candidature ? (
        <EtatCandidature candidature={candidature} vientDArriver={actionData?.ok === true} />
      ) : (
        <div className="grid gap-8">
          <PresentationFondateurs />
          <div>
            <h2 className="mb-4 text-2xl font-extrabold">Ta candidature</h2>
            <FormulaireCandidature />
          </div>
        </div>
      )}
    </Section>
  );
}
