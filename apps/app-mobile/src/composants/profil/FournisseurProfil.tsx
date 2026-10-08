import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { effacerModeInvite, enregistrerModeInvite, lireModeInvite } from "~/stockage/mode-invite";
import { effacerProfilLocal, enregistrerProfilLocal, lireProfilLocal } from "~/stockage/profil-local";
import { lireVerrouAge } from "~/stockage/verrou-age";

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

/** Oublie la visite sans compte sur le téléphone ; si ça coince, tant pis : un profil ou un verrou d'âge passe toujours avant. */
const oublierModeInvite = () => effacerModeInvite().catch(() => {});

/**
 * Lit le profil, l'avatar et la visite sans compte au démarrage et les met à disposition de toute l'app (voir utiliserProfil).
 * Une visite sans compte ne reprend pas si un profil existe ou si un verrou d'âge est posé sur ce téléphone (retour à l'inscription).
 */
export function FournisseurProfil({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [avatar, setAvatar] = useState<Avatar>(AVATAR_PAR_DEFAUT);
  const [inviteBrut, setInvite] = useState(false);
  const [chargement, setChargement] = useState(true);
  const invite = profil === null && inviteBrut;
  // Les entrées en visite qui attendent que les écrans de la visite soient ouverts, et ce qui est affiché en ce moment
  const enAttenteInvite = useRef<(() => void)[]>([]);
  const inviteAffichee = useRef(false);

  useEffect(() => {
    (async () => {
      const [lu, avatarLu, inviteLue] = await Promise.all([lireProfilLocal(), lireAvatarLocal(), lireModeInvite()]);
      const avatarFinal = lu ? await reprendrePhotoEnAttente(avatarLu) : avatarLu;
      let inviteFinale = false;
      if (inviteLue) {
        if (lu || (await lireVerrouAge())) await oublierModeInvite();
        else inviteFinale = true;
      }
      setProfil(lu);
      setAvatar(avatarFinal);
      setInvite(inviteFinale);
    })()
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  // La visite est à l'écran (garde des écrans comprise) : on prévient ceux qui attendaient pour y naviguer
  useEffect(() => {
    inviteAffichee.current = invite;
    if (!invite) return;
    const attente = enAttenteInvite.current;
    enAttenteInvite.current = [];
    attente.forEach((reprendre) => reprendre());
  }, [invite]);

  const entrerEnInvite = useCallback(async () => {
    if (profil !== null || (await lireVerrouAge())) return false;
    // Même si le téléphone n'arrive pas à le retenir, la visite marche pour cette fois
    await enregistrerModeInvite().catch(() => {});
    if (inviteAffichee.current) return true;
    return new Promise<boolean>((resoudre) => {
      enAttenteInvite.current.push(() => resoudre(true));
      setInvite(true);
    });
  }, [profil]);

  const quitterInvite = useCallback(async () => {
    await oublierModeInvite();
    setInvite(false);
  }, []);

  const enregistrer = useCallback(async (nouveau: Profil) => {
    await enregistrerProfilLocal(nouveau);
    await oublierModeInvite();
    setProfil(nouveau);
    setInvite(false);
  }, []);

  const effacer = useCallback(async () => {
    await Promise.all([effacerProfilLocal(), effacerAvatarLocal(), oublierModeInvite()]);
    setAvatar(AVATAR_PAR_DEFAUT);
    setInvite(false);
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
    () => ({ profil, chargement, invite, entrerEnInvite, quitterInvite, enregistrer, effacer, avatar, changerAvatar }),
    [profil, chargement, invite, entrerEnInvite, quitterInvite, enregistrer, effacer, avatar, changerAvatar],
  );
  return <ContexteProfil.Provider value={valeur}>{children}</ContexteProfil.Provider>;
}
