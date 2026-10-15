import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";

import type { PhotoAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { preparerPhotoChat } from "~/fonctions/chat/preparer-photo-chat";

export type EtatPhotoAvis = {
  photo: PhotoAvis | null;
  preparation: boolean;
  erreur: string | null;
  choisir: () => Promise<void>;
  retirer: () => void;
};

const OPTIONS_PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };

async function ouvrirGalerie(): Promise<string | null> {
  const resultat = await ImagePicker.launchImageLibraryAsync(OPTIONS_PHOTO);
  if (resultat.canceled || resultat.assets.length === 0) return null;
  return resultat.assets[0].uri;
}

export function utiliserPhotoAvis(): EtatPhotoAvis {
  const [photo, setPhoto] = useState<PhotoAvis | null>(null);
  const [preparation, setPreparation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const occupe = useRef(false);

  const choisir = useCallback(async () => {
    if (occupe.current) return;
    occupe.current = true;
    setErreur(null);
    try {
      const uri = await ouvrirGalerie().catch(() => undefined);
      if (uri === undefined) return setErreur(TEXTES_DONNER_AVIS.photoGalerieFermee);
      if (uri === null) return;
      setPreparation(true);
      const prete = await preparerPhotoChat(uri).catch(() => null);
      if (prete) setPhoto(prete);
      else setErreur(TEXTES_DONNER_AVIS.photoIllisible);
    } finally {
      occupe.current = false;
      setPreparation(false);
    }
  }, []);

  const retirer = useCallback(() => {
    setPhoto(null);
    setErreur(null);
  }, []);

  return { photo, preparation, erreur, choisir, retirer };
}
