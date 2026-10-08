import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { ContexteProfil } from "~/hooks/utiliser-profil";
import {
  AVATAR_PAR_DEFAUT,
  effacerAvatarLocal,
  enregistrerAvatarLocal,
  garderPhotoAvatar,
  lireAvatarLocal,
  supprimerPhotoAvatar,
  type Avatar,
} from "~/stockage/avatar-local";
import { effacerProfilLocal, enregistrerProfilLocal, lireProfilLocal } from "~/stockage/profil-local";

/**
 * Android peut fermer l'app pendant l'appareil photo ou le recadrage : la photo choisie attend alors dans le sélecteur.
 * On la reprend comme avatar au démarrage suivant ; au moindre souci, on garde l'avatar actuel.
 */
async function reprendrePhotoEnAttente(actuel: Avatar): Promise<Avatar> {
  if (Platform.OS !== "android") return actuel;
  let uri: string | null = null;
  try {
    const enAttente = await ImagePicker.getPendingResultAsync();
    // Une erreur du sélecteur n'a pas de « canceled » : rien à reprendre
    if (!enAttente || !("canceled" in enAttente) || enAttente.canceled || enAttente.assets.length === 0) return actuel;
    uri = await garderPhotoAvatar(enAttente.assets[0].uri);
    const nouveau: Avatar = { type: "photo", uri };
    await enregistrerAvatarLocal(nouveau);
    if (actuel.type === "photo") supprimerPhotoAvatar(actuel.uri);
    return nouveau;
  } catch {
    if (uri) supprimerPhotoAvatar(uri);
    return actuel;
  }
}

/** Lit le profil et l'avatar au démarrage et les met à disposition de toute l'app (voir utiliserProfil). */
export function FournisseurProfil({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [avatar, setAvatar] = useState<Avatar>(AVATAR_PAR_DEFAUT);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      const [lu, avatarLu] = await Promise.all([lireProfilLocal(), lireAvatarLocal()]);
      const avatarFinal = lu ? await reprendrePhotoEnAttente(avatarLu) : avatarLu;
      setProfil(lu);
      setAvatar(avatarFinal);
    })()
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  const enregistrer = useCallback(async (nouveau: Profil) => {
    await enregistrerProfilLocal(nouveau);
    setProfil(nouveau);
  }, []);

  const effacer = useCallback(async () => {
    await Promise.all([effacerProfilLocal(), effacerAvatarLocal()]);
    setAvatar(AVATAR_PAR_DEFAUT);
    setProfil(null);
  }, []);

  const changerAvatar = useCallback(
    async (nouveau: Avatar) => {
      await enregistrerAvatarLocal(nouveau);
      if (avatar.type === "photo" && !(nouveau.type === "photo" && nouveau.uri === avatar.uri)) supprimerPhotoAvatar(avatar.uri);
      setAvatar(nouveau);
    },
    [avatar],
  );

  const valeur = useMemo(
    () => ({ profil, chargement, enregistrer, effacer, avatar, changerAvatar }),
    [profil, chargement, enregistrer, effacer, avatar, changerAvatar],
  );
  return <ContexteProfil.Provider value={valeur}>{children}</ContexteProfil.Provider>;
}
