import { useEffect, useRef } from "react";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Bouton } from "~/composants/interface/Bouton";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Mascotte } from "~/composants/marque/Mascotte";
import { enviesCertification, profilsCertifie } from "~/contenus/ambassadeur-certifie";
import { certifieProgramme } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
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
  const titre = useRef<HTMLHeadingElement>(null);
  // La réponse de l'envoi peut arriver avant la candidature relue : le focus attend que le titre de l'état soit là
  const etat = certifie ? "certifie" : (candidature?.statut ?? "aucune");
  useEffect(() => {
    if (vientDArriver) titre.current?.focus();
  }, [vientDArriver, etat]);

  if (certifie) {
    const profil = profilsCertifie.find((p) => p.valeur === certifie.profil);
    return (
      <div className={`${carte} bg-jaune text-center shadow-brut-grand`}>
        <Ecusson ruban="CERTIFIÉ" className="mx-auto mb-5 h-28 w-28 -rotate-6" />
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("Tu es ambassadeur certifié ✓")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-lg">
          Depuis le <DateEnLettres iso={certifie.depuis} />
          {certifie.structure ? <>, pour <strong>{certifie.structure}</strong>.</> : "."}
        </p>
        {profil && <p className="mt-1 text-encre/80">{profil.libelle}</p>}
        <p className="mx-auto mt-5 max-w-lg">
          {lierPonctuation("Ton badge s'affiche sur les fiches des lieux que tu aides. L'équipe te confie des missions chez les lieux partenaires : elles arrivent dans « Mes missions ».")}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Bouton vers="/espace/kit-media-pro" variante="blanc">Mon kit média pro</Bouton>
          <Bouton vers="/espace/missions" variante="blanc">Mes missions</Bouton>
        </div>
        <p className="mx-auto mt-7 max-w-lg text-sm">{lierPonctuation(certifieProgramme.regle)}</p>
      </div>
    );
  }

  if (candidature?.statut === "en-attente") {
    const profil = profilsCertifie.find((p) => p.valeur === candidature.profil);
    const envies = enviesCertification.filter((e) => candidature.envies.includes(e.valeur)).map((e) => e.libelle);
    const lignes = [
      { terme: "Tu es plutôt", valeur: profil?.libelle },
      { terme: "Ta structure ou ton lieu", valeur: candidature.structure },
      { terme: "Ta ville", valeur: candidature.commune ? `${candidature.commune.nom} (${candidature.commune.nomDepartement})` : null },
      { terme: "Ce que tu aimerais faire", valeur: envies.join(", ") },
    ].filter((ligne) => ligne.valeur);
    return (
      <div className={`${carte} bg-white shadow-brut`}>
        <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
        <h2 ref={titre} tabIndex={-1} className="text-center text-3xl font-extrabold">{lierPonctuation("Ta candidature est arrivée !")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-lg">
          Envoyée le <DateEnLettres iso={candidature.creeLe} />. {lierPonctuation("L'équipe la lit avec attention : tu verras sa réponse ici.")}
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
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("Ta candidature n'a pas été retenue, cette fois")}</h2>
        <p className="mt-3 max-w-xl text-lg">
          {lierPonctuation("Merci d'avoir proposé ton aide ! Tu restes ambassadeur, comme avant. Et tu peux recandidater tout de suite, juste en dessous : par exemple quand tu auras aidé un ou deux lieux de plus.")}
        </p>
        {/* Le ménage de nuit (3 h 30, heure de Paris) efface après l'échéance : « au plus tard », avec un jour de marge */}
        {candidature.reponduLe && (
          <p className="mt-3 max-w-xl text-gris">
            Cette candidature sera effacée trois mois après la réponse, au plus tard le <DateEnLettres iso={candidature.reponduLe} plusMois={3} plusJours={1} />.
          </p>
        )}
      </div>
    );
  }

  if (candidature?.statut === "acceptee") {
    // Acceptée, mais sans titre aujourd'hui : l'équipe l'a retiré
    return (
      <div className={`${carte} bg-white shadow-brut`}>
        <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("Ton titre d'ambassadeur certifié n'est plus actif")}</h2>
        <p className="mt-3 max-w-xl text-lg">
          {lierPonctuation("Tu restes ambassadeur, avec ton niveau et tes badges. Si tu veux de nouveau aider les lieux comme certifié, tu peux recandidater juste en dessous.")}
        </p>
      </div>
    );
  }

  return null;
}
