import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";

import { preparerPhotoChat } from "~/fonctions/chat/preparer-photo-chat";

type Erreur = "galerie" | "illisible";

const OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };

export function utiliserChoixPhotoActus() {
  const [preparation, setPreparation] = useState(false);
  const [erreur, setErreur] = useState<Erreur | null>(null);
  const occupe = useRef(false);

  const choisir = useCallback(async (): Promise<string | null> => {
    if (occupe.current) return null;
    occupe.current = true;
    setErreur(null);
    try {
      const resultat = await ImagePicker.launchImageLibraryAsync(OPTIONS).catch(() => null);
      if (!resultat) {
        setErreur("galerie");
        return null;
      }
      if (resultat.canceled || resultat.assets.length === 0) return null;
      setPreparation(true);
      const prete = await preparerPhotoChat(resultat.assets[0].uri).catch(() => null);
      if (!prete) setErreur("illisible");
      return prete?.uri ?? null;
    } finally {
      occupe.current = false;
      setPreparation(false);
    }
  }, []);

  return { choisir, preparation, erreur };
}
