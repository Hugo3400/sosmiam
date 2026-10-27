import { useEffect, useRef } from "react";
import { Link } from "react-router";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { PlacesZone } from "~/composants/fondateurs/PlacesZone";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE } from "~/contenus/candidature-fondateur";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
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
 * numéros de la carte), gardée en souvenir après un déménagement, ou non retenue (on peut alors recandidater tout de suite).
 */
export function EtatCandidature({ candidature, vientDArriver = false, communeChangee = false }: Props) {
  const T = utiliserTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE).etat;
  const ruban = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).fondateurs.ruban;
  const titre = useRef<HTMLHeadingElement>(null);
  // Après une recandidature, la réponse peut arriver avant la candidature relue (encore « refusée ») : le focus suit le statut
  useEffect(() => {
    if (vientDArriver || communeChangee) titre.current?.focus();
  }, [vientDArriver, communeChangee, candidature.statut]);
  const { zone, commune } = candidature;

  if (candidature.statut === "acceptee" || candidature.statut === "souvenir") {
    const souvenir = candidature.statut === "souvenir";
    const numero = T.numero(candidature);
    const sujet = encodeURIComponent(T.sujetDemenagement);
    return (
      <div className={`rounded-carte border-2 border-encre px-6 py-10 text-center md:px-12 ${souvenir ? "bg-white shadow-brut" : "bg-jaune shadow-brut-grand"}`}>
        <Ecusson ruban={ruban} className="mx-auto mb-5 h-28 w-28 -rotate-6" />
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">
          {souvenir
            ? lierPonctuation(T.souvenir(candidature.numeroLocal, zone))
            : lierPonctuation(T.accepte(zone))}
        </h2>
        <p className="mx-auto mt-4 inline-block rounded-full border-2 border-encre bg-white px-5 py-2 font-titre text-lg font-extrabold">{numero}</p>
        {souvenir ? (
          <p className="mx-auto mt-4 max-w-lg text-lg">
            {lierPonctuation(T.texteSouvenir)}
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-lg text-lg">
            {lierPonctuation(T.demenage)}
            <a href={`mailto:${site.emailContact}?subject=${sujet}`} className={classeLien}>{T.ecrisNous}</a>
            {lierPonctuation(T.suiteDemenage)}
          </p>
        )}
      </div>
    );
  }

  if (candidature.statut === "refusee") {
    return (
      <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 shadow-brut md:px-12">
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{T.titreRefus}</h2>
        <p className="mt-3 max-w-xl text-lg">
          {lierPonctuation(T.refus)}
        </p>
        {/* Le ménage de nuit (3 h 30, heure de Paris) efface après l'échéance : « au plus tard », avec un jour de marge */}
        {candidature.reponduLe && (
          <p className="mt-3 max-w-xl text-gris">
            {T.effaceeDebut}<DateEnLettres iso={candidature.reponduLe} plusMois={3} plusJours={1} />{T.effaceeFin}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
      <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">
        {communeChangee ? lierPonctuation(T.note) : T.arrivee}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {T.envoyeeLe}<DateEnLettres iso={candidature.creeLe} />. {lierPonctuation(T.lue)}
      </p>
      {commune && zone && (
        <div className="mx-auto mt-6 max-w-md text-left">
          <PlacesZone commune={commune} zone={zone} />
          <p className="mt-4 text-center">
            {lierPonctuation(T.pasLaBonne)}
            <Link to="/espace/fondateur?changer=1" className={classeLien}>{T.changer}</Link>
          </p>
        </div>
      )}
    </div>
  );
}
