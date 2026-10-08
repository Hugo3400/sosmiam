import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireJournal } from "~/services/journal.ts";

/** Tout ce qui a été fait depuis le logiciel : quand, depuis quel poste, quoi. */
export function JournalGestion() {
  const [page, setPage] = useState(1);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireJournal(page), [page]);
  return (
    <Carte titre="Journal de gestion" sansMarge>
      <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.entrees.length === 0 && <p className="p-5 text-sm text-gris">Rien encore.</p>}
      {donnees && donnees.entrees.length > 0 && (
        <>
          <table className="w-full text-sm">
            <tbody>
              {donnees.entrees.map((entree) => (
                <tr key={entree.id} className="border-b border-ligne/70 last:border-0">
                  <td className="chiffres px-5 py-2 whitespace-nowrap text-gris">{formaterDate(entree.moment, true)}</td>
                  <td className="px-3 py-2 font-semibold">{entree.action}</td>
                  <td className="px-3 py-2 text-gris">{entree.detail}</td>
                  <td className="px-5 py-2 text-right text-xs text-gris">{entree.poste}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3"><Pagination page={page} parPage={donnees.parPage} total={donnees.total} onChange={setPage} /></div>
        </>
      )}
    </Carte>
  );
}
