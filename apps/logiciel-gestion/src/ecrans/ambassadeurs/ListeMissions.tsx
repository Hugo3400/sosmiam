import { Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { ETATS_MISSION } from "~/contenus/ambassadeurs.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { changerStatutMission, listerMissions, supprimerMission, type Mission } from "~/services/ambassadeurs.ts";
import { ModaleMission } from "./ModaleMission.tsx";

/** Les missions confiées aux ambassadeurs : à faire (les plus urgentes d'abord), faites avec leur compte rendu, annulées. */
export function ListeMissions({ onOuvrirCompte, tour }: { onOuvrirCompte: (compteId: number) => void; tour: number }) {
  const [statut, setStatut] = useState<Mission["statut"]>("a-faire");
  const [creation, setCreation] = useState(false);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerMissions(statut), [statut, tour]);
  const maintenant = Date.now();
  const agir = (action: Promise<unknown>) => void action.then(recharger, recharger);

  return (
    <Carte
      sansMarge
      titre="Missions"
      actions={<Bouton petit variante="principal" icone={Plus} onClick={() => setCreation(true)}>Confier une mission</Bouton>}
    >
      <div className="border-b border-ligne px-5 py-4">
        <Onglets
          libelle="Missions"
          valeur={statut}
          onChange={setStatut}
          options={[{ valeur: "a-faire", libelle: "À faire" }, { valeur: "faite", libelle: "Faites" }, { valeur: "annulee", libelle: "Annulées" }]}
        />
      </div>
      <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && (
        <EtatVide emoji="🎯" titre={statut === "a-faire" ? "Aucune mission en cours" : "Rien ici pour l'instant"}>
          Une mission, c'est un coup de main précis : goûter un nouveau lieu, aller rencontrer un patron, photographier une devanture…
        </EtatVide>
      )}
      {donnees && donnees.length > 0 && (
        <ul>
          {donnees.map((mission) => {
            const enRetard = mission.statut === "a-faire" && mission.echeance && new Date(mission.echeance).getTime() < maintenant;
            return (
              <li key={mission.id} className="grid gap-1 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{mission.titre}</span>
                  <Badge ton={ETATS_MISSION[mission.statut].ton}>{ETATS_MISSION[mission.statut].libelle}</Badge>
                  {enRetard && <Badge ton="rouge">En retard</Badge>}
                  <span className="ml-auto flex gap-1">
                    {mission.statut === "a-faire" && <Bouton petit variante="discret" icone={X} onClick={() => agir(changerStatutMission(mission.id, "annulee"))}>Annuler</Bouton>}
                    {mission.statut === "annulee" && <Bouton petit variante="discret" icone={RotateCcw} onClick={() => agir(changerStatutMission(mission.id, "a-faire"))}>Remettre à faire</Bouton>}
                    <Bouton
                      petit
                      variante="discret"
                      icone={Trash2}
                      titre="Supprimer la mission"
                      onClick={() => window.confirm(`Supprimer la mission « ${mission.titre} » ? Elle disparaît aussi de son espace.`) && agir(supprimerMission(mission.id))}
                    />
                  </span>
                </div>
                <p className="text-gris">
                  {mission.compte && (
                    <button type="button" className="font-semibold text-encre hover:underline" onClick={() => onOuvrirCompte(mission.compte!.id)}>
                      {mission.compte.prenom}
                    </button>
                  )}
                  {mission.compte?.ambassadeur && ` · ${mission.compte.ambassadeur.ville}`}
                  {mission.lieu && ` · ${mission.lieu.emoji} ${mission.lieu.nom}`}
                  {` · confiée le ${formaterDate(mission.creeLe)}`}
                  {mission.echeance && mission.statut === "a-faire" && ` · pour le ${formaterDate(mission.echeance)}`}
                  {mission.faiteLe && ` · faite le ${formaterDate(mission.faiteLe)}`}
                </p>
                {mission.detail && <p className="whitespace-pre-line">{mission.detail}</p>}
                {mission.compteRendu && <p className="rounded-xl bg-creme px-3 py-2 whitespace-pre-line">💬 {mission.compteRendu}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {creation && <ModaleMission onFermer={() => setCreation(false)} onCreee={() => { setCreation(false); setStatut("a-faire"); recharger(); }} />}
    </Carte>
  );
}
