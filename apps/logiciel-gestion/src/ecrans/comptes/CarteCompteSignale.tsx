import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { decrireRaisonCompte } from "~/fonctions/surveillance/decrire-raison-compte.ts";
import { marquerSurveilleVu, type CompteSignale, type SeuilsSurveillance } from "~/services/surveillance.ts";

type Props = { signale: CompteSignale; seuils: SeuilsSurveillance; onOuvrir: (id: number) => void; onChange: () => void };

/** Un compte signalé par la surveillance des visites : pourquoi, qui l'a refusé, et quoi faire (rien n'est bloqué). */
export function CarteCompteSignale({ signale, seuils, onOuvrir, onChange }: Props) {
  const { compte, raisons, nouveau, refusPar, contestations } = signale;
  const [enCours, setEnCours] = useState(false);
  return (
    <li className={`grid gap-2 rounded-carte border bg-white p-4 ${nouveau ? "border-2 border-encre" : "border-ligne"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onOuvrir(compte.id)} className="min-w-0 flex-1 truncate text-left font-titre text-base font-extrabold hover:underline">
          {compte.prenom} <span className="text-sm font-semibold text-gris">{compte.pseudo ? `· @${compte.pseudo} ` : ""}· n° {compte.id}{compte.ville ? ` · ${compte.ville}` : ""}</span>
        </button>
        {nouveau ? <Badge ton="jaune">À regarder</Badge> : <Badge>Vu</Badge>}
      </div>
      <ul className="grid gap-1 text-sm">
        {raisons.map((raison) => (
          <li key={raison.type === "par-jour" ? raison.jour : "refus"}>{raison.type === "par-jour" ? "📅" : "🚫"} {decrireRaisonCompte(raison, seuils)}</li>
        ))}
      </ul>
      {refusPar.length > 0 && (
        <p className="text-[13px] text-gris">
          Refusé par {refusPar.map(({ lieu, refus }) => `${lieu.nom}${lieu.ville ? ` (${lieu.ville})` : ""} ×${refus}`).join(", ")}
        </p>
      )}
      {contestations > 0 && <p className="text-[13px] font-semibold">⚖️ {contestations} refus contesté{contestations > 1 ? "s" : ""} : à lire dans « Contestations ».</p>}
      <div className="mt-1 flex flex-wrap gap-2">
        <Bouton petit icone={ChevronRight} onClick={() => onOuvrir(compte.id)}>Ouvrir le compte</Bouton>
        <BoutonEcrireMail destinataire={{ compteId: compte.id, adresse: compte.email, prenom: compte.prenom }} />
        {nouveau && (
          <Bouton petit icone={Check} chargement={enCours} titre="Il revient s'il y a du nouveau" onClick={async () => {
            setEnCours(true);
            await marquerSurveilleVu("comptes", compte.id).catch(() => {});
            setEnCours(false);
            onChange();
          }}>
            Vu, rien à signaler
          </Bouton>
        )}
      </div>
    </li>
  );
}
