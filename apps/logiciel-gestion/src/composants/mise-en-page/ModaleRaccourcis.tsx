import { Modale } from "~/composants/interface/Modale.tsx";
import { RACCOURCIS } from "~/contenus/raccourcis.ts";

/** F1 : la liste des raccourcis clavier. */
export function ModaleRaccourcis({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  return (
    <Modale titre="Raccourcis clavier" ouverte={ouverte} onFermer={onFermer}>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {RACCOURCIS.map((r) => (
          <div key={r.touches} className="contents">
            <dt><kbd className="rounded-md border border-ligne bg-creme px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap">{r.touches}</kbd></dt>
            <dd>{r.action}</dd>
          </div>
        ))}
      </dl>
    </Modale>
  );
}
