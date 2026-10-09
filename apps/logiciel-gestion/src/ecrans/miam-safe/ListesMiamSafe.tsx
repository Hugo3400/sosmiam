import { Check, Undo2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { ENDROITS_MIAM_SAFE } from "~/contenus/miam-safe.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { marquerAlerteVue, rendreCharte, type AlerteSansReponse, type CharteLieu } from "~/services/miam-safe.ts";

/** Les alertes silencieuses restées sans « On arrive » : appeler le lieu, puis la marquer vue. */
export function ListeAlertesSansReponse({ alertes, onChange }: { alertes: AlerteSansReponse[]; onChange: () => void }) {
  const [enCours, setEnCours] = useState<number | null>(null);
  return (
    <ul className="grid gap-3">
      {alertes.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-carte border-2 border-tomate bg-white p-4">
          <div className="grid min-w-0 flex-1 gap-1">
            <p className="font-titre text-base font-extrabold">{a.lieu.emoji} {a.lieu.nom} <span className="text-sm font-semibold text-gris">· {a.lieu.ville}</span></p>
            <p className="text-sm">
              {a.prenom} · {ENDROITS_MIAM_SAFE[a.endroit] ?? a.endroit}{a.detail ? ` · ${a.detail}` : ""}
              <span className="text-gris"> · {formaterDate(a.creeLe, true)}</span>
            </p>
            <p className="text-[13px] text-gris">Personne n'a répondu « On arrive » au comptoir. Appelle le lieu pour qu'il vérifie, puis marque l'alerte comme vue.</p>
          </div>
          <Bouton icone={Check} chargement={enCours === a.id} onClick={async () => {
            setEnCours(a.id);
            await marquerAlerteVue(a.id).catch(() => {});
            setEnCours(null);
            onChange();
          }}>
            Vue
          </Bouton>
        </li>
      ))}
    </ul>
  );
}

/** Les lieux qui ont signé la charte (ou à qui l'équipe l'a retirée). */
export function ListeChartes({ chartes, onChange }: { chartes: CharteLieu[]; onChange: () => void }) {
  return (
    <ul className="grid gap-2">
      {chartes.map((c) => (
        <li key={c.lieu.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-ligne bg-white px-4 py-3">
          <p className="min-w-0 flex-1 font-semibold">{c.lieu.emoji} {c.lieu.nom} <span className="text-sm font-normal text-gris">· {c.lieu.ville}</span></p>
          {c.retireeLe === null ? (
            <Badge ton="encre">🛡 Signée le {formaterDate(c.signeeLe)}</Badge>
          ) : c.motifRetrait ? (
            <>
              <Badge ton="rouge">Retirée par l'équipe le {formaterDate(c.retireeLe)}</Badge>
              <Bouton petit icone={Undo2} onClick={async () => {
                await rendreCharte(c.lieu.id).catch(() => {});
                onChange();
              }}>
                Lui rendre
              </Bouton>
            </>
          ) : (
            <Badge>Quittée par le lieu le {formaterDate(c.retireeLe)}</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
