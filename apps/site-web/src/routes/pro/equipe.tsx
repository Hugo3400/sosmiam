import { data, useActionData } from "react-router";

import type { Route } from "./+types/equipe";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Section } from "~/composants/mise-en-page/Section";
import { FORMULAIRE_RETIRER, ListeEquipe } from "~/composants/pro/ListeEquipe";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { inviterMembre, listerEquipe, retirerMembre } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Mon équipe · ${loaderData.lieu.nom}` : "Mon équipe", description: "L'équipe de ton lieu sur SOS Miam." }), { name: "robots", content: "noindex" }];
}

/** L'équipe du lieu (gérant seulement ; null : pas pu être lue). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu, role } = await exigerLieuPro(request, params.id);
  if (role !== "gerant") return { lieu, gerant: false, equipe: null };
  const reponse = await listerEquipe(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, gerant: true, equipe: reponse.ok ? reponse.equipe : null };
}

const messagesInvitation: Record<string, string> = {
  "compte-inconnu": "Personne n'a de compte SOS Miam avec cette adresse. Demande-lui d'en créer un (c'est gratuit, sur pro.sosmiam.fr), puis invite-le de nouveau.",
  "deja-membre": "Cette personne est déjà dans l'équipe, ou déjà invitée.",
  "trop-d-invitations": "Ça fait beaucoup d'invitations pour aujourd'hui : réessaie demain.",
  "equipe-complete": "Ton équipe est au complet (30 personnes). Retire quelqu'un pour en inviter un autre.",
  "trop-de-demandes": "Ça fait beaucoup d'invitations d'un coup : réessaie un peu plus tard.",
  "reserve-au-gerant": "Seul le gérant invite dans l'équipe.",
};

/** Inviter par e-mail, ou retirer un membre (gérant). */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);

  if (formulaire.get("formulaire") === FORMULAIRE_RETIRER) {
    const compteId = Number(formulaire.get("compteId"));
    if (!Number.isInteger(compteId) || compteId <= 0) throw data("Membre inconnu", { status: 400 });
    const reponse = await retirerMembre(jeton, ip, lieu.id, compteId);
    if (reponse.ok) return { ok: true, formulaire: FORMULAIRE_RETIRER, message: "C'est fait." };
    await redirigerSiSessionFermee(request, reponse.erreur);
    const message = reponse.erreur === "membre-inconnu" ? "Cette personne n'est déjà plus dans l'équipe." : messagesInvitation[reponse.erreur] ?? "Oups, ça n'a pas marché. Réessaie dans un instant.";
    return { ok: false, formulaire: FORMULAIRE_RETIRER, message: lierPonctuation(message) };
  }

  const email = String(formulaire.get("email") ?? "").trim().toLowerCase();
  if (!verifierEmail(email) || email.length > 254) {
    return { ok: false, formulaire: "inviter", erreurs: { email: lierPonctuation("Cette adresse e-mail ne semble pas valide.") }, valeurs: { email } };
  }
  const reponse = await inviterMembre(jeton, ip, lieu.id, email);
  if (reponse.ok) return { ok: true, formulaire: "inviter", message: lierPonctuation("Invitation envoyée ! Elle s'affiche dans son tableau pro : il n'a plus qu'à l'accepter.") };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "champ-invalide") return { ok: false, formulaire: "inviter", erreurs: { email: lierPonctuation("Cette adresse e-mail ne semble pas valide.") }, valeurs: { email } };
  const message = messagesInvitation[reponse.erreur] ?? "Oups, l'invitation n'est pas partie. Réessaie dans un instant.";
  return { ok: false, formulaire: "inviter", message: lierPonctuation(message), valeurs: { email } };
}

/** Page /lieu/:id/equipe : la liste, inviter par e-mail, retirer (gérant). */
export default function PageEquipe({ loaderData }: Route.ComponentProps) {
  const { lieu, gerant, equipe } = loaderData;
  const reponse = useActionData<ReponseFormulaire>();
  const reponseRetrait = reponse?.formulaire === FORMULAIRE_RETIRER ? reponse : undefined;
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro lieu={lieu} page="Mon équipe" chapo={lierPonctuation("Tes collègues voient la fiche, les suggestions et l'affichette. Seul le gérant modifie.")} />
      {!gerant ? (
        <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation("Seul le gérant gère l'équipe du lieu.")}</p>
      ) : (
        <div className="grid gap-10">
          <section aria-labelledby="equipe-liste">
            <h2 id="equipe-liste" className="mb-4 text-2xl font-extrabold">{lierPonctuation("Qui est dans l'équipe ?")}</h2>
            <p role="status" aria-live="polite" className={`font-semibold ${reponseRetrait?.ok ? "text-encre" : "text-rouge-texte"} ${reponseRetrait ? "mb-4" : ""}`}>
              {reponseRetrait?.message}
            </p>
            {equipe ? <ListeEquipe equipe={equipe} /> : <p className="font-semibold">{lierPonctuation("Oups, l'équipe ne s'est pas affichée. Recharge la page dans un instant.")}</p>}
          </section>
          <section aria-labelledby="equipe-inviter">
            <h2 id="equipe-inviter" className="mb-2 text-2xl font-extrabold">Inviter quelqu'un</h2>
            <p className="mb-4 text-gris">{lierPonctuation("Il lui faut un compte SOS Miam (gratuit). Son invitation l'attend dans son tableau pro.")}</p>
            <FormulaireCompte nom="inviter" bouton="Inviter" viderApresReussite className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
              <ChampTexte nom="email" libelle="Son e-mail" type="email" inputMode="email" autoComplete="off" maximum={254} exemple="prenom@exemple.fr" />
            </FormulaireCompte>
          </section>
        </div>
      )}
    </Section>
  );
}
