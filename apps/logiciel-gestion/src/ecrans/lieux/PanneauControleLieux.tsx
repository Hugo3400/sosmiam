import { ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { STATUTS_LIEU } from "~/contenus/statuts-lieu.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireControleLieux, type LieuControle, type ResumeLieu } from "~/services/lieux.ts";

/** Par page : positions et fiches sans position (lignes), doublons (groupes) */
const PAR_PAGE = { positions: 15, doublons: 10, sansPosition: 20 } as const;
type Section = keyof typeof PAR_PAGE;
const tranche = <T,>(liste: T[], section: Section, page: number) => liste.slice((page - 1) * PAR_PAGE[section], page * PAR_PAGE[section]);

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
 * Le contrôle des fiches, avant la mise en ligne : positions douteuses (loin des autres lieux de leur ville), doublons
 * possibles, fiches sans position, pour les lieux qui répondent aux filtres de l'écran (une ville, un type…), page par
 * page. Un clic ouvre la fiche à corriger.
 */
export function PanneauControleLieux({ tous, onOuvrir }: Props) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireControleLieux, []);
  const [pages, setPages] = useState<Record<Section, number>>({ positions: 1, doublons: 1, sansPosition: 1 });
  const changerPage = (section: Section) => (page: number) => setPages((avant) => ({ ...avant, [section]: page }));
  // Les filtres de l'écran s'appliquent aussi au contrôle (fait par le serveur sur tous les lieux)
  const visibles = new Set(tous.map((lieu) => lieu.id));
  const positions = (donnees?.positionsDouteuses ?? []).filter(({ lieu }) => visibles.has(lieu.id));
  const doublons = (donnees?.doublons ?? []).filter((groupe) => groupe.lieux.some((lieu) => visibles.has(lieu.id)));
  const sansPosition = tous.filter((lieu) => lieu.latitude === null || lieu.longitude === null);
  // Un nouveau filtre repart de la première page (pas un simple rafraîchissement de l'écran, qui recrée la même liste)
  const empreinte = `${tous.length}-${tous[0]?.id ?? 0}-${tous.at(-1)?.id ?? 0}`;
  useEffect(() => setPages({ positions: 1, doublons: 1, sansPosition: 1 }), [empreinte]);
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <>
          <Carte titre={`📍 Positions à vérifier (${positions.length})`} actions={<Pagination page={pages.positions} parPage={PAR_PAGE.positions} total={positions.length} onChange={changerPage("positions")} />}>
            {positions.length === 0 ? (
              <p className="text-sm text-gris">Aucune : chaque lieu est près des autres lieux de sa ville.</p>
            ) : (
              <ul className="grid gap-0.5">
                {tranche(positions, "positions", pages.positions).map(({ lieu, distanceKm }) => (
                  <LigneLieu key={lieu.id} lieu={lieu} onOuvrir={onOuvrir} detail={distanceKm === null ? "· posé en (0, 0)" : `· à ${distanceKm} km des autres lieux de la ville`} />
                ))}
              </ul>
            )}
          </Carte>
          <Carte titre={`👯 Doublons possibles (${doublons.length})`} actions={<Pagination page={pages.doublons} parPage={PAR_PAGE.doublons} total={doublons.length} onChange={changerPage("doublons")} />}>
            {doublons.length === 0 ? (
              <p className="text-sm text-gris">Aucun : pas deux fiches au même nom ou à la même adresse.</p>
            ) : (
              <div className="grid gap-3">
                {tranche(doublons, "doublons", pages.doublons).map((groupe) => (
                  <div key={groupe.lieux.map((lieu) => lieu.id).join("-")} className="rounded-xl border border-ligne p-2">
                    <p className="px-2 pb-1 text-[13px] font-semibold text-gris">{RAISONS[groupe.raison]}</p>
                    <ul className="grid gap-0.5">{groupe.lieux.map((lieu) => <LigneLieu key={lieu.id} lieu={lieu} onOuvrir={onOuvrir} detail={lieu.adresse ? `· ${lieu.adresse}` : undefined} />)}</ul>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3"><Pagination page={pages.doublons} parPage={PAR_PAGE.doublons} total={doublons.length} onChange={changerPage("doublons")} /></div>
          </Carte>
        </>
      )}
      <Carte titre={`🧭 Sans position (${sansPosition.length})`} actions={<Pagination page={pages.sansPosition} parPage={PAR_PAGE.sansPosition} total={sansPosition.length} onChange={changerPage("sansPosition")} />}>
        {sansPosition.length === 0 ? (
          <p className="text-sm text-gris">Toutes les fiches de cette liste sont placées sur la carte.</p>
        ) : (
          <ul className="grid gap-0.5">
            {tranche(sansPosition, "sansPosition", pages.sansPosition).map((lieu) => <LigneLieu key={lieu.id} lieu={lieu} onOuvrir={onOuvrir} detail={lieu.adresse ? `· ${lieu.adresse}` : "· pas d'adresse"} />)}
          </ul>
        )}
      </Carte>
    </div>
  );
}
