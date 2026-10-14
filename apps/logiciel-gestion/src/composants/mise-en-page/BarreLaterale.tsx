import { ChevronDown, Lock, Search } from "lucide-react";
import { useState } from "react";

import { MENU, type Ecran } from "~/contenus/menu.ts";
import type { Pastille } from "~/fonctions/alertes/calculer-pastilles.ts";
import { formaterNombrePastille } from "~/fonctions/alertes/formater-nombre-pastille.ts";
import { ecrireGroupesReplies, lireGroupesReplies } from "~/stockage/groupes-menu.ts";

type Props = {
  ecran: Ecran;
  onChoisir: (ecran: Ecran) => void;
  poste: string;
  /** Pastille de chaque écran : combien attendent, ce que ça veut dire, et en rouge si c'est urgent */
  pastilles: Partial<Record<Ecran, Pastille>>;
  onVerrouiller: () => void;
  onRechercher: () => void;
};

/** Le nombre d'une pastille, arrondi (« +9 »), dans sa couleur : rouge clignotant si urgent */
function NombrePastille({ pastille, sombre }: { pastille: Pastille; sombre: boolean }) {
  return (
    <span
      className={`chiffres grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-extrabold ${pastille.urgent ? "animate-pulse bg-tomate text-white" : sombre ? "bg-nuit text-jaune" : "bg-jaune text-nuit"}`}
      aria-label={pastille.libelle}
      title={pastille.libelle}
    >
      {formaterNombrePastille(pastille.nombre)}
    </span>
  );
}

/**
 * Le menu de gauche : les écrans rangés par groupes dépliables (repliés ou non selon ce poste ; celui de l'écran ouvert
 * reste toujours déplié, et un groupe replié garde la somme de ses pastilles), la recherche, le poste et le cadenas.
 */
export function BarreLaterale({ ecran, onChoisir, poste, pastilles, onVerrouiller, onRechercher }: Props) {
  const [replies, setReplies] = useState<string[]>(lireGroupesReplies);
  const basculer = (groupe: string) => {
    const suivants = replies.includes(groupe) ? replies.filter((g) => g !== groupe) : [...replies, groupe];
    setReplies(suivants);
    ecrireGroupesReplies(suivants);
  };
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-nuit text-white">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <img src="/favicon.svg" alt="" className="size-9" />
        <div>
          <p className="font-titre text-lg leading-none font-extrabold">SOS Miam</p>
          <p className="text-xs text-jaune">Gestion</p>
        </div>
      </div>
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onRechercher}
          className="flex h-9 w-full items-center gap-2.5 rounded-xl bg-white/10 px-3 text-left text-sm text-white/70 hover:bg-white/15 hover:text-white"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Rechercher…</span>
          <kbd className="rounded border border-white/20 px-1 text-[11px]">Ctrl K</kbd>
        </button>
      </div>
      <nav aria-label="Écrans" className="defilement-sombre flex-1 overflow-y-auto px-3 pb-3">
        {MENU.map(({ groupe, entrees }) => {
          const contientEcran = entrees.some((entree) => entree.ecran === ecran);
          const replie = replies.includes(groupe) && !contientEcran;
          const enAttente = entrees.map((entree) => pastilles[entree.ecran]).filter((p): p is Pastille => Boolean(p && p.nombre > 0));
          const total: Pastille | null = enAttente.length
            ? { nombre: enAttente.reduce((somme, p) => somme + p.nombre, 0), libelle: enAttente.map((p) => p.libelle).join(" · "), urgent: enAttente.some((p) => p.urgent) }
            : null;
          const idListe = `menu-${groupe.toLowerCase()}`;
          return (
          <div key={groupe} className="mt-3 first:mt-1">
            <button
              type="button"
              onClick={() => basculer(groupe)}
              aria-expanded={!replie}
              aria-controls={idListe}
              title={contientEcran ? "L'écran ouvert est dans ce groupe : il reste déplié" : replie ? "Déplier" : "Replier"}
              className="group flex h-7 w-full items-center gap-1.5 rounded-lg px-3 text-left text-[11px] font-bold tracking-wider text-white/45 uppercase hover:text-white/80"
            >
              <ChevronDown className={`size-3.5 shrink-0 transition-transform ${replie ? "-rotate-90" : ""}`} aria-hidden />
              <span className="flex-1">{groupe}</span>
              {replie && total && <NombrePastille pastille={total} sombre={false} />}
            </button>
            <ul id={idListe} hidden={replie} className="grid gap-0.5">
              {entrees.map(({ ecran: cible, libelle, icone: Icone, bientot }) => {
                const choisi = cible === ecran;
                const pastille = pastilles[cible];
                return (
                  <li key={cible}>
                    <button
                      type="button"
                      aria-current={choisi ? "page" : undefined}
                      onClick={() => onChoisir(cible)}
                      className={`flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${
                        choisi ? "bg-jaune text-nuit" : bientot ? "text-white/45 hover:bg-white/10 hover:text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icone className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate" title={libelle}>{libelle}</span>
                      {pastille && pastille.nombre > 0 && <NombrePastille pastille={pastille} sombre={choisi} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
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
