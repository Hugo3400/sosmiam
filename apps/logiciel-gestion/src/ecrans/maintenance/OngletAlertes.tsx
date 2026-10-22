import { Carte } from "~/composants/interface/Carte.tsx";
import { ALERTES_MACHINE } from "~/contenus/alertes-machine.ts";

export function OngletAlertes({ problemes }: { problemes: string[] }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Carte titre="En ce moment">
        {problemes.length === 0 ? (
          <p className="text-sm text-gris">Rien à signaler : tout le serveur est en forme. ✅</p>
        ) : (
          <ul className="grid gap-2">
            {problemes.map((probleme) => <li key={probleme} className="rounded-xl border-2 border-encre bg-jaune-clair px-4 py-2.5 text-sm font-semibold">⚠️ {probleme}</li>)}
          </ul>
        )}
      </Carte>
      <Carte titre="Me prévenir quand…" actions={<span className="text-[13px] text-gris">pastille du menu + notification Windows</span>}>
        <ul className="grid gap-2">
          {ALERTES_MACHINE.map((alerte) => (
            <li key={alerte.titre} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-ligne px-4 py-2.5">
              <span className="grid gap-px"><b className="text-sm font-semibold">{alerte.titre}</b><span className="text-[12.5px] text-gris">{alerte.aide}</span></span>
              <span className="chiffres rounded-lg border-[1.5px] border-encre px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap">{alerte.regle}</span>
            </li>
          ))}
        </ul>
      </Carte>
    </div>
  );
}
