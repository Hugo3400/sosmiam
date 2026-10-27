import { useCallback, useState } from "react";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { CHEMIN_MES_MEDIAS_ACTUS } from "@sos-miam/commun/regles/actus";
import type { CorpsArticleActus } from "@sos-miam/commun/types/actus";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";
import { lireDateSaisie } from "~/fonctions/dates/lire-date-saisie";
import { lireFichierPhoto } from "~/fonctions/photos/lire-fichier-photo";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";

const PREFIXE_PRIVE = `${CHEMIN_MES_MEDIAS_ACTUS}/`;

export function utiliserEnvoiActus() {
  const { service } = utiliserServiceActus();
  const { langue } = utiliserLangue();
  const [enCours, setEnCours] = useState(false);

  const expliquer = useCallback((erreur: ErreurService) => {
    const message = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue)[erreur];
    return `${message.titre}. ${message.texte}`;
  }, [langue]);

  const envoyer = useCallback(async (brouillon: BrouillonActusSaisi, retoucheId: number | null): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!brouillon.couverture) return { ok: false, message: expliquer("article-invalide") };
    setEnCours(true);
    try {
      const noms: string[] = [];
      for (const valeur of [brouillon.couverture, ...brouillon.photos]) {
        if (valeur.startsWith(PREFIXE_PRIVE)) {
          noms.push(valeur.slice(PREFIXE_PRIVE.length));
          continue;
        }
        const r = await service.envoyerPhoto(await lireFichierPhoto(valeur));
        if (!r.ok) return { ok: false, message: expliquer(r.erreur) };
        noms.push(r.photo);
      }
      const [couverture, ...photos] = noms;
      const corps: CorpsArticleActus = {
        rubrique: brouillon.rubrique,
        titre: brouillon.titre,
        accroche: brouillon.accroche,
        texte: brouillon.texte,
        citation: brouillon.citation,
        couverture: couverture!,
        photos,
        lieux: brouillon.lieux,
        collaboration: brouillon.collaboration,
        finLe: brouillon.rubrique === "bon-plan" ? lireDateSaisie(brouillon.finSaisie) : null,
      };
      const r = retoucheId === null ? await service.envoyer(corps) : await service.retoucher(retoucheId, corps);
      return r.ok ? { ok: true } : { ok: false, message: expliquer(r.erreur) };
    } finally {
      setEnCours(false);
    }
  }, [service, expliquer]);

  return { envoyer, enCours };
}
