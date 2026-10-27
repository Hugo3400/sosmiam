import { data, useActionData } from "react-router";

import type { Route } from "./+types/equipe";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Section } from "~/composants/mise-en-page/Section";
import { FORMULAIRE_RETIRER, ListeEquipe } from "~/composants/pro/ListeEquipe";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_EQUIPE_PRO_PAR_LANGUE } from "~/contenus/equipe-pro";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { expliquerCompteLimite } from "~/fonctions/compte/expliquer-compte-limite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { inviterMembre, listerEquipe, retirerMembre } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_EQUIPE_PRO_PAR_LANGUE, langue).meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** L'équipe du lieu (gérant seulement ; null : pas pu être lue). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu, role } = await exigerLieuPro(request, params.id);
  if (role !== "gerant") return { lieu, gerant: false, equipe: null };
  const reponse = await listerEquipe(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, gerant: true, equipe: reponse.ok ? reponse.equipe : null };
}

/** Inviter par e-mail, ou retirer un membre (gérant). */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const langue = lireLangueRequete(request).langue;
  const M = choisirTextes(TEXTES_EQUIPE_PRO_PAR_LANGUE, langue).messages;
  const messagesInvitation: Record<string, string> = M.erreurs;

  if (formulaire.get("formulaire") === FORMULAIRE_RETIRER) {
    const compteId = Number(formulaire.get("compteId"));
    if (!Number.isInteger(compteId) || compteId <= 0) throw data("Membre inconnu", { status: 400 });
    const reponse = await retirerMembre(jeton, ip, lieu.id, compteId);
    if (reponse.ok) return { ok: true, formulaire: FORMULAIRE_RETIRER, message: M.retire };
    await redirigerSiSessionFermee(request, reponse.erreur);
    const message = reponse.erreur === "membre-inconnu" ? M.membreInconnu : messagesInvitation[reponse.erreur] ?? M.panne;
    return { ok: false, formulaire: FORMULAIRE_RETIRER, message: lierPonctuation(message) };
  }

  const email = String(formulaire.get("email") ?? "").trim().toLowerCase();
  if (!verifierEmail(email) || email.length > 254) {
    return { ok: false, formulaire: "inviter", erreurs: { email: lierPonctuation(M.emailInvalide) }, valeurs: { email } };
  }
  const reponse = await inviterMembre(jeton, ip, lieu.id, email);
  if (reponse.ok) return { ok: true, formulaire: "inviter", message: lierPonctuation(M.invitationEnvoyee) };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "champ-invalide") return { ok: false, formulaire: "inviter", erreurs: { email: lierPonctuation(M.emailInvalide) }, valeurs: { email } };
  // Compte limité : une invitation arriverait chez quelqu'un, elle attend la fin de la limitation
  const message = reponse.erreur === "compte-limite"
    ? expliquerCompteLimite(reponse.jusqua, langue)
    : messagesInvitation[reponse.erreur] ?? M.invitationPanne;
  return { ok: false, formulaire: "inviter", message: lierPonctuation(message), valeurs: { email } };
}

/** Page /lieu/:id/equipe : la liste, inviter par e-mail, retirer (gérant). */
export default function PageEquipe({ loaderData }: Route.ComponentProps) {
  const { lieu, gerant, equipe } = loaderData;
  const T = utiliserTextes(TEXTES_EQUIPE_PRO_PAR_LANGUE);
  const reponse = useActionData<ReponseFormulaire>();
  const reponseRetrait = reponse?.formulaire === FORMULAIRE_RETIRER ? reponse : undefined;
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro lieu={lieu} page={T.page} chapo={lierPonctuation(T.chapo)} />
      {!gerant ? (
        <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(T.reserveAuGerant)}</p>
      ) : (
        <div className="grid gap-10">
          <section aria-labelledby="equipe-liste">
            <h2 id="equipe-liste" className="mb-4 text-2xl font-extrabold">{lierPonctuation(T.qui)}</h2>
            <p role="status" aria-live="polite" className={`font-semibold ${reponseRetrait?.ok ? "text-encre" : "text-rouge-texte"} ${reponseRetrait ? "mb-4" : ""}`}>
              {reponseRetrait?.message}
            </p>
            {equipe ? <ListeEquipe equipe={equipe} /> : <p className="font-semibold">{lierPonctuation(T.illisible)}</p>}
          </section>
          <section aria-labelledby="equipe-inviter">
            <h2 id="equipe-inviter" className="mb-2 text-2xl font-extrabold">{T.inviter.titre}</h2>
            <p className="mb-4 text-gris">{lierPonctuation(T.inviter.texte)}</p>
            <FormulaireCompte nom="inviter" bouton={T.inviter.bouton} viderApresReussite className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
              <ChampTexte nom="email" libelle={T.inviter.email} type="email" inputMode="email" autoComplete="off" maximum={254} exemple={T.inviter.exemple} />
            </FormulaireCompte>
          </section>
        </div>
      )}
    </Section>
  );
}
