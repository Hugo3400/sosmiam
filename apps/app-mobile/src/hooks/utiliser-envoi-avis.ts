import { useCallback, useRef, useState } from "react";

import type { AvisEnvoye, EtapeEnvoiAvis, RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { envoyerAvisAvecPhoto, type PhotoDeposee, type SaisieEnvoiAvis } from "~/fonctions/avis/envoyer-avis-avec-photo";
import { lireFichierPhoto } from "~/fonctions/photos/lire-fichier-photo";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export type AvisAEnvoyer = SaisieEnvoiAvis;

export type EtatEnvoiAvis = {
  enCours: EtapeEnvoiAvis | null;
  refus: RefusEnvoiAvis | null;
  envoye: AvisEnvoye | null;
  envoyer: (avis: AvisAEnvoyer) => Promise<void>;
  oublierRefus: () => void;
};

export function utiliserEnvoiAvis(): EtatEnvoiAvis {
  const services = utiliserServices();
  const { rafraichir } = utiliserVisites();
  const [enCours, setEnCours] = useState<EtapeEnvoiAvis | null>(null);
  const [refus, setRefus] = useState<RefusEnvoiAvis | null>(null);
  const [envoye, setEnvoye] = useState<AvisEnvoye | null>(null);
  const occupe = useRef(false);
  const deposee = useRef<PhotoDeposee | null>(null);

  const envoyer = useCallback(
    async (saisie: AvisAEnvoyer) => {
      if (occupe.current) return;
      occupe.current = true;
      setRefus(null);
      try {
        const resultat = await envoyerAvisAvecPhoto({
          service: services.avis,
          saisie,
          deposee: deposee.current,
          lireFichier: lireFichierPhoto,
          surEtape: setEnCours,
        });
        deposee.current = resultat.deposee;
        if (!resultat.ok) return setRefus(resultat.refus);
        setEnvoye(resultat.envoye);
        void rafraichir();
      } finally {
        occupe.current = false;
        setEnCours(null);
      }
    },
    [services, rafraichir],
  );

  const oublierRefus = useCallback(() => setRefus(null), []);

  return { enCours, refus, envoye, envoyer, oublierRefus };
}
