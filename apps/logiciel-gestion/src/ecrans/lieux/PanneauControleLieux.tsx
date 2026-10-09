import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { STATUTS_LIEU } from "~/contenus/statuts-lieu.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireControleLieux, type LieuControle, type ResumeLieu } from "~/services/lieux.ts";

const RAISONS = { "meme-nom": "même nom, même ville", "meme-adresse": "même adresse", "meme-nom-proche": "même nom, à moins de 1 km" } as const;

type Props = { tous: ResumeLieu[]; onOuvrir: (id: number) => void };

function LigneLieu({ lieu, detail, onOuvrir }: { lieu: Pick<LieuControle, "id" | "nom" | "ville" | "statut" | "emoji">; detail?: ReactNode; onOuvrir: (id: number) => void }) {
  return (
    <li>
      <button type="button" onClick={() => onOuvrir(lieu.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-creme">
        <span aria-hidden>{lieu.emoji}</span>
        <span className="font-semibold">{lieu.nom}</span>
        <span className="text-gris">· {lieu.ville || "ville ?"}</span>
        <Badge ton={STATUTS_LIEU[lieu.statut].ton}>{STATUTS_LIEU[lieu.statut].libelle}</Badge>
        {detail && <span className="text-gris">{detail}</span>}
        <ChevronRight className="ml-auto size-4" aria-hidden />
      </button>
    </li>
  );
}

/**
 * Le contrôle de toutes les fiches, avant la mise en ligne : positions douteuses (loin des autres lieux de leur ville),
 * doublons possibles, fiches sans position. Un clic ouvre la fiche à corriger.
 */
export function PanneauControleLieux({ tous, onOuvrir }: Props) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireControleLieux, []);
  const sansPosition = tous.filter((lieu) => lieu.latitude === null || lieu.longitude === null);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <>
          <Carte titre={`📍 Positions à vérifier (${donnees.positionsDouteuses.length})`}>
            {donnees.positionsDouteuses.length === 0 ? (
              <p className="text-sm text-gris">Aucune : chaque lieu est près des autres lieux de sa ville.</p>
            ) : (
              <ul className="grid gap-0.5">
                {donnees.positionsDouteuses.map(({ lieu, distanceKm }) => (
                  <LigneLieu key={lieu.id} lieu={lieu} onOuvrir={onOuvrir} detail={distanceKm === null ? "· posé en (0, 0)" : `· à ${distanceKm} km des autres lieux de la ville`} />
                ))}
              </ul>
            )}
          </Carte>
          <Carte titre={`👯 Doublons possibles (${donnees.doublons.length})`}>
            {donnees.doublons.length === 0 ? (
              <p className="text-sm text-gris">Aucun : pas deux fiches au même nom ou à la même adresse.</p>
            ) : (
              <div className="grid gap-3">
                {donnees.doublons.map((groupe) => (
                  <div key={groupe.lieux.map((lieu) => lieu.id).join("-")} className="rounded-xl border border-ligne p-2">
                    <p className="px-2 pb-1 text-[13px] font-semibold text-gris">{RAISONS[groupe.raison]}</p>
                    <ul className="grid gap-0.5">{groupe.lieux.map((lieu) => <LigneLieu key={lieu.id} lieu={lieu} onOuvrir={onOuvrir} detail={lieu.adresse ? `· ${lieu.adresse}` : undefined} />)}</ul>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </>
      )}
      <Carte titre={`🧭 Sans position (${sansPosition.length})`}>
        {sansPosition.length === 0 ? (
          <p className="text-sm text-gris">Toutes les fiches de cette liste sont placées sur la carte.</p>
        ) : (
          <ul className="grid max-h-96 gap-0.5 overflow-y-auto">{sansPosition.map((lieu) => <LigneLieu key={lieu.id} lieu={lieu} onOuvrir={onOuvrir} detail={lieu.adresse ? `· ${lieu.adresse}` : "· pas d'adresse"} />)}</ul>
        )}
      </Carte>
    </div>
  );
}
