import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/proposer-un-lieu";
import { FormulairePropositionLieu } from "~/composants/ambassadeur/FormulairePropositionLieu";
import { ListePropositions } from "~/composants/ambassadeur/ListePropositions";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { champsLieu, typesDemandeLieu } from "~/contenus/demande-lieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { listerPropositions, proposerLieu } from "~/services/comptes.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const nom = "proposition";
/** Messages propres à l'ambassadeur (les autres viennent de contenus/demande-lieu.ts) */
const erreursPropres: Record<string, string> = { description: "Dis-nous pourquoi ce lieu, en 20 à 1000 caractères." };

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Proposer un lieu", description: "Propose un lieu indépendant à SOS Miam." }), { name: "robots", content: "noindex" }];
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
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const lire = (champ: string) => String(formulaire.get(champ) ?? "").replace(/[ \t]+/g, " ").trim();

  const valeurs: Record<string, string> = {};
  for (const c of champsLieu) valeurs[c.nom] = lire(c.nom);
  const type = lire("type");
  valeurs.type = typesDemandeLieu.some((t) => t.valeur === type) ? type : "";
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

  const reponse = await proposerLieu(jeton, lireIpVisiteur(request), Object.fromEntries(Object.entries(valeurs).filter(([, valeur]) => valeur !== "")));
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  const champ = champsLieu.find((c) => c.nom === reponse.champ);
  if (reponse.erreur === "champ-invalide" && champ) {
    return { ok: false, formulaire: nom, erreurs: { [champ.nom]: lierPonctuation(erreursPropres[champ.nom] ?? champ.erreur) }, valeurs };
  }
  const message = reponse.erreur === "trop-de-demandes"
    ? "Doucement ! Trop d'envois d'affilée : réessaie dans quelques minutes."
    : "Oups, ta proposition n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs };
}

/** Page /espace/proposer-un-lieu : une pépite à faire connaître ; la proposition arrive dans le logiciel de gestion. */
export default function PageProposerUnLieu({ loaderData, actionData }: Route.ComponentProps) {
  const titreMerci = useRef<HTMLHeadingElement>(null);
  const envoye = actionData?.ok === true;
  useEffect(() => {
    if (envoye) titreMerci.current?.focus();
  }, [envoye]);

  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation(`Un resto, une pâtisserie, un bar ou une sortie indépendant qui mérite plus de monde ? Raconte-le-nous. S'il rejoint SOS Miam, sa fiche affichera « Déniché par ${loaderData.prenom} ».`)}
      >
        Propose un lieu
      </TitreSection>
      {envoye ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreMerci} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("Merci, c'est envoyé !")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">{lierPonctuation("L'équipe lit chaque proposition. Tu suis son avancée juste en dessous.")}</p>
          {/* Un lien (et non un bouton) : revenir sur la page vide le formulaire et oublie la réponse */}
          <Bouton vers="/espace/proposer-un-lieu" variante="encre" className="mt-7">Proposer un autre lieu</Bouton>
        </div>
      ) : (
        <FormulairePropositionLieu />
      )}
      <p className="mt-4 text-center text-sm text-gris">
        {lierPonctuation("Rappel : un ambassadeur n'est jamais payé par un lieu qu'il met en avant.")}
      </p>

      <section aria-labelledby="mes-propositions" className="mt-12">
        <h2 id="mes-propositions" className="mb-4 text-2xl font-extrabold">Mes propositions</h2>
        <ListePropositions propositions={loaderData.propositions} />
      </section>
    </Section>
  );
}
