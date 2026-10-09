import { data, redirect } from "react-router";

import type { Route } from "./+types/fondateur";
import { EtatCandidature } from "~/composants/ambassadeur/EtatCandidature";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { ChoixCommuneFondateur } from "~/composants/fondateurs/ChoixCommuneFondateur";
import { TelechargerCarte } from "~/composants/fondateurs/TelechargerCarte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { ecrireNumeroFondateur } from "~/fonctions/fondateurs/ecrire-numero-fondateur";
import { lireCodeCommune } from "~/fonctions/fondateurs/lire-code-commune";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { changerCommuneCandidature, envoyerCandidature, lireCandidature } from "~/services/comptes.server";
import { resoudreRecherche } from "~/services/fondateurs.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { EnvieFondateur, ResultatRecherche } from "~/types/compte";

const ENVIES: EnvieFondateur[] = ["denicher", "fiches", "selections", "faire-savoir"];

const messages: Record<string, string> = {
  pepites: "Parle-nous de tes 3 pépites, en 20 à 1500 caractères.",
  envies: "Coche au moins une chose que tu aimerais faire.",
  reseaux: "Tes réseaux font 200 caractères au plus.",
  motivation: "Dis-nous pourquoi toi, en 20 à 600 caractères.",
  connuPar: "Cette réponse fait 120 caractères au plus.",
};

/** Refus de l'API qui ne visent pas un champ (formulaires « candidature » et « commune »). */
const messagesRefus: Partial<Record<string, string>> = {
  "candidature-existante": "Tu as déjà une candidature : pas besoin d'en envoyer une autre.",
  // Les places de la zone viennent d'être prises : la page revient avec « au complet » (FondateursAuComplet)
  "plus-de-place": "Toutes les places de ta ville viennent d'être prises. Elle rouvrira dès qu'une place se libère.",
  "champ-invalide": "Choisis ta commune dans la liste, puis réessaie.",
  "deja-traitee": "L'équipe a déjà répondu à ta candidature : sa commune ne peut plus changer.",
  "aucune-candidature": "On ne trouve pas ta candidature : recharge la page.",
  "trop-de-demandes": "Doucement ! Trop d'envois d'affilée : réessaie dans quelques minutes.",
};
const MESSAGE_PANNE = "Oups, ça n'est pas passé. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Devenir fondateur", description: "Candidate pour être l'un des fondateurs de ta ville." }), { name: "robots", content: "noindex" }];
}

