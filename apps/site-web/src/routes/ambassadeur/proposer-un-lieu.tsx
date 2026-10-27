import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/proposer-un-lieu";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { FormulairePropositionLieu } from "~/composants/ambassadeur/FormulairePropositionLieu";
import { ListePropositions } from "~/composants/ambassadeur/ListePropositions";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { STRUCTURE_DEMANDE_LIEU, TEXTES_DEMANDE_LIEU_PAR_LANGUE } from "~/contenus/demande-lieu";
import { TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE } from "~/contenus/proposer-un-lieu";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { assemblerDemandeLieu } from "~/fonctions/lieux/assembler-demande-lieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { listerPropositions, proposerLieu } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const nom = "proposition";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE, langue);
  return [...creerMeta({ ...T.meta, langue }), { name: "robots", content: "noindex" }];
}

/** Ses propositions, avec leur statut. */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerAmbassadeurActif(request);
  const reponse = await listerPropositions(jeton, lireIpVisiteur(request));
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { prenom: compte.prenom, propositions: reponse.ok ? reponse.propositions : null };
}

/** Vérifie la proposition (mêmes règles que « J'inscris mon lieu », sans la partie contact) et l'envoie à l'API. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const { langue } = lireLangueRequete(request);
  const { messages } = choisirTextes(TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE, langue);
  const { champsLieu, types } = assemblerDemandeLieu(STRUCTURE_DEMANDE_LIEU, choisirTextes(TEXTES_DEMANDE_LIEU_PAR_LANGUE, langue));
  const erreursPropres: Record<string, string> = { description: messages.description };
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  // Retours à la ligne gardés, en « \n » : envoyé sans JavaScript, le formulaire les écrit « \r\n », qui compteraient
  // double face au maximum du champ
  const lire = (champ: string) => String(formulaire.get(champ) ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();

  const valeurs: Record<string, string> = {};
  for (const c of champsLieu) valeurs[c.nom] = lire(c.nom);
  const type = lire("type");
  valeurs.type = types.some((t) => t.valeur === type) ? type : "";
  // « monlieu.fr » devient « https://monlieu.fr » : l'API attend une adresse complète
  if (valeurs.siteWeb && !/^https?:\/\//i.test(valeurs.siteWeb)) valeurs.siteWeb = `https://${valeurs.siteWeb}`;

  const erreurs: Record<string, string> = {};
  for (const c of champsLieu) {
    const valeur = valeurs[c.nom];
    const invalide = (c.obligatoire && !valeur)
      || valeur.length > c.maximum
      || (c.nom === "description" && valeur.length < 20)
      || (c.nom === "siteWeb" && valeur !== "" && !/^https?:\/\/\S+$/.test(valeur));
    if (invalide) erreurs[c.nom] = lierPonctuation(erreursPropres[c.nom] ?? c.erreur);
  }
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs, valeurs };

  const lieu = Object.fromEntries(Object.entries(valeurs).filter(([, valeur]) => valeur !== ""));
  const reponse = await proposerLieu(jeton, lireIpVisiteur(request), { ...lieu, piege: lire("piege") });
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  const champ = champsLieu.find((c) => c.nom === reponse.champ);
  if (reponse.erreur === "champ-invalide" && champ) {
    return { ok: false, formulaire: nom, erreurs: { [champ.nom]: lierPonctuation(erreursPropres[champ.nom] ?? champ.erreur) }, valeurs };
  }
  const message = reponse.erreur === "trop-de-demandes" ? messages.tropDeDemandes : messages.panne;
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs };
}

/** Page /espace/proposer-un-lieu : une pépite à faire connaître ; la proposition arrive dans le logiciel de gestion. */
export default function PageProposerUnLieu({ loaderData, actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_PROPOSER_UN_LIEU_PAR_LANGUE);
  const titreMerci = useRef<HTMLHeadingElement>(null);
  const etaitEnvoye = useRef(false);
  const envoye = actionData?.ok === true;
  useEffect(() => {
    if (envoye) titreMerci.current?.focus();
    // « Proposer un autre lieu » : même adresse, donc utiliserFocusApresNavigation ne réagit pas, et le lien qui avait
    // le focus vient de disparaître. Le focus revient au titre de la page, comme après un changement de page.
    else if (etaitEnvoye.current) {
      const titre = document.querySelector<HTMLElement>("main h1");
      titre?.setAttribute("tabindex", "-1");
      titre?.focus();
    }
    etaitEnvoye.current = envoye;
  }, [envoye]);

  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation(T.chapo(loaderData.prenom))}
      >
        {T.titre}
      </TitreSection>
      {envoye ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreMerci} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.merci)}</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">{lierPonctuation(T.suivi)}</p>
          {/* Un lien (et non un bouton) : revenir sur la page vide le formulaire et oublie la réponse */}
          <Bouton vers="/espace/proposer-un-lieu" variante="encre" className="mt-7">{T.autre}</Bouton>
        </div>
      ) : (
        <FormulairePropositionLieu />
      )}
      <p className="mt-4 text-center text-sm text-gris">
        {lierPonctuation(T.rappel)}
      </p>

      <section aria-labelledby="mes-propositions" className="mt-12">
        <h2 id="mes-propositions" className="mb-4 text-2xl font-extrabold">{T.mesPropositions}</h2>
        <ListePropositions propositions={loaderData.propositions} />
      </section>
    </Section>
  );
}
