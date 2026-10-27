import { data, redirect } from "react-router";

import type { Route } from "./+types/fondateur";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { EtatCandidature } from "~/composants/ambassadeur/EtatCandidature";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { ChoixCommuneFondateur } from "~/composants/fondateurs/ChoixCommuneFondateur";
import { TelechargerCarte } from "~/composants/fondateurs/TelechargerCarte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE } from "~/contenus/candidature-fondateur";
import { ecrireNumeroFondateur } from "~/fonctions/fondateurs/ecrire-numero-fondateur";
import { lireCodeCommune } from "~/fonctions/fondateurs/lire-code-commune";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { changerCommuneCandidature, envoyerCandidature, lireCandidature } from "~/services/comptes.server";
import { resoudreRecherche } from "~/services/fondateurs.server";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { EnvieFondateur, ResultatRecherche } from "~/types/compte";

const ENVIES: EnvieFondateur[] = ["denicher", "fiches", "selections", "faire-savoir"];

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE, langue);
  return [...creerMeta({ ...T.meta, langue }), { name: "robots", content: "noindex" }];
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
  // Pas de candidature, un titre gardé en souvenir, ou une candidature non retenue : on peut (re)candidater tout de suite
  const mode: "candidater" | "preciser" | "changer" | null = !candidature || candidature.statut === "souvenir" || candidature.statut === "refusee" ? "candidater"
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
  const T = choisirTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE, lireLangueRequete(request).langue);
  const messages: Record<string, string> = T.messages;
  const messagesRefus: Partial<Record<string, string>> = T.refus;
  const messagePanne = T.panne;

  if (formulaire.get("formulaire") === "commune") {
    if (!communeCode) return { ok: false, formulaire: "commune", message: lierPonctuation(messagesRefus["champ-invalide"] ?? messagePanne) };
    const reponse = await changerCommuneCandidature(jeton, ip, communeCode);
    if (reponse.ok) throw redirect("/espace/fondateur?commune-changee=1");
    await redirigerSiSessionFermee(request, reponse.erreur);
    return { ok: false, formulaire: "commune", message: lierPonctuation(messagesRefus[reponse.erreur] ?? messagePanne) };
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
  if (!communeCode) return { ok: false, formulaire: nom, message: lierPonctuation(T.communeDAbord), valeurs };

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
  return { ok: false, formulaire: nom, message: lierPonctuation(messagesRefus[reponse.erreur] ?? messagePanne), valeurs };
}

/**
 * Page /espace/fondateur : d'abord la commune (et les places de sa ville ou de son département), puis le formulaire ; ou
 * l'état de la candidature (commune à préciser, à l'étude, acceptée avec la carte à télécharger, souvenir, refusée), suivi
 * du choix de commune quand on peut (re)candidater : après un souvenir ou un refus, tout de suite.
 */
export default function PageFondateur({ loaderData, actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE);
  const { candidature, mode, recherche, communeChangee } = loaderData;
  const carte = candidature && (candidature.statut === "acceptee" || candidature.statut === "souvenir") && candidature.numeroLocal;
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation(T.chapo)}
      >
        {T.titre}
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
