import { Lock, RotateCw } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { TEXTES_SERVEURS } from "~/contenus/serveurs-dev.ts";
import { decrireEtatServeur } from "~/fonctions/maintenance/decrire-etat-serveur.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import type { ServeurSuivi } from "~/services/serveurs.ts";

const RELANCABLES = ["sos-miam-site", "sos-miam-bot-discord"];

type Props = { serveurs: ServeurSuivi[]; relance: string | null; onRelancer: (processus: string) => void };

export function TableauServeursProduction({ serveurs, relance, onRelancer }: Props) {
  return (
    <Carte titre={<span className="flex items-center gap-2"><Lock className="size-4" aria-hidden /> Production</span>} sansMarge>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-gris uppercase">
            <tr className="border-b border-ligne">
              <th scope="col" className="px-5 py-2">Programme</th>
              <th scope="col" className="px-3 py-2">État</th>
              <th scope="col" className="px-3 py-2">Depuis</th>
              <th scope="col" className="px-3 py-2">Redémarrages</th>
              <th scope="col" className="px-3 py-2">Processeur</th>
              <th scope="col" className="px-3 py-2">Mémoire</th>
              <th scope="col" className="px-5 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {serveurs.map((serveur) => {
              const etat = decrireEtatServeur(serveur.etat, serveur.pilotable);
              const processeur = serveur.processeur ?? null;
              return (
                <tr key={serveur.id} className="border-b border-ligne/70 align-top last:border-0">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold">{serveur.nom}</p>
                    <p className="text-[13px] text-gris">{TEXTES_SERVEURS[serveur.id]?.role}</p>
                    <p className="font-mono text-xs text-gris">{serveur.processus}</p>
                  </td>
                  <td className="px-3 py-2.5"><Badge ton={etat.ton}>{etat.libelle}</Badge></td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{serveur.depuis ? formaterDateRelative(serveur.depuis) : "—"}</td>
                  <td className="chiffres px-3 py-2.5">{serveur.redemarrages === null ? "—" : formaterNombre(serveur.redemarrages)}</td>
                  <td className="chiffres px-3 py-2.5 whitespace-nowrap">
                    {processeur === null ? "—" : (
                      <span className="inline-flex items-center gap-2">
                        <span className="block h-1.5 w-14 overflow-hidden rounded-full bg-ligne" aria-hidden>
                          <span className="block h-full rounded-full bg-graphique" style={{ width: `${Math.max(3, Math.min(100, processeur))}%` }} />
                        </span>
                        {processeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                      </span>
                    )}
                  </td>
                  <td className="chiffres px-3 py-2.5 whitespace-nowrap">{serveur.memoire === null ? "—" : formaterOctets(serveur.memoire)}</td>
                  <td className="px-5 py-2.5 text-right">
                    {RELANCABLES.includes(serveur.processus) && serveur.etat === "en-ligne" && (
                      <Bouton petit icone={RotateCw} chargement={relance === serveur.processus} desactive={relance !== null && relance !== serveur.processus} onClick={() => onRelancer(serveur.processus)}>
                        Relancer
                      </Bouton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-ligne px-5 py-3 text-[13px] text-gris">
        Ici, on regarde sans toucher : seuls le site et le bot se relancent d'un clic. L'API, seulement depuis un terminal du serveur.
      </p>
    </Carte>
  );
}
