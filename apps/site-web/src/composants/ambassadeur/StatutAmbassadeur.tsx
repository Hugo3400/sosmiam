import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CompteConnecte } from "~/types/compte";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";
const lienContact = <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>;

type Props = { prenom: string; ambassadeur: CompteConnecte["ambassadeur"] };

/**
 * L'espace d'un compte qui n'est pas (ou plus) ambassadeur validé : en attente de l'équipe, refusé (rôle retiré 30 jours
 * après la décision, le compte reste), suspendu, ou compte sans demande d'ambassadeur.
 */
export function StatutAmbassadeur({ prenom, ambassadeur }: Props) {
  if (ambassadeur?.statut === "en-attente") {
    return (
      <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation(`Merci, ${prenom} !`)}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg">
          {lierPonctuation("Ton compte est bien créé. L'équipe regarde chaque inscription à la main : dès que la tienne est validée, ton espace s'ouvre ici, avec le kit média, les lieux à proposer et tout le reste.")}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-lg">{lierPonctuation("Repasse de temps en temps. En attendant, tu peux relire le programme :")}</p>
        <Bouton vers="/programme" variante="encre" className="mt-6">Relire le programme</Bouton>
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
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">Ta demande n'a pas été retenue</h1>
        <p className="mt-4 max-w-xl text-lg">
          {lierPonctuation(`Merci d'avoir proposé ton aide, ${prenom}. Cette fois, l'équipe n'a pas retenu ta demande pour le programme Ambassadeurs.`)}
        </p>
        {ambassadeur.decideLe && (
          <p className="mt-3 max-w-xl text-lg">
            Ta demande sera retirée au plus tard le <strong><DateEnLettres iso={ambassadeur.decideLe} plusJours={31} /></strong> ; ton compte SOS Miam, lui, reste pour l'app.
            {/* L'espace au début de la phrase suivante, dans la même chaîne : seule, Chrome la perdrait pour les lecteurs d'écran */}
            {lierPonctuation(" Tu peux aussi effacer ton compte tout de suite depuis « Mon compte ».")}
          </p>
        )}
        <p className="mt-3 max-w-xl text-gris">{lierPonctuation("Tu peux toujours suivre l'aventure sur sosmiam.fr.")}</p>
        <Bouton vers="/espace/mon-compte" className="mt-6">Aller dans Mon compte</Bouton>
      </div>
    );
  }

  if (ambassadeur?.statut === "suspendu") {
    return (
      <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">Ton compte est suspendu</h1>
        <p className="mt-4 max-w-xl text-lg">Ton espace ambassadeur est en pause pour le moment. Pour en parler, écris-nous à {lienContact}.</p>
      </div>
    );
  }

  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation(`Bonjour, ${prenom} !`)}</h1>
      <p className="mt-4 max-w-xl text-lg">
        Ton compte n'est pas inscrit au programme Ambassadeurs. Pour le rejoindre, écris-nous à {lienContact}.
      </p>
    </div>
  );
}
