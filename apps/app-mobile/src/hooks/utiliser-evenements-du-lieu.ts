import { useCallback, useEffect, useMemo, useState } from "react";

import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { listerEvenementsPublicsDemo } from "~/services/demo/lieu-pro-demo";

export type EvenementsDuLieu = {
  /** Un événement par ligne (sa prochaine date), le plus proche d'abord ; null : pas encore lus */
  evenements: EvenementLieuPublic[] | null;
  /** Les événements que tu as gardés (« Ça m'intéresse ») */
  interesse: (evenementId: number) => boolean;
  /** Pose ou retire « Ça m'intéresse » ; rend faux si le serveur a refusé */
  basculerInteret: (evenementId: number) => Promise<boolean>;
};

/**
 * Les événements à venir d'un lieu (« À venir » sur sa fiche) : lus sans compte (démo : ceux joués sur le téléphone), un par
 * événement (la prochaine date ; « chaque semaine » est dit à côté). En visite sans compte (âge inconnu), jamais un événement
 * avec alcool. Avec un compte, les « Ça m'intéresse » sont lus et basculés sur le serveur.
 */
export function utiliserEvenementsDuLieu(lieuId: number, age: number | null): EvenementsDuLieu {
  const { contenu } = utiliserSession();
  const { interetsEvenements } = utiliserServices();
  const { profil } = utiliserProfil();
  const [lus, setLus] = useState<EvenementLieuPublic[] | null>(null);
  const [gardes, setGardes] = useState<Set<number>>(new Set());

  useEffect(() => {
    let actif = true;
    const lire = DEMO_VISITES_ACTIVE ? Promise.resolve({ ok: true as const, evenements: listerEvenementsPublicsDemo(lieuId, Date.now()) }) : contenu.listerEvenementsDuLieu(lieuId);
    lire.then((r) => actif && setLus(r.ok ? r.evenements : []));
    return () => {
      actif = false;
    };
  }, [contenu, lieuId]);

  useEffect(() => {
    if (!profil) return;
    let actif = true;
    interetsEvenements.listerMesInterets().then((r) => actif && r.ok && setGardes(new Set(r.interets.map((i) => i.evenement.id))));
    return () => {
      actif = false;
    };
  }, [interetsEvenements, profil]);

  const evenements = useMemo(() => {
    if (!lus) return null;
    const vus = new Set<number>();
    return lus.filter((e) => (age !== null || !e.alcool) && !vus.has(e.id) && !!vus.add(e.id));
  }, [lus, age]);

  const basculerInteret = useCallback(
    async (id: number) => {
      const garde = gardes.has(id);
      // Réponse immédiate à l'écran, puis la liste du serveur fait foi
      setGardes((s) => {
        const suivant = new Set(s);
        if (garde) suivant.delete(id);
        else suivant.add(id);
        return suivant;
      });
      const r = garde ? await interetsEvenements.retirerInteret(id) : await interetsEvenements.poserInteret(id, false);
      if (r.ok) setGardes(new Set(r.interets.map((i) => i.evenement.id)));
      else setGardes((s) => (garde ? new Set([...s, id]) : new Set([...s].filter((x) => x !== id))));
      return r.ok;
    },
    [gardes, interetsEvenements],
  );

  return { evenements, interesse: (id) => gardes.has(id), basculerInteret };
}
