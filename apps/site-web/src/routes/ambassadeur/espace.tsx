import { Link } from "react-router";

import type { Route } from "./+types/espace";
import { CartePalier } from "~/composants/ambassadeur/CartePalier";
import { ListePropositions } from "~/composants/ambassadeur/ListePropositions";
import { StatutAmbassadeur } from "~/composants/ambassadeur/StatutAmbassadeur";
import { TuileEspace } from "~/composants/ambassadeur/TuileEspace";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { lireCandidature, listerPropositions } from "~/services/comptes.server";
import { listerMessages, listerMissions } from "~/services/espace-ambassadeur.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { CandidatureFondateur } from "~/types/compte";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mon espace ambassadeur", description: "Ton espace ambassadeur SOS Miam." }), { name: "robots", content: "noindex" }];
}

/**
 * La personne connectée ; pour un ambassadeur validé, en plus : ses propositions, sa candidature « fondateur », ses
 * missions à faire et ses messages non lus (null quand une liste n'a pas pu être lue : la page s'affiche quand même).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerCompte(request);
  const profil = { prenom: compte.prenom, points: compte.points, palier: compte.palier, badges: compte.badges, ambassadeur: compte.ambassadeur };
  if (compte.ambassadeur?.statut !== "actif") return { profil, actif: null };

  const ip = lireIpVisiteur(request);
  const [propositions, candidature, missions, messages] = await Promise.all([
    listerPropositions(jeton, ip), lireCandidature(jeton, ip), listerMissions(jeton, ip), listerMessages(jeton, ip),
  ]);
  for (const reponse of [propositions, candidature, missions, messages]) {
    if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  }
  return {
    profil,
    actif: {
      propositions: propositions.ok ? propositions.propositions : null,
      /** undefined : pas pu être lue */
      candidature: candidature.ok ? candidature.candidature : undefined,
      /** Places de fondateur encore libres ; null : inconnues */
      placesRestantes: candidature.ok && typeof candidature.placesRestantes === "number" ? candidature.placesRestantes : null,
      missionsAFaire: missions.ok ? missions.missions.filter((mission) => mission.statut === "a-faire").length : null,
      messagesNonLus: messages.ok ? messages.messages.filter((message) => message.luLe === null).length : null,
    },
  };
}

/** Ce que dit la tuile « fondateur », selon la candidature et les places encore libres (null : inconnues). */
function decrireCandidature(candidature: CandidatureFondateur | null | undefined, placesRestantes: number | null) {
  if (!candidature) {
    if (placesRestantes === 0) {
      return { titre: "Fondateurs", texte: "Les 10 places de fondateur sont prises. Tu restes ambassadeur et tu grimpes les niveaux !", pastille: "Complet" };
    }
    const places = placesRestantes === null ? "" : ` Encore ${placesRestantes} place${placesRestantes > 1 ? "s" : ""}.`;
    return { titre: "Devenir fondateur", texte: `On lance SOS Miam avec 10 ambassadeurs fondateurs.${places} Tente ta chance !`, pastille: null };
  }
  if (candidature.statut === "acceptee") {
    return { titre: "Fondateur", texte: "Tu fais partie des 10 ambassadeurs fondateurs !", pastille: candidature.numero ? `N° ${candidature.numero}` : null };
  }
  if (candidature.statut === "refusee") return { titre: "Ma candidature", texte: "Cette fois, ta candidature n'a pas été retenue.", pastille: null };
  return { titre: "Ma candidature", texte: "Ta candidature de fondateur est bien arrivée : l'équipe la lit.", pastille: "À l'étude" };
}

/** Page /espace : selon le statut, l'attente, le refus, la suspension, ou tout l'espace d'un ambassadeur validé. */
export default function PageEspace({ loaderData }: Route.ComponentProps) {
  const { profil, actif } = loaderData;

  if (!actif) {
    return (
      <Section fond="creme" etroit>
        <StatutAmbassadeur prenom={profil.prenom} ambassadeur={profil.ambassadeur} />
        {profil.ambassadeur?.statut !== "refuse" && (
          <p className="mt-8 text-center text-gris">
            <Link to="/espace/mon-compte" className={classeLien}>Mon compte</Link>
            {lierPonctuation(" : tes infos, ton mot de passe, ou effacer ton compte.")}
          </p>
        )}
      </Section>
    );
  }

  const fondateur = decrireCandidature(actif.candidature, actif.placesRestantes);
  const pluriel = (nombre: number) => (nombre > 1 ? "s" : "");
  return (
    <Section fond="creme">
      <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight">{lierPonctuation(`Salut, ${profil.prenom} !`)}</h1>
      <p className="mt-2 mb-10 max-w-xl text-lg text-gris">{lierPonctuation("Bienvenue dans ton espace ambassadeur : tout ce qu'il faut pour faire briller les pépites du coin.")}</p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <CartePalier palier={profil.palier} points={profil.points} badges={profil.badges} />
        <nav aria-label="Ton espace">
          <ul className="grid gap-4 sm:grid-cols-2">
            <TuileEspace vers="/espace/kit-media" emoji="🎨" titre="Kit média" texte="Logos, visuels et textes prêts à poster." />
            <TuileEspace vers="/espace/proposer-un-lieu" emoji="🔎" titre="Proposer un lieu" texte={lierPonctuation("Une pépite qui mérite plus de monde ? Raconte-la-nous.")} />
            <TuileEspace vers="/espace/fondateur" emoji="🎖️" titre={fondateur.titre} texte={lierPonctuation(fondateur.texte)} pastille={fondateur.pastille} />
            <TuileEspace
              vers="/espace/missions"
              emoji="📋"
              titre="Mes missions"
              texte="Des coups de main proposés par l'équipe, à ton rythme."
              pastille={actif.missionsAFaire ? `${actif.missionsAFaire} à faire` : null}
            />
            <TuileEspace
              vers="/espace/messages"
              emoji="💌"
              titre="Mes messages"
              texte="Les nouvelles de l'équipe SOS Miam."
              pastille={actif.messagesNonLus ? `${actif.messagesNonLus} non lu${pluriel(actif.messagesNonLus)}` : null}
            />
            <TuileEspace vers="/espace/mon-compte" emoji="⚙️" titre="Mon compte" texte="Tes infos, ton mot de passe, ta déconnexion." />
          </ul>
        </nav>
      </div>

      <section aria-labelledby="mes-propositions" className="mt-12">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="mes-propositions" className="text-2xl font-extrabold">Mes propositions</h2>
          <Link to="/espace/proposer-un-lieu" className={classeLien}>Proposer un lieu</Link>
        </div>
        <ListePropositions propositions={actif.propositions} />
      </section>
    </Section>
  );
}
