import { useEffect, useMemo, useState } from "react";

import type { CarteLieu } from "@sos-miam/commun/types/carte";
import { cartesExemples } from "~/contenus/cartes-exemples";
import { utiliserServices } from "~/hooks/utiliser-services";

/**
 * La carte d'un lieu telle que les gourmands la voient : celle que le lieu a enregistrée lui-même (mode pro, espace pro)
 * si elle existe, même vide, sinon celle de la fiche. Les sections encore vides n'y apparaissent pas. Relue quand le lieu
 * change, puis à chaque changement signalé par les services. undefined : pas de carte (ou pas de lieu).
 */
export function utiliserCarteDuLieu(lieuId: number | null): CarteLieu | undefined {
  const { visites } = utiliserServices();
  // undefined : pas encore relue (ou rien d'enregistré) → celle de la fiche en attendant
  const [enregistree, setEnregistree] = useState<{ lieuId: number; carte: CarteLieu | null } | null>(null);

  useEffect(() => {
    if (lieuId === null) return;
    let actif = true;
    const lire = () =>
      visites.lireLieu(lieuId).then((r) => {
        if (actif) setEnregistree({ lieuId, carte: r.ok ? r.infos.carteDuLieu : null });
      });
    lire();
    const desabonner = visites.ecouter(lire);
    return () => {
      actif = false;
      desabonner();
    };
  }, [visites, lieuId]);

  return useMemo(() => {
    if (lieuId === null) return undefined;
    // Une lecture faite pour un autre lieu ne compte pas (le temps que la nouvelle arrive)
    const carte = (enregistree?.lieuId === lieuId ? enregistree.carte : null) ?? cartesExemples[lieuId];
    if (!carte) return undefined;
    return { ...carte, sections: carte.sections.filter((s) => s.elements.length > 0) };
  }, [lieuId, enregistree]);
}
