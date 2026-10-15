import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { formaterDelaiMinutes } from "~/fonctions/texte/formater-delai-minutes.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireReservations, type PeriodeReservations } from "~/services/reservations.ts";
import { TableauReservations } from "./TableauReservations.tsx";

type Props = { ouvrirLieu: (id: number) => void };

/**
 * Les réservations faites dans l'app, lieu par lieu : qui répond, en combien de temps, ce qui est refusé et les absences.
 * Pour repérer un lieu qui laisse ses demandes sans réponse (et l'appeler, ou couper ses réservations). Jamais un client.
 */
export function EcranReservations({ ouvrirLieu }: Props) {
  const [jours, setJours] = useState<PeriodeReservations>(30);
  const [ville, setVille] = useState("");
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireReservations(jours, ville.trim()), [jours, ville]);
  const t = donnees?.totaux;
  return (
    <>
      <EnTeteEcran
        titre="Réservations"
        sousTitre="Lieu par lieu : les demandes reçues, la réponse, les refus et les absences. Des nombres seulement, jamais le nom d'un client."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Onglets
          libelle="Période"
          valeur={String(jours)}
          onChange={(v) => setJours(Number(v) as PeriodeReservations)}
          options={[{ valeur: "30", libelle: "30 jours" }, { valeur: "90", libelle: "90 jours" }, { valeur: "365", libelle: "1 an" }]}
        />
        <Champ libelle="Ville" valeur={ville} onChange={setVille} placeholder="Toutes" className="w-48" />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {t && (
        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-5">
          <TuileChiffre libelle="Demandes" valeur={t.demandes} detail={`dans ${t.lieux} lieu(x)`} />
          <TuileChiffre libelle="En attente" valeur={t.enAttente} detail="le lieu peut encore répondre" />
          <TuileChiffre libelle="Taux de réponse" valeur={t.tauxReponse === null ? "—" : `${Math.round(t.tauxReponse * 100)} %`} detail={`réponse en ${formaterDelaiMinutes(t.reponseMedianeMin)} (médiane)`} />
          <TuileChiffre libelle="Absents" valeur={t.absents} detail={`sur ${t.honorees + t.absents} réservation(s) acceptée(s) et passée(s)`} />
          <TuileChiffre libelle="Lieux qui ne répondent pas" valeur={t.lieuxQuiRepondentPas} detail="au moins 3 demandes laissées sans réponse" accent={t.lieuxQuiRepondentPas > 0} />
        </div>
      )}
      {donnees && (
        <Carte titre="Lieu par lieu" sansMarge>
          {donnees.lieux.length === 0
            ? <EtatVide emoji="📅" titre="Pas de réservation sur cette période">Les réservations apparaissent ici dès qu'un Miami en demande une dans l'app.</EtatVide>
            : <TableauReservations lieux={donnees.lieux} ouvrirLieu={ouvrirLieu} />}
        </Carte>
      )}
    </>
  );
}
