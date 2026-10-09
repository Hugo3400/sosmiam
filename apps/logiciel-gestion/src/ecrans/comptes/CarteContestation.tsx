import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { MOTIFS_REFUS_VISITE } from "~/contenus/motifs-refus-visite.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { marquerContestationRelue, type ContestationVisite } from "~/services/surveillance.ts";

type Props = { contestation: ContestationVisite; onOuvrir: (id: number) => void; onChange: () => void };

/** Un client conteste le refus d'un lieu : son mot (jamais montré au lieu), le motif du lieu, et quoi faire. */
export function CarteContestation({ contestation: c, onOuvrir, onChange }: Props) {
  const [enCours, setEnCours] = useState(false);
  const motif = c.statut === "retiree" ? MOTIFS_REFUS_VISITE.retiree : MOTIFS_REFUS_VISITE[c.motifRefus ?? ""] ?? "Sans motif";
  return (
    <li className={`grid gap-2 rounded-carte border bg-white p-4 ${c.relue ? "border-ligne" : "border-2 border-encre"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">
          {c.compte.prenom} <span className="text-sm font-semibold text-gris">{c.compte.pseudo ? `· @${c.compte.pseudo} ` : ""}· n° {c.compte.id}</span>
          <span className="font-normal"> conteste un refus de </span>{c.lieu.nom} <span className="text-sm font-semibold text-gris">· {c.lieu.ville}</span>
        </p>
        {c.relue ? <Badge>Relue</Badge> : <Badge ton="jaune">À relire</Badge>}
      </div>
      <p className="text-sm">
        Motif du lieu : <span className="font-semibold">{motif}</span>
        <span className="text-gris"> · {c.statut === "retiree" ? "retirée" : "refusée"} le {formaterDate(c.decideLe ?? c.creeLe, true)}</span>
      </p>
      {c.contestation && (
        <blockquote className="rounded-xl bg-creme px-4 py-3 text-sm whitespace-pre-line">« {c.contestation} »</blockquote>
      )}
      <p className="text-[13px] text-gris">Son mot n'est jamais montré au lieu. Si le client a raison, écris-lui (et parles-en au lieu).</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Bouton petit icone={ChevronRight} onClick={() => onOuvrir(c.compte.id)}>Ouvrir le compte</Bouton>
        <BoutonEcrireMail destinataire={{ compteId: c.compte.id, adresse: c.compte.email, prenom: c.compte.prenom }} objet={`Ta visite chez ${c.lieu.nom}`} />
        {!c.relue && (
          <Bouton petit icone={Check} chargement={enCours} onClick={async () => {
            setEnCours(true);
            await marquerContestationRelue(c.id).catch(() => {});
            setEnCours(false);
            onChange();
          }}>
            Relue
          </Bouton>
        )}
      </div>
    </li>
  );
}
