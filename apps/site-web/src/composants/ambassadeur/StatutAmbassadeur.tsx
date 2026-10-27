import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE } from "~/contenus/espace-ambassadeur";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CompteConnecte } from "~/types/compte";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";
const lienContact = <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>;

type Props = { prenom: string; ambassadeur: CompteConnecte["ambassadeur"] };

/**
 * L'espace d'un compte qui n'est pas (ou plus) ambassadeur validé : en attente de l'équipe, refusé (rôle retiré 30 jours
 * après la décision, le compte reste), suspendu, ou compte sans demande d'ambassadeur.
 */
export function StatutAmbassadeur({ prenom, ambassadeur }: Props) {
  const T = utiliserTextes(TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE).statut;
  const lien = utiliserLienLangue();
  if (ambassadeur?.statut === "en-attente") {
    return (
      <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation(T.merci(prenom))}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg">
          {lierPonctuation(T.attente)}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-lg">{lierPonctuation(T.repasse)}</p>
        <Bouton vers={lien("/programme")} variante="encre" className="mt-6">{T.relire}</Bouton>
      </div>
    );
  }

  // 30 jours après le refus, seul le rôle d'ambassadeur part : le compte reste, il sert aussi à l'app (compte unique,
  // décision du 8 octobre 2026 ; ménage de l'API, services/menage-comptes.ts).
  // Le ménage passe chaque nuit à 3 h 30, heure de Paris (apps/api/src/taches/taches-de-nuit.ts) : une échéance tombée
  // après 3 h 30 est effacée la nuit suivante, d'où le jour de plus et « au plus tard ».
  if (ambassadeur?.statut === "refuse") {
    return (
      <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{T.titreRefus}</h1>
        <p className="mt-4 max-w-xl text-lg">
          {lierPonctuation(T.refus(prenom))}
        </p>
        {ambassadeur.decideLe && (
          <p className="mt-3 max-w-xl text-lg">
            {T.retireeDebut}<strong><DateEnLettres iso={ambassadeur.decideLe} plusJours={31} /></strong>{T.retireeFin}
            {/* L'espace au début de la phrase suivante, dans la même chaîne : seule, Chrome la perdrait pour les lecteurs d'écran */}
            {lierPonctuation(T.effacer)}
          </p>
        )}
        <p className="mt-3 max-w-xl text-gris">{lierPonctuation(T.suivre)}</p>
        <Bouton vers="/espace/mon-compte" className="mt-6">{T.allerMonCompte}</Bouton>
      </div>
    );
  }

  if (ambassadeur?.statut === "suspendu") {
    return (
      <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{T.titreSuspendu}</h1>
        <p className="mt-4 max-w-xl text-lg">{T.suspendu}{lienContact}.</p>
      </div>
    );
  }

  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation(T.bonjour(prenom))}</h1>
      <p className="mt-4 max-w-xl text-lg">
        {T.sansRole}{lienContact}.
      </p>
    </div>
  );
}
