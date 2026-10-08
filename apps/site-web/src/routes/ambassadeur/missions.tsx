import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/missions";
import { CarteMission } from "~/composants/ambassadeur/CarteMission";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { listerMissions, terminerMission } from "~/services/espace-ambassadeur.server";
import { exigerAmbassadeurActif, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const messageTropCourt = "Écris quelques mots sur ce que tu as fait (5 à 2000 caractères).";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mes missions", description: "Les missions de ton espace ambassadeur SOS Miam." }), { name: "robots", content: "noindex" }];
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
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const id = Number(formulaire.get("missionId"));
  if (!Number.isInteger(id) || id <= 0) throw data("Mission inconnue", { status: 400 });
  const nom = `mission-${id}`;
  // Les retours à la ligne sont gardés
  const compteRendu = String(formulaire.get("compteRendu") ?? "").replace(/[ \t]+/g, " ").trim();
  const valeurs = { compteRendu };
  if (compteRendu.length < 5 || compteRendu.length > 2000) return { ok: false, formulaire: nom, erreurs: { compteRendu: messageTropCourt }, valeurs };

  const reponse = await terminerMission(jeton, lireIpVisiteur(request), id, compteRendu);
  if (reponse.ok) return { ok: true, formulaire: nom, message: lierPonctuation("Mission terminée, bravo ! Merci pour ton compte rendu.") };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "compte-rendu-trop-court") return { ok: false, formulaire: nom, erreurs: { compteRendu: messageTropCourt }, valeurs };
  const message = reponse.erreur === "introuvable"
    ? "Cette mission n'est plus à faire : l'équipe l'a peut-être annulée."
    : "Oups, ton compte rendu n'est pas passé. Réessaie dans un instant.";
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs };
}

/** Page /espace/missions : les coups de main proposés par l'équipe, à faire à son rythme. */
export default function PageMissions({ loaderData, actionData }: Route.ComponentProps) {
  const { missions } = loaderData;
  const aFaire = missions.filter((mission) => mission.statut === "a-faire");
  const faites = missions.filter((mission) => mission.statut === "faite");
  const annulees = missions.filter((mission) => mission.statut === "annulee");
  // Mission terminée : sa carte change (le formulaire disparaît), le focus passe au message de réussite
  const bravo = useRef<HTMLParagraphElement>(null);
  const reussite = actionData?.ok ? actionData.message : undefined;
  useEffect(() => {
    if (reussite) bravo.current?.focus();
  }, [actionData]);

  const groupes = [
    { id: "a-faire", titre: "À faire", missions: aFaire },
    { id: "faites", titre: "Terminées", missions: faites },
    { id: "annulees", titre: "Annulées", missions: annulees },
  ].filter((groupe) => groupe.missions.length > 0);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Des coups de main proposés par l'équipe, à faire à ton rythme : ni horaires, ni objectifs.")}>
        Mes missions
      </TitreSection>
      <p ref={bravo} tabIndex={-1} role="status" className={reussite ? "mb-8 rounded-2xl border-2 border-encre bg-jaune px-5 py-4 text-center font-semibold" : ""}>
        {reussite && <><span aria-hidden="true">🎉 </span>{reussite}</>}
      </p>
      {groupes.length === 0 ? (
        <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
          <Mascotte expression="clin" className="mx-auto mb-5 h-20 w-20" />
          <p className="text-lg">{lierPonctuation("Pas de mission pour l'instant. Quand l'équipe t'en confie une, elle arrive ici.")}</p>
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