/**
 * La candidature « fondateur » du compte, et la recherche de commune de l'adresse (?recherche=…, ?commune=CODE ;
 * ?changer=1 pour changer celle d'une candidature en attente), faite ici pour que tout marche sans JavaScript.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerAmbassadeurActif(request);
  const ip = lireIpVisiteur(request);
  const reponse = await lireCandidature(jeton, ip);
  if (!reponse.ok) {
    await redirigerSiSessionFermee(request, reponse.erreur);
    throw data("Candidature illisible", { status: 503 });
  }
  const { candidature } = reponse;
  const parametres = new URL(request.url).searchParams;
  const changer = parametres.get("changer") === "1";
  const enAttente = candidature?.statut === "en-attente";
  const mode: "candidater" | "preciser" | "changer" | null = !candidature || candidature.statut === "souvenir" ? "candidater"
    : enAttente && !candidature.commune ? "preciser"
      : enAttente && changer ? "changer"
        : null;
  const saisie = (parametres.get("recherche") ?? "").slice(0, 80);
  const resultat: ResultatRecherche = mode ? await resoudreRecherche(saisie, lireCodeCommune(parametres.get("commune")), ip) : { etat: "vide" };
  // Rien de cherché : le champ propose la ville écrite dans le compte
  const valeurChamp = saisie || (resultat.etat === "vide" ? (compte.ambassadeur?.ville ?? "") : "");
  return { candidature, mode, recherche: { saisie: valeurChamp, resultat }, communeChangee: parametres.get("commune-changee") === "1" };
}

/** Lit un texte du formulaire : retours à la ligne gardés en « \n » (sans JavaScript, ils arrivent en « \r\n »). */
function lireTexte(formulaire: FormData, champ: string): string {
  return String(formulaire.get(champ) ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
}

/** Envoie la candidature (mêmes règles que l'API), ou précise / change la commune d'une candidature en attente. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const ip = lireIpVisiteur(request);
  const communeCode = lireCodeCommune(formulaire.get("communeCode"));

  if (formulaire.get("formulaire") === "commune") {
    if (!communeCode) return { ok: false, formulaire: "commune", message: lierPonctuation(messagesRefus["champ-invalide"] ?? MESSAGE_PANNE) };
    const reponse = await changerCommuneCandidature(jeton, ip, communeCode);
    if (reponse.ok) throw redirect("/espace/fondateur?commune-changee=1");
    await redirigerSiSessionFermee(request, reponse.erreur);
    return { ok: false, formulaire: "commune", message: lierPonctuation(messagesRefus[reponse.erreur] ?? MESSAGE_PANNE) };
  }

  const nom = "candidature";
  const envies = formulaire.getAll("envies").map(String).filter((envie): envie is EnvieFondateur => ENVIES.includes(envie as EnvieFondateur));
  const valeurs = {
    pepites: lireTexte(formulaire, "pepites"),
    envies: envies.join(","),
    reseaux: lireTexte(formulaire, "reseaux"),
    motivation: lireTexte(formulaire, "motivation"),
    partantRencontre: formulaire.get("partantRencontre") === "oui" ? "oui" : "",
    connuPar: lireTexte(formulaire, "connuPar"),
  };
  if (!communeCode) return { ok: false, formulaire: nom, message: lierPonctuation("Choisis d'abord ta commune, juste au-dessus."), valeurs };

  const erreurs: Record<string, string> = {};
  if (valeurs.pepites.length < 20 || valeurs.pepites.length > 1500) erreurs.pepites = messages.pepites;
  if (envies.length === 0) erreurs.envies = messages.envies;
  if (valeurs.reseaux.length > 200) erreurs.reseaux = messages.reseaux;
  if (valeurs.motivation.length < 20 || valeurs.motivation.length > 600) erreurs.motivation = messages.motivation;
  if (valeurs.connuPar.length > 120) erreurs.connuPar = messages.connuPar;
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs, valeurs };

  const reponse = await envoyerCandidature(jeton, ip, {
    communeCode,
    pepites: valeurs.pepites,
    envies: [...new Set(envies)],
    ...(valeurs.reseaux ? { reseaux: valeurs.reseaux } : {}),
    motivation: valeurs.motivation,
    partantRencontre: valeurs.partantRencontre === "oui",
    ...(valeurs.connuPar ? { connuPar: valeurs.connuPar } : {}),
    piege: lireTexte(formulaire, "piege"),
  });
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "champ-invalide" && reponse.champ && messages[reponse.champ]) {
    return { ok: false, formulaire: nom, erreurs: { [reponse.champ]: messages[reponse.champ] }, valeurs };
  }
  return { ok: false, formulaire: nom, message: lierPonctuation(messagesRefus[reponse.erreur] ?? MESSAGE_PANNE), valeurs };
}

/**
 * Page /espace/fondateur : d'abord la commune (et les places de sa ville ou de son département), puis le formulaire ; ou
 * l'état de la candidature (commune à préciser, à l'étude, acceptée avec la carte à télécharger, souvenir, refusée).
 */
export default function PageFondateur({ loaderData, actionData }: Route.ComponentProps) {
  const { candidature, mode, recherche, communeChangee } = loaderData;
  const carte = candidature && (candidature.statut === "acceptee" || candidature.statut === "souvenir") && candidature.numeroLocal;
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation("Dans chaque ville, des ambassadeurs lancent l'aventure avec nous : plus ou moins de places selon la taille de la ville, et une place par département pour les plus petites communes.")}
      >
        Les fondateurs de ta ville
      </TitreSection>
      <div className="grid gap-8">
        {candidature && mode !== "preciser" && mode !== "changer" && (
          <EtatCandidature candidature={candidature} vientDArriver={actionData?.ok === true} communeChangee={communeChangee} />
        )}
        {carte && <TelechargerCarte numero={ecrireNumeroFondateur(candidature)} />}
        {mode && (
          <ChoixCommuneFondateur
            mode={mode}
            saisie={recherche.saisie}
            resultat={recherche.resultat}
            apresEnvoiPlein={actionData?.ok === false}
          />
        )}
      </div>
    </Section>
  );
}
