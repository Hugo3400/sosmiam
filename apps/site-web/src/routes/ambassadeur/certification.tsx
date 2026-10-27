import { data } from "react-router";

import type { Route } from "./+types/certification";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { EtatCertification } from "~/composants/ambassadeur/EtatCertification";
import { FormulaireCertification } from "~/composants/ambassadeur/FormulaireCertification";
import { PresentationCertification } from "~/composants/ambassadeur/PresentationCertification";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { AIDE_MAX, STRUCTURE_MAX, TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE, type TEXTES_AMBASSADEUR_CERTIFIE } from "~/contenus/ambassadeur-certifie";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE, type TEXTES_RECHERCHE_COMMUNE } from "~/contenus/recherche-commune";
import { ecrireMessageRecherche } from "~/fonctions/fondateurs/ecrire-message-recherche";
import { lireCodeCommune } from "~/fonctions/fondateurs/lire-code-commune";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { simplifierRecherche } from "~/fonctions/texte/simplifier-recherche";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { envoyerCandidatureCertification, lireCertification } from "~/services/certification.server";
import { resoudreRecherche } from "~/services/fondateurs.server";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { CommuneFondateurs, EnvieCertification, ProfilCertifie } from "~/types/compte";

const PROFILS: ProfilCertifie[] = ["ambassadeur", "pro", "structure"];
const ENVIES: EnvieCertification[] = ["fiche", "photos", "presenter", "big-sos"];

type TextesCertifie = Traduction<typeof TEXTES_AMBASSADEUR_CERTIFIE>;

/** Messages des champs, dans l'ordre du formulaire (« communeCode » de l'API s'affiche sous « Ta ville ») */
function listerMessages(T: TextesCertifie): Record<string, string> {
  return {
    profil: T.messages.profil,
    structure: T.messages.structure(STRUCTURE_MAX),
    ville: T.messages.ville,
    aide: T.messages.aide(AIDE_MAX),
    envies: T.messages.envies,
    engagementGratuit: T.messages.engagementGratuit,
  };
}
const champsApi: Record<string, string> = { communeCode: "ville" };

/** Réponse de l'action : celle d'un formulaire de l'espace, avec les communes où choisir quand « Ta ville » en désigne plusieurs */
type ReponseCertification = ReponseFormulaire & { communes?: CommuneFondateurs[] };

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE, langue);
  return [...creerMeta({ ...T.meta, langue }), { name: "robots", content: "noindex" }];
}

export function headers(_: Route.HeadersArgs) {
  return { "Cache-Control": "private, no-store" };
}

/** Le titre (depuis le compte, sinon depuis l'API) et la dernière candidature. Ambassadeurs validés seulement. */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton } = await exigerAmbassadeurActif(request);
  const reponse = await lireCertification(jeton, lireIpVisiteur(request));
  if (!reponse.ok) {
    await redirigerSiSessionFermee(request, reponse.erreur);
    throw data("Candidature illisible", { status: 503 });
  }
  return { certifie: reponse.certifie, candidature: reponse.candidature };
}

