import { Link } from "react-router";

import type { Route } from "./+types/espace";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { CartePalier } from "~/composants/ambassadeur/CartePalier";
import { ListePropositions } from "~/composants/ambassadeur/ListePropositions";
import { StatutAmbassadeur } from "~/composants/ambassadeur/StatutAmbassadeur";
import { TuileEspace } from "~/composants/ambassadeur/TuileEspace";
import { BandeauVerificationEmail } from "~/composants/compte/BandeauVerificationEmail";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE, type TEXTES_ESPACE_AMBASSADEUR } from "~/contenus/espace-ambassadeur";
import { decrirePlacesZone } from "~/fonctions/fondateurs/decrire-places-zone";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireCertification } from "~/services/certification.server";
import { lireCandidature, listerPropositions } from "~/services/comptes.server";
import { listerMessages, listerMissions } from "~/services/espace-ambassadeur.server";
import { trouverZoneDeVille } from "~/services/fondateurs.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";
import { traiterRenvoiVerification } from "~/services/verification-email.server";
import type { CandidatureCertification, CandidatureFondateur, CertificationAmbassadeur, ZoneFondateurs } from "~/types/compte";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

type TextesEspace = Traduction<typeof TEXTES_ESPACE_AMBASSADEUR>;

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE, langue);
  return [...creerMeta({ ...T.meta, langue }), { name: "robots", content: "noindex" }];
}

/**
 * La personne connectée (et si son e-mail est confirmé ; ?inscription=1 : le lien vient de partir) ; pour un ambassadeur
 * validé, en plus : ses propositions, sa candidature « fondateur » (et les places de sa ville quand il n'a pas de
 * candidature en cours), ses missions à faire et ses messages non lus (null quand une liste n'a pas pu être lue : la page
 * s'affiche quand même).
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerCompte(request);
  const profil = {
    prenom: compte.prenom, points: compte.points, palier: compte.palier, badges: compte.badges, ambassadeur: compte.ambassadeur,
    certifie: compte.ambassadeur?.certifie ?? null,
  };
  const email = { verifie: compte.emailVerifie !== false, justeInscrit: new URL(request.url).searchParams.get("inscription") === "1" };
  if (compte.ambassadeur?.statut !== "actif") return { profil, email, actif: null };

  const ip = lireIpVisiteur(request);
  const [propositions, candidature, missions, messages, certification] = await Promise.all([
    listerPropositions(jeton, ip), lireCandidature(jeton, ip), listerMissions(jeton, ip), listerMessages(jeton, ip), lireCertification(jeton, ip),
  ]);
  for (const reponse of [propositions, candidature, missions, messages, certification]) {
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
      /** Statut de la dernière candidature « ambassadeur certifié » ; undefined : pas pu être lue */
      statutCertification: certification.ok ? (certification.candidature?.statut ?? null) : undefined,
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
function decrireCandidature(
  candidature: CandidatureFondateur | null | undefined,
  placesRestantes: number | null,
  zoneVille: ZoneFondateurs | null,
  textes: TextesEspace["fondateur"],
  langue: Langue,
) {
  const T = textes;
  const zone = candidature?.zone;
  const numero = candidature?.numeroLocal ?? candidature?.numero;
  const pastilleNumero = numero ? T.numero(numero, zone) : null;
  if (candidature?.statut === "acceptee") {
    return { titre: T.titreAccepte, texte: T.accepte(zone), pastille: pastilleNumero };
  }
  if (candidature?.statut === "en-attente") {
    if (!candidature.commune) return { titre: T.titreCandidature, texte: T.preciser, pastille: T.aCompleter };
    return { titre: T.titreCandidature, texte: T.arrivee(zone?.nom ?? candidature.commune.nom), pastille: T.aLEtude };
  }
  if (candidature?.statut === "refusee") return { titre: T.titreCandidature, texte: T.refusee, pastille: null };

  // Pas de candidature en cours (ou un titre gardé en souvenir) : les places de sa ville, sinon de toute la France
  const souvenir = candidature?.statut === "souvenir" ? T.souvenir(numero, zone) : "";
  if (zoneVille) {
    const complet = zoneVille.libres === 0;
    const suite = complet ? T.rouvrira : T.tenteTaChance;
    return { titre: souvenir ? T.titreSouvenir : T.titreDevenir, texte: `${souvenir}${decrirePlacesZone(zoneVille, langue)}.${suite}`, pastille: complet ? T.complet : pastilleNumero };
  }
  const places = placesRestantes === null ? "" : T.placesEnFrance(placesRestantes);
  return { titre: souvenir ? T.titreSouvenir : T.titreDevenir, texte: `${souvenir}${T.partout}${places}${T.tenteTaChance}`, pastille: pastilleNumero };
}

