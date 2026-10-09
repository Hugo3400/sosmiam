import { useEffect, useRef } from "react";
import { Link } from "react-router";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { PlacesZone } from "~/composants/fondateurs/PlacesZone";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Mascotte } from "~/composants/marque/Mascotte";
import { site } from "~/contenus/legal/informations-legales";
import { ecrireNumeroFondateur } from "~/fonctions/fondateurs/ecrire-numero-fondateur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CandidatureFondateur } from "~/types/compte";

type Props = {
  candidature: CandidatureFondateur;
  /** Vrai juste après l'envoi (ou un changement de commune) : le focus passe au titre, que les lecteurs d'écran lisent aussitôt */
  vientDArriver?: boolean;
  /** Vrai juste après avoir précisé ou changé la commune */
  communeChangee?: boolean;
};

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Où en est la candidature « fondateur » : à l'étude (pour quelle commune, qu'on peut encore changer), acceptée (avec les
 * numéros de la carte), gardée en souvenir après un déménagement, ou non retenue.
 */
export function EtatCandidature({ candidature, vientDArriver = false, communeChangee = false }: Props) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (vientDArriver || communeChangee) titre.current?.focus();
  }, [vientDArriver, communeChangee]);
  const { zone, commune } = candidature;

  if (candidature.statut === "acceptee" || candidature.statut === "souvenir") {
    const souvenir = candidature.statut === "souvenir";
    const numero = ecrireNumeroFondateur(candidature);
    const lieu = zone ? ` ${zone.nomAvecDe}` : "";
    const sujet = encodeURIComponent("Je déménage (fondateur SOS Miam)");
    return (
      <div className={`rounded-carte border-2 border-encre px-6 py-10 text-center md:px-12 ${souvenir ? "bg-white shadow-brut" : "bg-jaune shadow-brut-grand"}`}>
        <Ecusson ruban="FONDATEUR" className="mx-auto mb-5 h-28 w-28 -rotate-6" />
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">
          {souvenir
            ? lierPonctuation(`Tu as été fondateur${candidature.numeroLocal ? ` n° ${candidature.numeroLocal}` : ""}${lieu}`)
            : lierPonctuation(`Tu fais partie des fondateurs${lieu} !`)}
        </h2>
        <p className="mx-auto mt-4 inline-block rounded-full border-2 border-encre bg-white px-5 py-2 font-titre text-lg font-extrabold">{numero}</p>
        {souvenir ? (
          <p className="mx-auto mt-4 max-w-lg text-lg">
            {lierPonctuation("Ta place s'est libérée pour quelqu'un d'autre, mais ton titre et ton numéro restent à toi. Tu as une nouvelle ville ? Tu peux y candidater juste en dessous.")}
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-lg text-lg">
            {lierPonctuation("Tu déménages ? ")}
            <a href={`mailto:${site.emailContact}?subject=${sujet}`} className={classeLien}>Écris-nous</a>
            {lierPonctuation(" : ta place se libère, tu gardes ton titre en souvenir.")}
          </p>
        )}
      </div>
    );
  }

  if (candidature.statut === "refusee") {
    return (
      <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">Ta candidature n'a pas été retenue</h2>
        <p className="mt-3 max-w-xl text-lg">
          {lierPonctuation("Merci d'avoir tenté ta chance ! Les places de fondateur sont très peu nombreuses. Tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde.")}
        </p>
        {/* Le ménage de nuit (3 h 30, heure de Paris) efface après l'échéance : « au plus tard », avec un jour de marge */}
        {candidature.reponduLe && (
          <p className="mt-3 max-w-xl text-gris">
            Ta candidature sera effacée trois mois après la réponse, au plus tard le <DateEnLettres iso={candidature.reponduLe} plusMois={3} plusJours={1} />.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
      <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">
        {communeChangee ? lierPonctuation("C'est noté !") : "Ta candidature est bien arrivée"}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        Envoyée le <DateEnLettres iso={candidature.creeLe} />. {lierPonctuation("L'équipe la lit avec attention : tu verras sa réponse ici.")}
      </p>
      {commune && zone && (
        <div className="mx-auto mt-6 max-w-md text-left">
          <PlacesZone commune={commune} zone={zone} />
          <p className="mt-4 text-center">
            {lierPonctuation("Pas la bonne commune ? ")}
            <Link to="/espace/fondateur?changer=1" className={classeLien}>Changer de commune</Link>
          </p>
        </div>
      )}
    </div>
  );
}
