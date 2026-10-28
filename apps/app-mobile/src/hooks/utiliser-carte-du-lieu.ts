import { useEffect, useMemo, useState } from "react";

import type { CarteLieu } from "@sos-miam/commun/types/carte";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";

/**
 * La carte d'un lieu telle que les gourmands la voient : celle du serveur (GET /app/lieux/:id/carte), qui fait foi. Les sections encore vides n'y apparaissent pas. Relue quand le lieu change, puis à chaque changement
 * signalé par les services. undefined : pas de carte (ou pas de lieu, ou pas encore lue).
 */
export function utiliserCarteDuLieu(lieuId: number | null): CarteLieu | undefined {
  const { visites } = utiliserServices();
  const { contenu } = utiliserSession();
  // null : pas encore relue ; carte null : le lieu n'a rien enregistré
  const [enregistree, setEnregistree] = useState<{ lieuId: number; carte: CarteLieu | null } | null>(null);

  useEffect(() => {
    if (lieuId === null) return;
    let actif = true;
    const lire = () =>
      contenu.lireCarte(lieuId).then((r) => {
        // Sans réseau, la dernière carte lue reste affichée
        if (actif && r.ok) setEnregistree({ lieuId, carte: r.carte });
      });
    lire();
    const desabonner = visites.ecouter(lire);
    return () => {
      actif = false;
      desabonner();
    };
  }, [visites, contenu, lieuId]);

  return useMemo(() => {
    if (lieuId === null) return undefined;
    // Une lecture faite pour un autre lieu ne compte pas (le temps que la nouvelle arrive)
    const lue = enregistree?.lieuId === lieuId ? enregistree.carte : null;
    if (!lue) return undefined;
    return { ...lue, sections: lue.sections.filter((s) => s.elements.length > 0) };
  }, [lieuId, enregistree]);
}
