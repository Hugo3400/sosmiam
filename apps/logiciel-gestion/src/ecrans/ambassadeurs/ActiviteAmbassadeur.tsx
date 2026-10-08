import { MessageSquarePlus, Target } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { ETATS_MISSION } from "~/contenus/ambassadeurs.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { FicheAmbassadeur } from "~/services/ambassadeurs.ts";

const STATUTS_DEMANDE: Record<string, string> = { "a-traiter": "à traiter", acceptee: "acceptée", refusee: "refusée" };

type Props = { fiche: FicheAmbassadeur; onConfierMission: () => void; onEcrire: () => void };

/** Ce que l'ambassadeur fait : ses missions, les lieux qu'il a proposés, les messages que tu lui as envoyés. */
export function ActiviteAmbassadeur({ fiche, onConfierMission, onEcrire }: Props) {
  const actif = fiche.ambassadeur?.statut === "actif";
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex-1 font-extrabold">Activité</h3>
        <Bouton petit icone={Target} desactive={!actif} titre={actif ? undefined : "Seulement pour un ambassadeur actif"} onClick={onConfierMission}>Confier une mission</Bouton>
        <Bouton petit icone={MessageSquarePlus} onClick={onEcrire}>Lui écrire</Bouton>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold">Missions ({fiche.missions.length})</p>
          {fiche.missions.length === 0 ? <p className="text-sm text-gris">Aucune pour l'instant.</p> : (
            <ul className="grid gap-2 text-sm">
              {fiche.missions.map((mission) => (
                <li key={mission.id}>
                  <span className="font-semibold">{mission.titre}</span> <Badge ton={ETATS_MISSION[mission.statut].ton}>{ETATS_MISSION[mission.statut].libelle}</Badge>
                  {mission.echeance && mission.statut === "a-faire" && <span className="block text-gris">Pour le {formaterDate(mission.echeance)}</span>}
                  {mission.compteRendu && <span className="block whitespace-pre-line text-gris">« {mission.compteRendu} »</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold">Lieux proposés ({fiche.demandesLieux.length})</p>
          {fiche.demandesLieux.length === 0 ? <p className="text-sm text-gris">Pas encore de pépite proposée.</p> : (
            <ul className="grid gap-1 text-sm">
              {fiche.demandesLieux.map((demande) => (
                <li key={demande.id}>
                  <span className="font-semibold">{demande.nom}</span> <span className="text-gris">· {demande.ville} · {STATUTS_DEMANDE[demande.statut] ?? demande.statut}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold">Messages perso ({fiche.messages.length})</p>
          {fiche.messages.length === 0 ? <p className="text-sm text-gris">Seulement les messages à tous, pour l'instant.</p> : (
            <ul className="grid gap-1 text-sm">
              {fiche.messages.map((message) => (
                <li key={message.id}><span className="font-semibold">{message.titre}</span> <span className="text-gris">· {formaterDate(message.creeLe)}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
