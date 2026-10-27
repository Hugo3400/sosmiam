import { useEffect, useRef } from "react";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Bouton } from "~/composants/interface/Bouton";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE } from "~/contenus/ambassadeur-certifie";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CandidatureCertification, CertificationAmbassadeur } from "~/types/compte";

type Props = {
  certifie: CertificationAmbassadeur | null;
  candidature: CandidatureCertification | null;
  /** Vrai juste après l'envoi : le focus passe au titre, que les lecteurs d'écran lisent aussitôt */
  vientDArriver?: boolean;
};

const carte = "rounded-carte border-2 border-encre px-6 py-10 md:px-12";

/**
 * Où en est l'ambassadeur certifié : titre obtenu (depuis quand, pour quelle structure, et le kit média pro), candidature
 * à l'étude (avec ce qui a été envoyé), non retenue (on peut recandidater tout de suite), ou titre retiré. Rien sinon.
 */
export function EtatCertification({ certifie, candidature, vientDArriver = false }: Props) {
  const textes = utiliserTextes(TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE);
  const T = textes.etat;
  const programme = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).certifie;
  const titre = useRef<HTMLHeadingElement>(null);
  // La réponse de l'envoi peut arriver avant la candidature relue : le focus attend que le titre de l'état soit là
  const etat = certifie ? "certifie" : (candidature?.statut ?? "aucune");
  useEffect(() => {
    if (vientDArriver) titre.current?.focus();
  }, [vientDArriver, etat]);

  if (certifie) {
    const profil = certifie.profil ? textes.profils[certifie.profil] : undefined;
    return (
      <div className={`${carte} bg-jaune text-center shadow-brut-grand`}>
        <Ecusson ruban={programme.ruban} className="mx-auto mb-5 h-28 w-28 -rotate-6" />
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.certifie)}</h2>
        <p className="mx-auto mt-3 max-w-lg text-lg">
          {T.depuis}<DateEnLettres iso={certifie.depuis} />
          {certifie.structure ? <>{T.pour}<strong>{certifie.structure}</strong>.</> : "."}
        </p>
        {profil && <p className="mt-1 text-encre/80">{profil}</p>}
        <p className="mx-auto mt-5 max-w-lg">
          {lierPonctuation(T.texteCertifie)}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Bouton vers="/espace/kit-media-pro" variante="blanc">{T.monKitPro}</Bouton>
          <Bouton vers="/espace/missions" variante="blanc">{T.mesMissions}</Bouton>
        </div>
        <p className="mx-auto mt-7 max-w-lg text-sm">{lierPonctuation(programme.regle)}</p>
      </div>
    );
  }

  if (candidature?.statut === "en-attente") {
    const profil = textes.profils[candidature.profil];
    const envies = (Object.keys(textes.envies) as (keyof typeof textes.envies)[]).filter((envie) => candidature.envies.includes(envie)).map((envie) => textes.envies[envie]);
    const lignes = [
      { terme: T.termes.profil, valeur: profil },
      { terme: T.termes.structure, valeur: candidature.structure },
      { terme: T.termes.ville, valeur: candidature.commune ? `${candidature.commune.nom} (${candidature.commune.nomDepartement})` : null },
      { terme: T.termes.envies, valeur: envies.join(", ") },
    ].filter((ligne) => ligne.valeur);
    return (
      <div className={`${carte} bg-white shadow-brut`}>
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
        <h2 ref={titre} tabIndex={-1} className="text-center text-3xl font-extrabold">{lierPonctuation(T.arrivee)}</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-lg">
          {T.envoyeeLe}<DateEnLettres iso={candidature.creeLe} />. {lierPonctuation(T.lue)}
        </p>
        <dl className="mx-auto mt-6 grid max-w-lg gap-3 rounded-2xl bg-creme p-5">
          {lignes.map((ligne) => (
            <div key={ligne.terme}>
              <dt className="text-sm font-semibold text-gris">{ligne.terme}</dt>
              <dd className="font-medium break-words">{lierPonctuation(ligne.valeur ?? "")}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (candidature?.statut === "refusee") {
    return (
      <div className={`${carte} bg-white shadow-brut`}>
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.titreRefus)}</h2>
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

  if (candidature?.statut === "acceptee") {
    // Acceptée, mais sans titre aujourd'hui : l'équipe l'a retiré
    return (
      <div className={`${carte} bg-white shadow-brut`}>
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.titreRetire)}</h2>
        <p className="mt-3 max-w-xl text-lg">
          {lierPonctuation(T.retire)}
        </p>
      </div>
    );
  }

  return null;
}
