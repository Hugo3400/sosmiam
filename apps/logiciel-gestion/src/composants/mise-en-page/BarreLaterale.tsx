import { Lock } from "lucide-react";

import { MENU, type Ecran } from "~/contenus/menu.ts";

type Props = {
  ecran: Ecran;
  onChoisir: (ecran: Ecran) => void;
  poste: string;
  /** Signalements à traiter, dont graves (publication masquée pour tous) */
  moderation: { aTraiter: number; urgents: number; demandes: number };
  /** Problèmes trouvés sur le serveur (programme arrêté, disque plein, sauvegarde manquante…) */
  problemesServeur: number;
  onVerrouiller: () => void;
};

/** Le menu de gauche : les écrans, l'alerte de modération, le poste connecté et le cadenas. */
export function BarreLaterale({ ecran, onChoisir, poste, moderation, problemesServeur, onVerrouiller }: Props) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-encre text-white">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <img src="/favicon.svg" alt="" className="size-9" />
        <div>
          <p className="font-titre text-lg leading-none font-extrabold">SOS Miam</p>
          <p className="text-xs text-jaune">Gestion</p>
        </div>
      </div>
      <nav aria-label="Écrans" className="flex-1 overflow-y-auto px-3 pb-3">
        {MENU.map(({ groupe, entrees }) => (
          <div key={groupe} className="mt-4 first:mt-1">
            <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-white/45 uppercase">{groupe}</p>
            <ul className="grid gap-0.5">
              {entrees.map(({ ecran: cible, libelle, icone: Icone, bientot }) => {
                const choisi = cible === ecran;
                const alerte = cible === "moderation" && moderation.aTraiter > 0;
                return (
                  <li key={cible}>
                    <button
                      type="button"
                      aria-current={choisi ? "page" : undefined}
                      onClick={() => onChoisir(cible)}
                      className={`flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${
                        choisi ? "bg-jaune text-encre" : bientot ? "text-white/45 hover:bg-white/10 hover:text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icone className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1">{libelle}</span>
                      {cible === "demandes" && moderation.demandes > 0 && (
                        <span className={`chiffres rounded-full px-1.5 text-xs font-bold ${choisi ? "bg-encre text-jaune" : "bg-white/15"}`} aria-label={`${moderation.demandes} demande(s) à traiter`}>
                          {moderation.demandes}
                        </span>
                      )}
                      {cible === "maintenance" && problemesServeur > 0 && (
                        <span className="chiffres rounded-full bg-tomate px-1.5 text-xs font-bold text-white" aria-label={`${problemesServeur} problème(s) sur le serveur`}>
                          {problemesServeur}
                        </span>
                      )}
                      {alerte && (
                        <span
                          className={`chiffres rounded-full px-1.5 text-xs font-bold ${moderation.urgents > 0 ? "animate-pulse bg-tomate text-white" : choisi ? "bg-encre text-jaune" : "bg-white/15"}`}
                          aria-label={`${moderation.aTraiter} à traiter${moderation.urgents > 0 ? `, dont ${moderation.urgents} urgent${moderation.urgents > 1 ? "s" : ""}` : ""}`}
                        >
                          {moderation.aTraiter}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{poste}</p>
          <p className="text-xs text-white/50">Connecté</p>
        </div>
        <button type="button" onClick={onVerrouiller} title="Verrouiller" aria-label="Verrouiller le logiciel" className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-jaune">
          <Lock className="size-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
