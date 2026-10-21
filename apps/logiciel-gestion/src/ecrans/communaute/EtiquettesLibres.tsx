import { Tag, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerEtiquettesLibres, retirerEtiquetteLibre, retirerSortieMiamis } from "~/services/communaute.ts";

export function EtiquettesLibres({ onChange }: { onChange: (message: string) => void }) {
  const [retirees, setRetirees] = useState(false);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerEtiquettesLibres(retirees), [retirees]);
  const apres = (message: string) => () => (recharger(), onChange(message));
  const echec = () => recharger();

  return (
    <div className="grid gap-4">
      <CaseACocher libelle="Montrer aussi les étiquettes déjà retirées" coche={retirees} onChange={setRetirees} />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <Carte titre={`Étiquettes libres (${donnees.etiquettes.length})`} sansMarge>
          {donnees.etiquettes.length === 0 ? (
            <EtatVide emoji="🏷️" titre="Aucune étiquette libre">Les étiquettes écrites par les organisateurs de sorties des Miamis arrivent ici.</EtatVide>
          ) : (
            <ul>
              {donnees.etiquettes.map((e) => (
                <li key={`${e.sortieId}-${e.nom}`} className="flex flex-wrap items-center gap-3 border-b border-ligne/70 px-5 py-2.5 text-sm last:border-0">
                  <span className="font-semibold">#{e.nom}</span>
                  {e.retireeLe && <Badge ton="rouge">Retirée</Badge>}
                  <span className="min-w-0 flex-1 truncate text-gris">« {e.titreSortie} » · {formaterDate(e.quand, true)} · sortie n° {e.sortieId}</span>
                  {!e.retireeLe && <Bouton petit icone={Tag} onClick={() => retirerEtiquetteLibre(e.sortieId, e.nom).then(apres("Étiquette retirée"), echec)}>Retirer l'étiquette</Bouton>}
                  <Bouton petit variante="danger" icone={Trash2} onClick={() => window.confirm(`Retirer la sortie « ${e.titreSortie} » pour tout le monde ?`) && retirerSortieMiamis(e.sortieId).then(apres("Sortie des Miamis retirée"), echec)}>
                    Retirer la sortie
                  </Bouton>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}
    </div>
  );
}
