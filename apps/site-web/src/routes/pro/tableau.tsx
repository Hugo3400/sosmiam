import { data, useActionData } from "react-router";

import type { Route } from "./+types/tableau";
import { BandeauVerificationEmail, FORMULAIRE_RENVOI } from "~/composants/compte/BandeauVerificationEmail";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { Section } from "~/composants/mise-en-page/Section";
import { FORMULAIRE_RATTACHEMENT } from "~/composants/pro/BoutonRattachement";
import { CarteInvitation } from "~/composants/pro/CarteInvitation";
import { CarteLieuPro } from "~/composants/pro/CarteLieuPro";
import { EtatSansLieu } from "~/composants/pro/EtatSansLieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { accepterInvitation, listerRattachements, retirerRattachement } from "~/services/pro.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import { traiterRenvoiVerification } from "~/services/verification-email.server";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mon tableau pro", description: "Tes lieux sur SOS Miam." }), { name: "robots", content: "noindex" }];
}

/**
 * Les demandes du compte (vérifiées, en attente, refusées) et les invitations reçues à rejoindre une équipe (null : la
 * liste n'a pas pu être lue) ; ?rattachement=envoye : une demande vient de partir ; ?inscription=1 : compte tout neuf.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerCompte(request);
  const reponse = await listerRattachements(jeton, lireIpVisiteur(request));
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  const tous = reponse.ok ? reponse.rattachements : null;
  const estInvitation = (rattachement: { role: string; statut: string }) => rattachement.role === "equipe" && rattachement.statut === "en-attente";
  const parametres = new URL(request.url).searchParams;
  return {
    prenom: compte.prenom,
    email: { verifie: compte.emailVerifie !== false, justeInscrit: parametres.get("inscription") === "1" },
    demandeEnvoyee: parametres.get("rattachement") === "envoye",
    invitations: tous?.filter(estInvitation) ?? [],
    lieux: tous?.filter((rattachement) => !estInvitation(rattachement)) ?? null,
  };
}

/** Ce que dit la page après un geste réussi. */
const reussites = {
  accepter: "Bienvenue dans l'équipe ! La fiche du lieu est dans ta liste.",
  retirer: "C'est fait.",
};

/** « Accepter » ou « Refuser » une invitation, « Annuler ma demande », « Quitter ce lieu », ou « Renvoyer le lien ». */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.clone().formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  if (formulaire.get("formulaire") === FORMULAIRE_RENVOI) return traiterRenvoiVerification(request);
  const id = Number(formulaire.get("id"));
  const geste = formulaire.get("geste");
  if (formulaire.get("formulaire") !== FORMULAIRE_RATTACHEMENT || !Number.isInteger(id) || id <= 0 || (geste !== "accepter" && geste !== "retirer")) {
    throw data("Formulaire inconnu", { status: 400 });
  }

  const { jeton } = await exigerCompte(request);
  const ip = lireIpVisiteur(request);
  const reponse = geste === "accepter" ? await accepterInvitation(jeton, ip, id) : await retirerRattachement(jeton, ip, id);
  if (reponse.ok) return { ok: true, formulaire: FORMULAIRE_RATTACHEMENT, message: lierPonctuation(reussites[geste]) };
  await redirigerSiSessionFermee(request, reponse.erreur);
  const message = reponse.erreur === "invitation-inconnue" || reponse.erreur === "rattachement-inconnu"
    ? "Ça a déjà bougé entre-temps : la liste ci-dessous est à jour."
    : "Oups, ça n'a pas marché. Réessaie dans un instant.";
  return { ok: false, formulaire: FORMULAIRE_RATTACHEMENT, message: lierPonctuation(message) };
}

/** Page /tableau : mes lieux et leur statut, les invitations reçues, et « Rattacher un lieu ». */
export default function PageTableau({ loaderData }: Route.ComponentProps) {
  const { prenom, email, demandeEnvoyee, invitations, lieux } = loaderData;
  const reponse = useActionData<ReponseFormulaire>();
  const reponseGeste = reponse?.formulaire === FORMULAIRE_RATTACHEMENT ? reponse : undefined;
  return (
    <Section fond="creme" className="!pt-10 md:!pt-14">
      {!email.verifie && <BandeauVerificationEmail justeInscrit={email.justeInscrit} />}
      <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight">{lierPonctuation(`Salut, ${prenom} !`)}</h1>
      <p className="mt-2 max-w-xl text-lg text-gris">{lierPonctuation("Ton tableau pro : tes lieux, leur fiche, ton équipe.")}</p>

      {demandeEnvoyee && !reponseGeste && (
        <p role="status" className="mt-6 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 font-semibold">
          <span aria-hidden="true">✓ </span>
          {lierPonctuation("Ta demande est partie ! L'équipe SOS Miam vérifie que ce lieu est bien à toi, puis sa fiche s'ouvre ici.")}
        </p>
      )}
      <p role="status" aria-live="polite" className={`font-semibold ${reponseGeste?.ok ? "text-encre" : "text-rouge-texte"} ${reponseGeste ? "mt-6" : ""}`}>
        {reponseGeste?.ok && <span aria-hidden="true">✓ </span>}
        {reponseGeste?.message}
      </p>

      {invitations.length > 0 && (
        <section aria-labelledby="invitations" className="mt-8">
          <h2 id="invitations" className="text-2xl font-extrabold">Invitations</h2>
          <ul className="mt-4 grid gap-4">
            {invitations.map((invitation) => <CarteInvitation key={invitation.id} invitation={invitation} />)}
          </ul>
        </section>
      )}

      <section aria-labelledby="mes-lieux" className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="mes-lieux" className="text-2xl font-extrabold">Mes lieux</h2>
          {lieux && lieux.length > 0 && <Bouton vers="/rattacher" petit>Rattacher un lieu</Bouton>}
        </div>
        {lieux === null ? (
          <p className="rounded-2xl border-2 border-encre bg-white px-5 py-4 font-semibold">
            {lierPonctuation("Oups, tes lieux ne se sont pas affichés. Recharge la page dans un instant.")}
          </p>
        ) : lieux.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-2">
            {lieux.map((rattachement) => <CarteLieuPro key={rattachement.id} rattachement={rattachement} />)}
          </ul>
        ) : (
          <EtatSansLieu />
        )}
      </section>
    </Section>
  );
}