/** Ce que dit la tuile « ambassadeur certifié », selon le titre et la dernière candidature. */
function decrireCertification(certifie: CertificationAmbassadeur | null, statut: CandidatureCertification["statut"] | null | undefined, textes: TextesEspace) {
  const T = textes.certification;
  if (certifie) return { texte: T.certifie, pastille: T.pastilleCertifie };
  if (statut === "en-attente") return { texte: T.enAttente, pastille: textes.fondateur.aLEtude };
  if (statut === "refusee") return { texte: T.refusee, pastille: null };
  return { texte: T.aucune, pastille: null };
}

/** Page /espace : selon le statut, l'attente, le refus, la suspension, ou tout l'espace d'un ambassadeur validé. */
export default function PageEspace({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE);
  const langue = utiliserLangue();
  const { profil, email, actif } = loaderData;
  const bandeau = email.verifie ? null : <BandeauVerificationEmail justeInscrit={email.justeInscrit} />;

  if (!actif) {
    return (
      <Section fond="creme" etroit>
        {bandeau}
        <StatutAmbassadeur prenom={profil.prenom} ambassadeur={profil.ambassadeur} />
        {profil.ambassadeur?.statut !== "refuse" && (
          <p className="mt-8 text-center text-gris">
            <Link to="/espace/mon-compte" className={classeLien}>{T.monCompte}</Link>
            {lierPonctuation(T.monCompteSuite)}
          </p>
        )}
      </Section>
    );
  }

  const fondateur = decrireCandidature(actif.candidature, actif.placesRestantes, actif.zoneVille, T.fondateur, langue);
  const certification = decrireCertification(profil.certifie, actif.statutCertification, T);
  return (
    <Section fond="creme">
      {bandeau}
      <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight">{lierPonctuation(T.salut(profil.prenom))}</h1>
      <p className="mt-2 mb-10 max-w-xl text-lg text-gris">{lierPonctuation(T.bienvenue)}</p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <CartePalier palier={profil.palier} points={profil.points} badges={profil.badges} certifie={profil.certifie} />
        <nav aria-label={T.navigation}>
          <ul className="grid gap-4 sm:grid-cols-2">
            <TuileEspace vers="/espace/kit-media" emoji="🎨" titre={T.tuiles.kitMedia.titre} texte={T.tuiles.kitMedia.texte} />
            <TuileEspace vers="/espace/proposer-un-lieu" emoji="🔎" titre={T.tuiles.proposer.titre} texte={lierPonctuation(T.tuiles.proposer.texte)} />
            <TuileEspace vers="/espace/fondateur" emoji="🎖️" titre={fondateur.titre} texte={lierPonctuation(fondateur.texte)} pastille={fondateur.pastille} />
            <TuileEspace
              vers="/espace/certification"
              emoji="✅"
              titre={T.tuiles.certifie.titre}
              texte={lierPonctuation(certification.texte)}
              pastille={certification.pastille}
            />
            {profil.certifie && (
              <TuileEspace vers="/espace/kit-media-pro" emoji="🧰" titre={T.tuiles.kitMediaPro.titre} texte={T.tuiles.kitMediaPro.texte} />
            )}
            <TuileEspace
              vers="/espace/missions"
              emoji="📋"
              titre={T.tuiles.missions.titre}
              texte={T.tuiles.missions.texte}
              pastille={actif.missionsAFaire ? T.aFaire(actif.missionsAFaire) : null}
            />
            <TuileEspace
              vers="/espace/messages"
              emoji="💌"
              titre={T.tuiles.messages.titre}
              texte={T.tuiles.messages.texte}
              pastille={actif.messagesNonLus ? T.nonLus(actif.messagesNonLus) : null}
            />
            <TuileEspace vers="/espace/mon-compte" emoji="⚙️" titre={T.tuiles.compte.titre} texte={T.tuiles.compte.texte} />
          </ul>
        </nav>
      </div>

      <section aria-labelledby="mes-propositions" className="mt-12">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="mes-propositions" className="text-2xl font-extrabold">{T.mesPropositions}</h2>
          <Link to="/espace/proposer-un-lieu" className={classeLien}>{T.proposerUnLieu}</Link>
        </div>
        <ListePropositions propositions={actif.propositions} />
      </section>
    </Section>
  );
}
