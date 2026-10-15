import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { ZoneGeo } from "@sos-miam/commun/contenus/regions-france";
import type { Lieu, LieuApi } from "@sos-miam/commun/types/lieu";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { RAYON_PROCHE_KM } from "~/contenus/portee-explorer";
import { calculerCadrePortee } from "~/fonctions/geo/calculer-cadre-portee";
import { convertirLieuApi } from "~/fonctions/lieux/convertir-lieu-api";
import { ContexteLieux, type EtatLieux, type LectureLieu } from "~/hooks/utiliser-lieux";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { enregistrerLieuxServeur, lireLieuxServeur } from "~/stockage/lieux-serveur";

// Une relecture au retour dans l'app, au plus toutes les 10 minutes
const RELECTURE_MS = 10 * 60_000;

/** La clé d'une zone lue (au centième de degré, ~1 km : un même cadrage ne relit pas le serveur) */
const cleZone = (z: ZoneGeo) => [z.nord, z.sud, z.ouest, z.est].map((b) => b.toFixed(2)).join(",");

/**
 * La source des lieux de toute l'app. Mode démo : les lieux d'exemple. Sinon : les lieux publiés sur le serveur (GET
 * /app/lieux), avec la copie gardée sur le téléphone pour s'ouvrir tout de suite et hors ligne. Les distances partent du
 * centre de ta ville (ta position, elle, n'est jamais envoyée). Sans zone, le serveur n'en rend que 1 000 : on lit aussi
 * ceux autour de ta ville, et ceux de la zone qu'Explorer regarde (chargerZone), seulement un rectangle de carte.
 */
export function FournisseurLieux({ children }: { children: ReactNode }) {
  const { contenu } = utiliserSession();
  const depart = utiliserPointDeDepart();
  const [lus, setLus] = useState<LieuApi[] | null>(null);
  // Les lieux lus un par un (absents de la liste), gardés jusqu'à la prochaine liste qui les contient
  const [enPlus, setEnPlus] = useState<LieuApi[]>([]);
  // Les lieux lus par zone, par clé de zone (une zone relue remplace ce qu'elle avait), et quand chaque zone a été demandée
  const [deZones, setDeZones] = useState<Record<string, LieuApi[]>>({});
  const zonesDemandees = useRef(new Map<string, number>());
  const [horsLigne, setHorsLigne] = useState(false);
  const derniereLecture = useRef(0);

  const recharger = useCallback(async () => {
    if (DEMO_VISITES_ACTIVE) return;
    derniereLecture.current = Date.now();
    const r = await contenu.listerLieux();
    if (!r.ok) return setHorsLigne(true);
    setHorsLigne(false);
    setLus(r.lieux);
    await enregistrerLieuxServeur(r.lieux);
  }, [contenu]);

  const chargerLieu = useCallback(
    async (id: number): Promise<LectureLieu> => {
      if (DEMO_VISITES_ACTIVE) {
        const exemple = lieuxExemples.find((l) => l.id === id);
        return exemple ? { ok: true, lieu: exemple } : { ok: false, raison: "inconnu" };
      }
      const r = await contenu.lireLieu(id);
      // Seul un « lieu inconnu » dit que le lieu n'existe pas : le reste (réseau, serveur) se retente plus tard
      if (!r.ok) return { ok: false, raison: r.erreur === "lieu-inconnu" || r.erreur === "introuvable" ? "inconnu" : "hors-ligne" };
      setEnPlus((deja) => [...deja.filter((l) => l.id !== id), r.lieu]);
      return { ok: true, lieu: convertirLieuApi(r.lieu, depart) };
    },
    [contenu, depart],
  );

  const chargerZone = useCallback(
    (zone: ZoneGeo) => {
      if (DEMO_VISITES_ACTIVE) return;
      const cle = cleZone(zone);
      const demandee = zonesDemandees.current.get(cle);
      if (demandee !== undefined && Date.now() - demandee < RELECTURE_MS) return;
      zonesDemandees.current.set(cle, Date.now());
      void contenu.listerLieux(zone).then((r) => {
        if (r.ok) setDeZones((deja) => ({ ...deja, [cle]: r.lieux }));
        // Pas de réseau : la zone pourra être redemandée tout de suite
        else zonesDemandees.current.delete(cle);
      });
    },
    [contenu],
  );

  // Les lieux autour de ta ville, jusqu'au bout du curseur d'Explorer : là, même au-delà des 1 000 de la liste
  useEffect(() => {
    const autour = depart ? calculerCadrePortee({ portee: "proche", centre: depart, rayonKm: RAYON_PROCHE_KM.max }) : null;
    if (autour) chargerZone(autour);
  }, [depart, chargerZone]);

  useEffect(() => {
    if (DEMO_VISITES_ACTIVE) return;
    let actif = true;
    lireLieuxServeur().then((copie) => {
      if (actif && copie) setLus((deja) => deja ?? copie);
    });
    void recharger();
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active" && Date.now() - derniereLecture.current > RELECTURE_MS) void recharger();
    });
    return () => {
      actif = false;
      abonnement.remove();
    };
  }, [recharger]);

  const lieux = useMemo<Lieu[]>(() => {
    if (DEMO_VISITES_ACTIVE) return lieuxExemples;
    // La liste d'abord, puis les lieux lus par zone, puis ceux lus un par un : chaque lieu une seule fois
    const dejaLa = new Set<number>();
    const tous: LieuApi[] = [];
    for (const l of [...(lus ?? []), ...Object.values(deZones).flat(), ...enPlus]) {
      if (dejaLa.has(l.id)) continue;
      dejaLa.add(l.id);
      tous.push(l);
    }
    return tous.map((l) => convertirLieuApi(l, depart));
  }, [lus, deZones, enPlus, depart]);
  const parId = useMemo(() => new Map(lieux.map((l) => [l.id, l] as const)), [lieux]);

  const valeur = useMemo<EtatLieux>(
    () => ({
      lieux,
      trouverLieu: (id) => parId.get(id),
      pret: DEMO_VISITES_ACTIVE || lus !== null || horsLigne,
      source: DEMO_VISITES_ACTIVE ? "demo" : "serveur",
      horsLigne,
      recharger,
      chargerLieu,
      chargerZone,
    }),
    [lieux, parId, lus, horsLigne, recharger, chargerLieu, chargerZone],
  );
  return <ContexteLieux.Provider value={valeur}>{children}</ContexteLieux.Provider>;
}
