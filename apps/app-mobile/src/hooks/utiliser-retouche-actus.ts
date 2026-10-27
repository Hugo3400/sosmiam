import { useEffect, useState } from "react";

import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";

const versSaisie = (jour: string | null) => (jour ? jour.split("-").reverse().join("/") : "");

export function utiliserRetoucheActus(id: number | null) {
  const { service } = utiliserServiceActus();
  const [etat, setEtat] = useState<{ id: number; brouillon: BrouillonActusSaisi | null; message: string | null } | null>(null);

  useEffect(() => {
    if (id === null) return;
    let actif = true;
    void service.lireBrouillon(id).then((r) => {
      if (!actif) return;
      if (!r.ok) return setEtat({ id, brouillon: null, message: null });
      const b = r.brouillon;
      setEtat({
        id,
        message: b.retouche,
        brouillon: {
          rubrique: b.rubrique, titre: b.titre, accroche: b.accroche, texte: b.texte, citation: b.citation,
          couverture: b.adresses.couverture, photos: b.adresses.photos, lieux: b.lieux, collaboration: b.collaboration, finSaisie: versSaisie(b.finLe),
        },
      });
    });
    return () => {
      actif = false;
    };
  }, [service, id]);

  const pret = id !== null && etat?.id === id;
  return { chargement: id !== null && !pret, brouillon: pret ? etat.brouillon : null, message: pret ? etat.message : null };
}
