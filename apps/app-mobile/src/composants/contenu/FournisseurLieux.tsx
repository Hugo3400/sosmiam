import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { Lieu, LieuApi } from "@sos-miam/commun/types/lieu";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { convertirLieuApi } from "~/fonctions/lieux/convertir-lieu-api";
import { ContexteLieux, type EtatLieux } from "~/hooks/utiliser-lieux";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { enregistrerLieuxServeur, lireLieuxServeur } from "~/stockage/lieux-serveur";

// Une relecture au retour dans l'app, au plus toutes les 10 minutes
const RELECTURE_MS = 10 * 60_000;

/**
 * La source des lieux de toute l'app. Mode démo : les lieux d'exemple. Sinon : les lieux publiés sur le serveur (GET
 * /app/lieux), avec la copie gardée sur le téléphone pour s'ouvrir tout de suite et hors ligne. Les distances partent du
 * centre de ta ville (ta position, elle, n'est jamais envoyée).
 */
export function FournisseurLieux({ children }: { children: ReactNode }) {
  const { contenu } = utiliserSession();
  const depart = utiliserPointDeDepart();
  const [lus, setLus] = useState<LieuApi[] | null>(null);
  // Les lieux lus un par un (absents de la liste), gardés jusqu'à la prochaine liste qui les contient
  const [enPlus, setEnPlus] = useState<LieuApi[]>([]);
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
    async (id: number) => {
      if (DEMO_VISITES_ACTIVE) return "inconnu" as const;
      const r = await contenu.lireLieu(id);
      // Seul un « lieu inconnu » dit que le lieu n'existe pas : le reste (réseau, serveur) se retente plus tard
      if (!r.ok) return r.erreur === "lieu-inconnu" || r.erreur === "introuvable" ? ("inconnu" as const) : ("hors-ligne" as const);
      setEnPlus((deja) => [...deja.filter((l) => l.id !== id), r.lieu]);
      return "ok" as const;
    },
    [contenu],
  );

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
    const liste = lus ?? [];
    const dejaLa = new Set(liste.map((l) => l.id));
    return [...liste, ...enPlus.filter((l) => !dejaLa.has(l.id))].map((l) => convertirLieuApi(l, depart));
  }, [lus, enPlus, depart]);
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
    }),
    [lieux, parId, lus, horsLigne, recharger, chargerLieu],
  );
  return <ContexteLieux.Provider value={valeur}>{children}</ContexteLieux.Provider>;
}
