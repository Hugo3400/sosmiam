import { Link } from "react-router";

import type { Route } from "./+types/espace";
import { CartePalier } from "~/composants/ambassadeur/CartePalier";
import { ListePropositions } from "~/composants/ambassadeur/ListePropositions";
import { StatutAmbassadeur } from "~/composants/ambassadeur/StatutAmbassadeur";
import { TuileEspace } from "~/composants/ambassadeur/TuileEspace";
import { BandeauVerificationEmail } from "~/composants/compte/BandeauVerificationEmail";
import { Section } from "~/composants/mise-en-page/Section";
import { decrirePlacesZone } from "~/fonctions/fondateurs/decrire-places-zone";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { lireCandidature, listerPropositions } from "~/services/comptes.server";
import { listerMessages, listerMissions } from "~/services/espace-ambassadeur.server";
import { trouverZoneDeVille } from "~/services/fondateurs.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import { FORMULAIRE_RENVOI, traiterRenvoiVerification } from "~/services/verification-email.server";
import type { CandidatureFondateur, ZoneFondateurs } from "~/types/compte";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mon espace ambassadeur", description: "Ton espace ambassadeur SOS Miam." }), { name: "robots", content: "noindex" }];
}

/**
 * La personne connectée (et si son e-mail est confirmé ; ?inscription=1 : le lien vient de partir) ; pour un ambassadeur
 * validé, en plus : ses propositions, sa candidature « fondateur » (et les places de sa ville quand il n'a pas de
 * candidature en cours), ses missions à faire et ses messages non lus (null quand une liste n'a pas pu être lue : la page
 * s'affiche quand même).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerCompte(request);
  const profil = { prenom: compte.prenom, points: compte.points, palier: compte.palier, badges: compte.badges, ambassadeur: compte.ambassadeur };
  const email = { verifie: compte.emailVerifie !== false, justeInscrit: new URL(request.url).searchParams.get("inscription") === "1" };
  if (compte.ambassadeur?.statut !== "actif") return { profil, email, actif: null };

  const ip = lireIpVisiteur(request);
  const [propositions, candidature, missions, messages] = await Promise.all([
    listerPropositions(jeton, ip), lireCandidature(jeton, ip), listerMissions(jeton, ip), listerMessages(jeton, ip),
  ]);
  for (const reponse of [propositions, candidature, missions, messages]) {
    if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  }
  // Places de SA ville (écrite dans son compte), tant qu'il n'a pas de candidature à l'étude ou acceptée
  const statut = candidature.ok ? candidature.candidature?.statut : "inconnu";
  const sansCandidature = statut === undefined || statut === "souvenir" || statut === "refusee";
  const zoneVille = sansCandidature && compte.ambassadeur.ville ? await trouverZoneDeVille(compte.ambassadeur.ville, ip) : null;
  return {
    profil,
    email,
    actif: {
      propositions: propositions.ok ? propositions.propositions : null,
      /** undefined : pas pu être lue */
      candidature: candidature.ok ? candidature.candidature : undefined,
      /** Places de fondateur encore libres ; null : inconnues */
      placesRestantes: candidature.ok && typeof candidature.placesRestantes === "number" ? candidature.placesRestantes : null,
      /** La zone de fondateurs de sa ville, si on la reconnaît */
      zoneVille: zoneVille?.zone ?? null,
      missionsAFaire: missions.ok ? missions.missions.filter((mission) => mission.statut === "a-faire").length : null,
      messagesNonLus: messages.ok ? messages.messages.filter((message) => message.luLe === null).length : null,
    },
  };
}

/** « Renvoyer le lien » qui confirme l'e-mail (bandeau du haut de la page). */
export async function action({ request }: Route.ActionArgs) {
  return traiterRenvoiVerification(request);
}

/**
 * Ce que dit la tuile « fondateur », selon la candidature, les places de sa ville (zoneVille) ou, à défaut, celles encore
 * libres en France (null : inconnues).
 */
function decrireCandidature(candidature: CandidatureFondateur | null | undefined, placesRestantes: number | null, zoneVille: ZoneFondateurs | null) {
  const zone = candidature?.zone;
  const numero = candidature?.numeroLocal ?? candidature?.numero;
  const pastilleNumero = numero ? `N° ${numero}${zone ? ` ${zone.nomAvecDe}` : ""}` : null;
  if (candidature?.statut === "acceptee") {
    return { titre: "Fondateur", texte: `Tu fais partie des fondateurs${zone ? ` ${zone.nomAvecDe}` : ""} ! Ta carte t'attend.`, pastille: pastilleNumero };
  }
  if (candidature?.statut === "en-attente") {
    if (!candidature.commune) return { titre: "Ma candidature", texte: "Précise ta commune : on saura pour quelle ville tu candidates.", pastille: "À compléter" };
    return { titre: "Ma candidature", texte: `Ta candidature pour ${zone?.nom ?? candidature.commune.nom} est bien arrivée : l'équipe la lit.`, pastille: "À l'étude" };
  }
  if (candidature?.statut === "refusee") return { titre: "Ma candidature", texte: "Cette fois, ta candidature n'a pas été retenue.", pastille: null };

  // Pas de candidature en cours (ou un titre gardé en souvenir) : les places de sa ville, sinon de toute la France
  const souvenir = candidature?.statut === "souvenir" ? `Tu as été fondateur${pastilleNumero ? ` ${pastilleNumero.replace("N° ", "n° ")}` : ""}. ` : "";
  if (zoneVille) {
    const complet = zoneVille.libres === 0;
    const suite = complet ? " Elle rouvrira dès qu'une place se libère." : " Tente ta chance !";
    return { titre: souvenir ? "Fondateur en souvenir" : "Devenir fondateur", texte: `${souvenir}${decrirePlacesZone(zoneVille)}.${suite}`, pastille: complet ? "Complet" : pastilleNumero };
  }
  const places = placesRestantes === null ? "" : ` Encore ${placesRestantes} place${placesRestantes > 1 ? "s" : ""} en France.`;
  return { titre: souvenir ? "Fondateur en souvenir" : "Devenir fondateur", texte: `${souvenir}Des fondateurs dans chaque ville.${places} Tente ta chance !`, pastille: pastilleNumero };
}

/** Page /espace : selon le statut, l'attente, le refus, la suspension, ou tout l'espace d'un ambassadeur validé. */
export default function PageEspace({ loaderData }: Route.ComponentProps) {
  const { profil, email, actif } = loaderData;
  const bandeau = email.verifie ? null : <BandeauVerificationEmail formulaire={FORMULAIRE_RENVOI} justeInscrit={email.justeInscrit} />;

  if (!actif) {
    return (
      <Section fond="creme" etroit>
        {bandeau}
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

  const fondateur = decrireCandidature(actif.candidature, actif.placesRestantes, actif.zoneVille);
  const pluriel = (nombre: number) => (nombre > 1 ? "s" : "");
  return (
    <Section fond="creme">
      {bandeau}
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
