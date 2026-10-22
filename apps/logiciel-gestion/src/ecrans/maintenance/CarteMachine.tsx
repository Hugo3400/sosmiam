import { Server } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Jauge } from "~/composants/interface/Jauge.tsx";
import { formaterPourcentage } from "~/fonctions/maintenance/formater-pourcentage.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import type { Machine } from "~/services/machines.ts";

function MiniJauge({ libelle, part }: { libelle: string; part: number | null }) {
  return (
    <div className="grid gap-1 text-xs text-gris">
      <span className="flex justify-between gap-2">{libelle} <b className="chiffres text-encre">{part === null ? "—" : formaterPourcentage(part * 100)}</b></span>
      <Jauge part={part ?? 0} libelle={libelle} />
    </div>
  );
}

export function CarteMachine({ machine }: { machine: Machine }) {
  const m = machine.maintenant;
  const memoire = m?.memoire ? m.memoire.utilisee / m.memoire.totale : null;
  const disque = m?.disque ? 1 - m.disque.libre / m.disque.total : null;
  return (
    <section aria-label={machine.nom} className="grid w-full max-w-md content-start gap-3 rounded-carte border-2 border-encre bg-white p-4 shadow-brut">
      <header className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-extrabold"><Server className="size-5" aria-hidden /> {machine.nom}</h3>
        {machine.problemes.length > 0 ? <Badge ton="rouge">À surveiller</Badge> : m ? <Badge ton="vert">En forme</Badge> : <Badge>Premier relevé…</Badge>}
      </header>
      <p className="flex flex-wrap gap-1">
        {machine.roles.map((role) => <span key={role} className="rounded-full border border-ligne px-2 py-px text-xs font-semibold text-gris">{role}</span>)}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <MiniJauge libelle="Processeur" part={m?.processeur === null || m?.processeur === undefined ? null : m.processeur / 100} />
        <MiniJauge libelle="Mémoire" part={memoire} />
        <MiniJauge libelle="Disque" part={disque} />
      </div>
      <p className="flex flex-wrap justify-between gap-2 text-xs text-gris">
        <span className="font-mono">{machine.hote}</span>
        <span>{m ? `relevé ${formaterDateRelative(m.releveLe)}` : "le relevé démarre"}</span>
      </p>
    </section>
  );
}