/** Lit un texte du formulaire : retours à la ligne gardés en « \n » (sans JavaScript, ils arrivent en « \r\n »). */
function lireTexte(formulaire: FormData, champ: string): string {
  return String(formulaire.get(champ) ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
}

type CommuneTrouvee = { commune: CommuneFondateurs } | { communes: CommuneFondateurs[] } | { erreur: string };

/**
 * La commune de « Ta ville » : le code choisi (suggestion ou bouton radio), s'il a été choisi pour ce texte-là ; sinon,
 * le texte tapé est cherché comme sur /espace/fondateur (une seule commune, ou une seule qui porte ce nom ou ce code postal).
 */
async function trouverCommune(formulaire: FormData, ville: string, ip: string | null, T: TextesCertifie, textesRecherche: Traduction<typeof TEXTES_RECHERCHE_COMMUNE>): Promise<CommuneTrouvee> {
  const code = lireCodeCommune(formulaire.get("communeCode"));
  const choisiPourCeTexte = code && simplifierRecherche(lireTexte(formulaire, "communeTexte")) === simplifierRecherche(ville);
  const resultat = await resoudreRecherche(ville, choisiPourCeTexte ? code : null, ip);
  if (resultat.etat === "zone") return { commune: resultat.commune };
  if (resultat.etat === "choix") return { communes: resultat.communes };
  if (resultat.etat === "message") return { erreur: ecrireMessageRecherche(resultat, textesRecherche) };
  return { erreur: T.messages.ville };
}

/** Envoie la candidature (mêmes règles que l'API), après avoir trouvé la commune de « Ta ville ». */
export async function action({ request }: Route.ActionArgs): Promise<ReponseCertification> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const ip = lireIpVisiteur(request);
  const nom = "certification";
  const { langue } = lireLangueRequete(request);
  const T = choisirTextes(TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE, langue);
  const messages = listerMessages(T);

  const profil = PROFILS.find((p) => p === formulaire.get("profil"));
  const envies = ENVIES.filter((envie) => formulaire.getAll("envies").map(String).includes(envie));
  const valeurs: Record<string, string> = {
    profil: profil ?? "",
    structure: lireTexte(formulaire, "structure"),
    ville: lireTexte(formulaire, "ville").slice(0, 80),
    aide: lireTexte(formulaire, "aide"),
    envies: envies.join(","),
    engagementGratuit: formulaire.get("engagementGratuit") === "oui" ? "oui" : "",
  };

  const erreurs: Record<string, string> = {};
  if (!profil) erreurs.profil = messages.profil;
  if (valeurs.structure.length > STRUCTURE_MAX) erreurs.structure = messages.structure;
  const trouvee: CommuneTrouvee = valeurs.ville
    ? await trouverCommune(formulaire, valeurs.ville, ip, T, choisirTextes(TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE, langue))
    : { erreur: messages.ville };
  let communes: CommuneFondateurs[] | undefined;
  if ("commune" in trouvee) {
    Object.assign(valeurs, {
      communeCode: trouvee.commune.code, communeTexte: valeurs.ville, communeDecrite: `${trouvee.commune.nom} (${trouvee.commune.nomDepartement})`,
    });
  } else if ("communes" in trouvee) {
    communes = trouvee.communes;
    erreurs.ville = T.messages.plusieursCommunes;
  } else {
    erreurs.ville = trouvee.erreur;
  }
  if (valeurs.aide.length < 1 || valeurs.aide.length > AIDE_MAX) erreurs.aide = messages.aide;
  if (envies.length === 0) erreurs.envies = messages.envies;
  if (!valeurs.engagementGratuit) erreurs.engagementGratuit = messages.engagementGratuit;
  if (Object.keys(erreurs).length > 0 || !profil || !valeurs.communeCode) return { ok: false, formulaire: nom, erreurs, valeurs, communes };

  const reponse = await envoyerCandidatureCertification(jeton, ip, {
    profil,
    ...(valeurs.structure ? { structure: valeurs.structure } : {}),
    communeCode: valeurs.communeCode,
    aide: valeurs.aide,
    envies,
    engagementGratuit: true,
    piege: lireTexte(formulaire, "piege"),
  });
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  const champ = reponse.champ ? (champsApi[reponse.champ] ?? reponse.champ) : null;
  if (reponse.erreur === "champ-invalide" && champ && messages[champ]) {
    return { ok: false, formulaire: nom, erreurs: { [champ]: messages[champ] }, valeurs };
  }
  const refus: Partial<Record<string, string>> = T.refus;
  return { ok: false, formulaire: nom, message: lierPonctuation(refus[reponse.erreur] ?? T.panne), valeurs };
}

/**
 * Page /espace/certification : l'état (certifié, à l'étude, non retenu, titre retiré), puis, si l'on peut candidater, la
 * présentation et le formulaire.
 */
export default function PageCertification({ loaderData, actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE);
  const programme = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).certifie;
  const { certifie, candidature } = loaderData;
  const peutCandidater = !certifie && candidature?.statut !== "en-attente";
  const reponse = actionData?.formulaire === "certification" ? actionData : undefined;
  const cleCommune = reponse ? `${reponse.valeurs?.communeCode ?? ""}|${reponse.communes?.map((c) => c.code).join(",") ?? ""}|${reponse.valeurs?.ville ?? ""}` : "depart";
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(programme.chapo)}>
        {programme.titre}
      </TitreSection>
      <div className="grid gap-8">
        <EtatCertification certifie={certifie} candidature={candidature} vientDArriver={reponse?.ok === true} />
        {peutCandidater && (
          <>
            <PresentationCertification />
            <div>
              <h2 className="mb-4 text-2xl font-extrabold">{T.formulaire.titre}</h2>
              <FormulaireCertification choixCommunes={reponse?.communes ?? null} cleCommune={cleCommune} />
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
