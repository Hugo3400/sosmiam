import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { ZoneGeo } from "@sos-miam/commun/contenus/regions-france";
import type { Lieu, LieuApi } from "@sos-miam/commun/types/lieu";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { RAYON_PROCHE_KM } from "~/contenus/portee-explorer";
import { arrondirZoneALaGrille } from "~/fonctions/geo/arrondir-zone-a-la-grille";
import { calculerZoneAutour } from "~/fonctions/geo/calculer-zone-autour";
import { convertirLieuApi } from "~/fonctions/lieux/convertir-lieu-api";
import { ContexteLieux, type EtatLieux, type LectureLieu } from "~/hooks/utiliser-lieux";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { enregistrerLieuxServeur, lireLieuxServeur } from "~/stockage/lieux-serveur";

// Une relecture au retour dans l'app, au plus toutes les 10 minutes
const RELECTURE_MS = 10 * 60_000;
// Une zone lue il y a moins d'une minute est encore fraîche : la liste relue ne la redemande pas (ouverture de l'app)
const ZONE_FRAICHE_MS = 60_000;
// Les zones gardées : les 4 dernières demandées (autour de toi, de ta ville, d'une ville choisie, ta région) ; les plus
// anciennes sont oubliées avec leurs lieux, pour ne pas grossir sans fin
const ZONES_GARDEES = 4;

/** La clé d'une zone arrondie à la grille (des multiples de 0,5 degré : deux cadrages voisins ne relisent pas le serveur) */
const cleZone = (z: ZoneGeo) => [z.nord, z.sud, z.ouest, z.est].map((b) => b.toFixed(2)).join(",");

/** Une zone gardée : ses bords arrondis, et quand elle a été demandée au serveur pour la dernière fois (0 : à redemander) */
type ZoneGardee = { zone: ZoneGeo; demandee: number };

/**
 * La source des lieux de toute l'app. Mode démo : les lieux d'exemple. Sinon : les lieux publiés sur le serveur (GET
 * /app/lieux), avec la copie gardée sur le téléphone pour s'ouvrir tout de suite et hors ligne. Les distances se calculent
 * sur le téléphone. Sans zone, le serveur n'en rend que 1 000 : on lit aussi ceux autour de ta ville, et ceux de la zone
 * qu'Explorer regarde (chargerZone). Toute zone envoyée est d'abord arrondie à la grille (arrondirZoneALaGrille) : jamais ta
 * position exacte, et rien n'est gardé, ni ici ni sur le serveur. Les zones relues avec la liste : pas de SOS d'hier.
 */
export function FournisseurLieux({ children }: { children: ReactNode }) {
  const { contenu } = utiliserSession();
  const depart = utiliserPointDeDepart();
  const [lus, setLus] = useState<LieuApi[] | null>(null);
  // Les lieux lus un par un (absents de la liste), gardés jusqu'à la prochaine liste qui les contient
  const [enPlus, setEnPlus] = useState<LieuApi[]>([]);
  // Les lieux lus par zone, par clé de zone (une zone relue remplace ce qu'elle avait), et les zones gardées, de la plus
  // ancienne demande à la plus récente
  const [deZones, setDeZones] = useState<Record<string, LieuApi[]>>({});
  const zones = useRef(new Map<string, ZoneGardee>());
  const [horsLigne, setHorsLigne] = useState(false);
  const derniereLecture = useRef(0);

  /** Demande (ou redemande) au serveur les lieux d'une zone gardée */
  const lireZone = useCallback(
    (cle: string) => {
      const gardee = zones.current.get(cle);
      if (!gardee) return;
      gardee.demandee = Date.now();
      void contenu.listerLieux(gardee.zone).then((r) => {
        // Oubliée entre-temps (d'autres zones sont passées devant) : sa réponse ne revient pas dans la liste
        const encore = zones.current.get(cle);
        if (!encore) return;
        if (r.ok) setDeZones((deja) => ({ ...deja, [cle]: r.lieux }));
        // Pas de réseau : la zone pourra être redemandée tout de suite
        else encore.demandee = 0;
      });
    },
    [contenu],
  );

  const recharger = useCallback(async () => {
    if (DEMO_VISITES_ACTIVE) return;
    derniereLecture.current = Date.now();
    const r = await contenu.listerLieux();
    if (!r.ok) return setHorsLigne(true);
    setHorsLigne(false);
    setLus(r.lieux);
    // Les zones déjà lues aussi : un SOS terminé ou un lieu retiré disparaît partout
    for (const [cle, { demandee }] of zones.current) if (Date.now() - demandee > ZONE_FRAICHE_MS) lireZone(cle);
    await enregistrerLieuxServeur(r.lieux);
  }, [contenu, lireZone]);

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
    (demandee: ZoneGeo) => {
      if (DEMO_VISITES_ACTIVE) return;
      // Ici, et pas chez qui appelle : aucune zone ne part sans être arrondie à la grille
      const zone = arrondirZoneALaGrille(demandee);
      const cle = cleZone(zone);
      const deja = zones.current.get(cle);
      // La plus récente en dernier : ce sont les plus anciennes qu'on oublie, avec leurs lieux
      zones.current.delete(cle);
      zones.current.set(cle, { zone, demandee: deja?.demandee ?? 0 });
      if (zones.current.size > ZONES_GARDEES) {
        const oubliees = [...zones.current.keys()].slice(0, zones.current.size - ZONES_GARDEES);
        for (const oubliee of oubliees) zones.current.delete(oubliee);
        setDeZones((lieux) => Object.fromEntries(Object.entries(lieux).filter(([c]) => zones.current.has(c))));
      }
      if (deja && Date.now() - deja.demandee < RELECTURE_MS) return;
      lireZone(cle);
    },
    [lireZone],
  );

  // Les lieux autour de ta ville, jusqu'au bout du curseur d'Explorer : là, même au-delà des 1 000 de la liste
  useEffect(() => {
    if (depart) chargerZone(calculerZoneAutour(depart, RAYON_PROCHE_KM.max));
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
