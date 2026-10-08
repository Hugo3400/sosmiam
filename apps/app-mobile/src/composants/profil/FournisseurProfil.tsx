import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Profil } from "@sos-miam/commun/types/profil";
import { ContexteProfil } from "~/hooks/utiliser-profil";
import {
  AVATAR_PAR_DEFAUT,
  effacerAvatarLocal,
  enregistrerAvatarLocal,
  lireAvatarLocal,
  supprimerPhotoAvatar,
  type Avatar,
} from "~/stockage/avatar-local";
import { effacerProfilLocal, enregistrerProfilLocal, lireProfilLocal } from "~/stockage/profil-local";

/** Lit le profil et l'avatar au démarrage et les met à disposition de toute l'app (voir utiliserProfil). */
export function FournisseurProfil({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [avatar, setAvatar] = useState<Avatar>(AVATAR_PAR_DEFAUT);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([lireProfilLocal(), lireAvatarLocal()]).then(([lu, avatarLu]) => {
      setProfil(lu);
      setAvatar(avatarLu);
      setChargement(false);
    });
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
