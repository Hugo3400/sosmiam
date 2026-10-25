import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import { creerImagesLieuApi } from "@sos-miam/commun/client-api/api/api-images-lieu";
import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { ImageLieu } from "@sos-miam/commun/regles/images-lieu";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/textes-images-lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lireSourceImageLieu } from "~/fonctions/lieux/lire-source-image-lieu";
import { oublierFichierPhoto } from "~/fonctions/photos/oublier-fichier-photo";
import { preparerImageLieuAEnvoyer } from "~/fonctions/photos/preparer-image-lieu-a-envoyer";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export type EtapeImageLieu = "preparation" | "envoi";

const OPTIONS_GALERIE: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };

export function utiliserImagesLieuPro(lieuId: number | null, lieu: Pick<Lieu, "banniere" | "logo"> | undefined) {
  const { client } = utiliserSession();
  const service = useMemo(() => creerImagesLieuApi(client), [client]);
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE);
  const [changees, setChangees] = useState<Partial<Record<ImageLieu, ImageSourcePropType | null>>>({});
  const [occupee, setOccupee] = useState<{ quelle: ImageLieu; etape: EtapeImageLieu } | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const enCours = useRef(false);

  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const annoncerRefus = useCallback(
    (erreur: keyof typeof MESSAGES_SERVICE_PAR_LANGUE.fr) => {
      const message = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue)[erreur];
      annoncer(`${message.titre}. ${message.texte}`);
    },
    [annoncer, langue],
  );

  const choisir = useCallback(
    async (quelle: ImageLieu) => {
      if (lieuId === null || enCours.current) return;
      enCours.current = true;
      try {
        const resultat = await ImagePicker.launchImageLibraryAsync(OPTIONS_GALERIE).catch(() => undefined);
        if (resultat === undefined) return annoncer(T.galerieFermee);
        if (resultat.canceled || resultat.assets.length === 0) return;
        setOccupee({ quelle, etape: "preparation" });
        const preparee = await preparerImageLieuAEnvoyer(resultat.assets[0].uri, quelle).catch(() => null);
        if (preparee === null) return annoncer(T.illisible);
        if (preparee === "trop-lourde") return annoncer(T.tropLourde);
        setOccupee({ quelle, etape: "envoi" });
        const r = await service.envoyer(lieuId, quelle, preparee.fichier);
        if (!r.ok) {
          oublierFichierPhoto(preparee.uri);
          return annoncerRefus(r.erreur);
        }
        vibrerLegerement();
        setChangees((c) => ({ ...c, [quelle]: { uri: preparee.uri } }));
        annoncer(T[quelle].envoyee);
      } finally {
        enCours.current = false;
        setOccupee(null);
      }
    },
    [annoncer, annoncerRefus, lieuId, service, T],
  );

  const retirer = useCallback(
    async (quelle: ImageLieu) => {
      if (lieuId === null || enCours.current) return;
      enCours.current = true;
      setOccupee({ quelle, etape: "envoi" });
      try {
        const r = await service.retirer(lieuId, quelle);
        if (!r.ok) return annoncerRefus(r.erreur);
        vibrerLegerement();
        setChangees((c) => ({ ...c, [quelle]: null }));
        annoncer(T[quelle].retiree);
      } finally {
        enCours.current = false;
        setOccupee(null);
      }
    },
    [annoncer, annoncerRefus, lieuId, service, T],
  );

  const lireSource = (quelle: ImageLieu): ImageSourcePropType | null =>
    quelle in changees ? (changees[quelle] ?? null) : lieu ? lireSourceImageLieu(lieu, quelle) : null;

  return { T, banniere: lireSource("banniere"), logo: lireSource("logo"), occupee, annonce, finAnnonce: () => setAnnonce(null), choisir, retirer };
}
