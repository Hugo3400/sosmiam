import { data } from "react-router";

import type { Route } from "./+types/messages";
import { CarteMessage } from "~/composants/ambassadeur/CarteMessage";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { listerMessages, marquerMessageLu } from "~/services/espace-ambassadeur.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mes messages", description: "Les messages de l'équipe SOS Miam." }), { name: "robots", content: "noindex" }];
}

/** Les messages de l'équipe (les siens et ceux envoyés à tous), les plus récents d'abord. */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton } = await exigerAmbassadeurActif(request);
  const reponse = await listerMessages(jeton, lireIpVisiteur(request));
  if (!reponse.ok) {
    await redirigerSiSessionFermee(request, reponse.erreur);
    throw data("Messages illisibles", { status: 503 });
  }
  return { messages: reponse.messages };
}

/** Marque un message comme lu. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const id = Number(formulaire.get("messageId"));
  if (!Number.isInteger(id) || id <= 0) throw data("Message inconnu", { status: 400 });
  const nom = `message-${id}`;
  const reponse = await marquerMessageLu(jeton, lireIpVisiteur(request), id);
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  const message = reponse.erreur === "introuvable" ? "Ce message n'existe plus." : "Oups, ça n'a pas marché. Réessaie dans un instant.";
  return { ok: false, formulaire: nom, message };
}

/** Page /espace/messages : les nouvelles de l'équipe, à marquer comme lues. */
export default function PageMessages({ loaderData, actionData }: Route.ComponentProps) {
  const { messages } = loaderData;
  const nonLus = messages.filter((message) => !message.luLe).length;
  const erreur = actionData && !actionData.ok ? actionData.message : undefined;
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={nonLus > 0 ? `Les nouvelles de l'équipe SOS Miam. ${nonLus} non lu${nonLus > 1 ? "s" : ""}.` : "Les nouvelles de l'équipe SOS Miam."}
      >
        Mes messages
      </TitreSection>
      <p role="status" className={erreur ? "mb-8 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-5 py-4 font-semibold text-rouge-texte" : ""}>
        {erreur}
      </p>
      {messages.length === 0 ? (
        <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
          <Mascotte expression="clin" className="mx-auto mb-5 h-20 w-20" />
          <p className="text-lg">{lierPonctuation("Aucun message pour l'instant. Quand l'équipe t'écrit, c'est ici que ça arrive.")}</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {messages.map((message) => (
            <CarteMessage key={message.id} message={message} vientDEtreLu={actionData?.ok === true && actionData.formulaire === `message-${message.id}`} />
          ))}
        </div>
      )}
    </Section>
  );
}
