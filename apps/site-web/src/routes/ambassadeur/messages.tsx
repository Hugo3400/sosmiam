import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/messages";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { CarteMessage } from "~/composants/ambassadeur/CarteMessage";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_MESSAGES_AMBASSADEUR_PAR_LANGUE } from "~/contenus/messages-ambassadeur";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { listerMessages, marquerMessageLu } from "~/services/espace-ambassadeur.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

type ReponseMessage = { ok: boolean; formulaire: string; reponse: "lu" | "introuvable" | "panne" };

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_MESSAGES_AMBASSADEUR_PAR_LANGUE, langue);
  return [...creerMeta({ ...T.meta, langue }), { name: "robots", content: "noindex" }];
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
export async function action({ request }: Route.ActionArgs): Promise<ReponseMessage> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const id = Number(formulaire.get("messageId"));
  if (!Number.isInteger(id) || id <= 0) throw data("Message inconnu", { status: 400 });
  const nom = `message-${id}`;
  const reponse = await marquerMessageLu(jeton, lireIpVisiteur(request), id);
  if (reponse.ok) return { ok: true, formulaire: nom, reponse: "lu" };
  await redirigerSiSessionFermee(request, reponse.erreur);
  return { ok: false, formulaire: nom, reponse: reponse.erreur === "introuvable" ? "introuvable" : "panne" };
}

/** Page /espace/messages : les nouvelles de l'équipe, à marquer comme lues. */
export default function PageMessages({ loaderData, actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_MESSAGES_AMBASSADEUR_PAR_LANGUE);
  const { messages } = loaderData;
  const nonLus = messages.filter((message) => !message.luLe).length;
  const erreur = actionData && !actionData.ok ? lierPonctuation(T.reponses[actionData.reponse]) : undefined;
  // Message marqué comme lu : son bouton disparaît, le focus passe à la confirmation, lue une fois (comme sur « Mes
  // missions » : pas de role="status" sur elle, sinon elle serait annoncée deux fois). [actionData] et pas [reussite] :
  // le texte est le même d'un message à l'autre, le focus doit pourtant y revenir à chaque fois.
  const confirmation = useRef<HTMLParagraphElement>(null);
  const reussite = actionData?.ok ? lierPonctuation(T.reponses[actionData.reponse]) : undefined;
  useEffect(() => {
    if (reussite) confirmation.current?.focus();
  }, [actionData]);
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={`${T.chapo}${nonLus > 0 ? T.nonLus(nonLus) : ""}`}
      >
        {T.titre}
      </TitreSection>
      <p role="status" className={erreur ? "mb-8 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-5 py-4 font-semibold text-rouge-texte" : ""}>
        {erreur}
      </p>
      <p ref={confirmation} tabIndex={-1} className={reussite ? "mb-8 rounded-2xl border-2 border-encre bg-jaune px-5 py-4 text-center font-semibold" : ""}>
        {reussite && <><span aria-hidden="true">✓ </span>{reussite}</>}
      </p>
      {messages.length === 0 ? (
        <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
          <Mascotte expression="clin" className="mx-auto mb-5 h-20 w-20" />
          <p className="text-lg">{lierPonctuation(T.aucun)}</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {messages.map((message) => (
            <CarteMessage key={message.id} message={message} />
          ))}
        </div>
      )}
    </Section>
  );
}
