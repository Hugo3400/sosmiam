import { Check } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { MOTIFS_REFUS_VISITE } from "~/contenus/motifs-refus-visite.ts";
import { marquerSurveilleVu, type LieuRefusant } from "~/services/surveillance.ts";

/** Un lieu qui refuse beaucoup de visites : sa part de refus et ses motifs. */
export function CarteLieuRefusant({ refusant, onChange }: { refusant: LieuRefusant; onChange: () => void }) {
  const { lieu, refusees, decidees, part, motifs, nouveau } = refusant;
  const [enCours, setEnCours] = useState(false);
  return (
    <li className={`flex flex-wrap items-center gap-3 rounded-carte border bg-white p-4 ${nouveau ? "border-2 border-encre" : "border-ligne"}`}>
      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="font-titre text-base font-extrabold">{lieu.nom} <span className="text-sm font-semibold text-gris">· {lieu.ville}</span></p>
        <p className="text-sm"><span className="chiffres font-semibold">{part} %</span> de refus : {refusees} sur {decidees} visites décidées</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(motifs).sort((a, b) => b[1] - a[1]).map(([motif, nombre]) => (
            <Badge key={motif} ton="contour">{MOTIFS_REFUS_VISITE[motif] ?? motif} ×{nombre}</Badge>
          ))}
        </div>
      </div>
      {nouveau ? (
        <Bouton petit icone={Check} chargement={enCours} titre="Il revient s'il refuse encore" onClick={async () => {
          setEnCours(true);
          await marquerSurveilleVu("lieux", lieu.id).catch(() => {});
          setEnCours(false);
          onChange();
        }}>
          Vu
        </Bouton>
      ) : <Badge>Vu</Badge>}
    </li>
  );
}
