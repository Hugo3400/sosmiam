import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/missions";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { CarteMission } from "~/composants/ambassadeur/CarteMission";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE } from "~/contenus/missions-ambassadeur";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { listerMissions, terminerMission } from "~/services/espace-ambassadeur.server";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE, langue);
  return [...creerMeta({ ...T.meta, langue }), { name: "robots", content: "noindex" }];
}

/** Les missions de l'ambassadeur : à faire d'abord, puis les dernières faites ou annulées. */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton } = await exigerAmbassadeurActif(request);
  const reponse = await listerMissions(jeton, lireIpVisiteur(request));
  if (!reponse.ok) {
    await redirigerSiSessionFermee(request, reponse.erreur);
    throw data("Missions illisibles", { status: 503 });
  }
  return { missions: reponse.missions };
}

/** Termine une mission avec son compte rendu. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const { jeton } = await exigerAmbassadeurActif(request);
  const { messages } = choisirTextes(TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE, lireLangueRequete(request).langue);
  const messageTropCourt = messages.tropCourt;
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const id = Number(formulaire.get("missionId"));
  if (!Number.isInteger(id) || id <= 0) throw data("Mission inconnue", { status: 400 });
  const nom = `mission-${id}`;
  // Les retours à la ligne sont gardés, en « \n » : envoyé sans JavaScript, le formulaire les écrit « \r\n », qui
  // compteraient double face au maximum
  const compteRendu = String(formulaire.get("compteRendu") ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
  const valeurs = { compteRendu };
  if (compteRendu.length < 5 || compteRendu.length > 2000) return { ok: false, formulaire: nom, erreurs: { compteRendu: messageTropCourt }, valeurs };

  const reponse = await terminerMission(jeton, lireIpVisiteur(request), id, compteRendu);
  // Sans message : c'est la page qui dit « Mission terminée, bravo ! » (le formulaire de la carte ne le répète pas)
  if (reponse.ok) return { ok: true, formulaire: nom };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "compte-rendu-trop-court") return { ok: false, formulaire: nom, erreurs: { compteRendu: messageTropCourt }, valeurs };
  const message = reponse.erreur === "introuvable" ? messages.introuvable : messages.panne;
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs };
}

/** Page /espace/missions : les coups de main proposés par l'équipe, à faire à son rythme. */
export default function PageMissions({ loaderData, actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE);
  const { missions } = loaderData;
  const aFaire = missions.filter((mission) => mission.statut === "a-faire");
  const faites = missions.filter((mission) => mission.statut === "faite");
  const annulees = missions.filter((mission) => mission.statut === "annulee");
  // Mission terminée : sa carte change (le formulaire disparaît), le focus passe au message de réussite, lu à ce moment-là.
  // Pas de role="status" sur lui, ni de message dans le formulaire de la carte : il serait annoncé deux ou trois fois.
  const bravo = useRef<HTMLParagraphElement>(null);
  const reussite = actionData?.ok === true;
  useEffect(() => {
    if (reussite) bravo.current?.focus();
  }, [actionData]);

  const groupes = [
    { id: "a-faire", titre: T.groupes["a-faire"], missions: aFaire },
    { id: "faites", titre: T.groupes.faites, missions: faites },
    { id: "annulees", titre: T.groupes.annulees, missions: annulees },
  ].filter((groupe) => groupe.missions.length > 0);

  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation(T.chapo)}
      >
        {T.titre}
      </TitreSection>
      <p ref={bravo} tabIndex={-1} className={reussite ? "mb-8 rounded-2xl border-2 border-encre bg-jaune px-5 py-4 text-center font-semibold" : ""}>
        {reussite && <><span aria-hidden="true">🎉 </span>{lierPonctuation(T.bravo)}</>}
      </p>
      {groupes.length === 0 ? (
        <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
          <Mascotte expression="clin" className="mx-auto mb-5 h-20 w-20" />
          <p className="text-lg">{lierPonctuation(T.aucune)}</p>
        </div>
      ) : (
        groupes.map((groupe) => (
          <section key={groupe.id} aria-labelledby={`missions-${groupe.id}`} className="mb-10">
            <h2 id={`missions-${groupe.id}`} className="mb-4 text-2xl font-extrabold">{groupe.titre} ({groupe.missions.length})</h2>
            <div className="grid gap-5">{groupe.missions.map((mission) => <CarteMission key={mission.id} mission={mission} />)}</div>
          </section>
        ))
      )}
    </Section>
  );
}
