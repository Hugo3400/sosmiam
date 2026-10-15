import { useCallback, useRef, useState } from "react";

import type { NoteAvis } from "@sos-miam/commun/types/avis";
import { validerAvis } from "@sos-miam/commun/validation/valider-avis";

import type { AvisEnvoye, EtapeEnvoiAvis, PhotoAvis, RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { classerRefusAvis } from "~/fonctions/avis/classer-refus-avis";
import { lireFichierPhoto } from "~/fonctions/photos/lire-fichier-photo";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export type AvisAEnvoyer = { visiteId: number; note: NoteAvis; texte: string; photo: PhotoAvis | null };

export type EtatEnvoiAvis = {
  enCours: EtapeEnvoiAvis | null;
  refus: RefusEnvoiAvis | null;
  envoye: AvisEnvoye | null;
  envoyer: (avis: AvisAEnvoyer) => Promise<void>;
  oublierRefus: () => void;
};

type PhotoDeposee = { uri: string; nom: string };

export function utiliserEnvoiAvis(): EtatEnvoiAvis {
  const services = utiliserServices();
  const { rafraichir } = utiliserVisites();
  const [enCours, setEnCours] = useState<EtapeEnvoiAvis | null>(null);
  const [refus, setRefus] = useState<RefusEnvoiAvis | null>(null);
  const [envoye, setEnvoye] = useState<AvisEnvoye | null>(null);
  const occupe = useRef(false);
  const deposee = useRef<PhotoDeposee | null>(null);

  const deposerPhoto = useCallback(
    async (photo: PhotoAvis): Promise<string | RefusEnvoiAvis> => {
      if (deposee.current?.uri === photo.uri) return deposee.current.nom;
      setEnCours("photo");
      const fichier = await lireFichierPhoto(photo.uri).catch(() => null);
      if (!fichier) return { ou: "photo", erreur: "media-invalide" };
      const r = await services.avis.envoyerPhotoAvis(fichier).catch(() => ({ ok: false as const, erreur: "hors-ligne" as const }));
      if (!r.ok) return classerRefusAvis(r, "photo");
      deposee.current = { uri: photo.uri, nom: r.photo };
      return r.photo;
    },
    [services],
  );

  const envoyer = useCallback(
    async ({ visiteId, note, texte, photo }: AvisAEnvoyer) => {
      if (occupe.current) return;
      if (validerAvis({ visiteId, note, texte, photo: null })) return setRefus({ ou: "texte" });
      occupe.current = true;
      setRefus(null);
      try {
        const nomPhoto = photo ? await deposerPhoto(photo) : null;
        if (nomPhoto !== null && typeof nomPhoto !== "string") return setRefus(nomPhoto);
        setEnCours("avis");
        const r = await services.avis
          .envoyerAvis({ visiteId, note, texte: texte.trim(), photo: nomPhoto })
          .catch(() => ({ ok: false as const, erreur: "hors-ligne" as const }));
        if (!r.ok) {
          const classe = classerRefusAvis(r, "avis");
          if (classe.ou === "photo") deposee.current = null;
          return setRefus(classe);
        }
        setEnvoye({ avis: r.avis ?? null, pointsGagnes: r.pointsGagnes });
        void rafraichir();
      } finally {
        occupe.current = false;
        setEnCours(null);
      }
    },
    [services, deposerPhoto, rafraichir],
  );

  const oublierRefus = useCallback(() => setRefus(null), []);

  return { enCours, refus, envoye, envoyer, oublierRefus };
}
