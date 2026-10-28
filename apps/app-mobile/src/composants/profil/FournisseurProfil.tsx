import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { preparerPhotoProfil } from "~/fonctions/compte/preparer-photo-profil";
import { ContexteProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSynchroProfil } from "~/hooks/utiliser-synchro-profil";
import { AVATAR_PAR_DEFAUT, effacerAvatarLocal, garderPhotoAvatar, lireAvatarLocal, supprimerPhotoAvatar, type Avatar } from "~/stockage/avatar-local";
import { effacerModeInvite, enregistrerModeInvite, lireModeInvite } from "~/stockage/mode-invite";
import { effacerProfilLocal, lireProfilLocal } from "~/stockage/profil-local";
import { lireVerrouAge } from "~/stockage/verrou-age";

/**
 * Android peut fermer l'app pendant l'appareil photo ou le recadrage : la photo choisie attend alors dans le sélecteur.
 * On la reprend comme avatar au démarrage suivant ; au moindre souci, on garde l'avatar actuel.
 */
async function reprendrePhotoEnAttente(): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  try {
    const enAttente = await ImagePicker.getPendingResultAsync();
    // Une erreur du sélecteur n'a pas de « canceled » : rien à reprendre
    if (!enAttente || !("canceled" in enAttente) || enAttente.canceled || enAttente.assets.length === 0) return null;
    return await garderPhotoAvatar(await preparerPhotoProfil(enAttente.assets[0].uri));
  } catch {
    return null;
  }
}

/** Oublie la visite sans compte sur le téléphone ; si ça coince, tant pis : un profil ou un verrou d'âge passe toujours avant. */
const oublierModeInvite = () => effacerModeInvite().catch(() => {});

/**
 * Lit le profil, l'avatar et la visite sans compte au démarrage et les met à disposition de toute l'app (voir utiliserProfil).
 * Une visite sans compte ne reprend pas si un profil existe ou si un verrou d'âge est posé sur ce téléphone (retour à l'inscription).
 * Avec un compte connecté (hors démo), le profil se synchronise avec le serveur, qui fait foi (utiliserSynchroProfil), et
 * ton avatar avec.
 */
export function FournisseurProfil({ children }: { children: ReactNode }) {
  const session = utiliserSession();
  const [profil, setProfilAffiche] = useState<Profil | null>(null);
  const [avatar, setAvatar] = useState<Avatar>(AVATAR_PAR_DEFAUT);
  // La synchro garde la copie à jour du profil et de l'avatar (relue au retour de chaque réponse du serveur) et les écrit sur le téléphone
  const synchro = utiliserSynchroProfil({
    actif: session.pret && session.connecte && profil !== null,
    afficherProfil: setProfilAffiche,
    afficherAvatar: setAvatar,
  });
  const { poserProfil: setProfil, poserAvatar, modifierAvatar: changerAvatar, retirerPhoto, installer, oublier, modifierInfos, modifierEnvies } = synchro;
  const { annonce, fermerAnnonce, pseudoMisDeCote, etatPhoto } = synchro;

  const [inviteBrut, setInvite] = useState(false);
  const [chargement, setChargement] = useState(true);
  const invite = profil === null && inviteBrut;
  // Les entrées en visite qui attendent que les écrans de la visite soient ouverts, et ce qui est affiché en ce moment
  const enAttenteInvite = useRef<(() => void)[]>([]);
  const inviteAffichee = useRef(false);

  useEffect(() => {
    (async () => {
      const [lu, avatarLu, inviteLue] = await Promise.all([lireProfilLocal(), lireAvatarLocal(), lireModeInvite()]);
      const photoReprise = lu ? await reprendrePhotoEnAttente() : null;
      let inviteFinale = false;
      if (inviteLue) {
        if (lu || (await lireVerrouAge())) await oublierModeInvite();
        else inviteFinale = true;
      }
      // L'avatar avant le profil : la synchro (qui démarre avec le profil) ne tourne jamais sans lui
      poserAvatar(avatarLu);
      setProfil(lu);
      setInvite(inviteFinale);
      if (photoReprise) await changerAvatar({ type: "photo", uri: photoReprise, partage: "a-envoyer" }).catch(() => supprimerPhotoAvatar(photoReprise));
    })()
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [setProfil, poserAvatar, changerAvatar]);

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

  // Un profil complet qui vient du serveur ou vient d'y partir : la synchro l'installe sans rien renvoyer
  const enregistrer = useCallback(
    async (nouveau: Profil) => {
      await installer(nouveau);
      await oublierModeInvite();
      setInvite(false);
    },
    [installer],
  );

  // La synchro d'abord : les marques « à envoyer » d'un compte ne doivent jamais partir avec le compte suivant
  const effacer = useCallback(async () => {
    await oublier();
    await Promise.all([effacerProfilLocal(), effacerAvatarLocal(), oublierModeInvite()]);
    poserAvatar(AVATAR_PAR_DEFAUT);
    setInvite(false);
    setProfil(null);
  }, [oublier, setProfil, poserAvatar]);

  const valeur = useMemo(
    () => ({
      profil, chargement, invite, entrerEnInvite, quitterInvite, enregistrer, modifierInfos, modifierEnvies, annonce, fermerAnnonce, pseudoMisDeCote,
      effacer, avatar, changerAvatar, retirerPhoto, etatPhoto,
    }),
    [
      profil, chargement, invite, entrerEnInvite, quitterInvite, enregistrer, modifierInfos, modifierEnvies, annonce, fermerAnnonce, pseudoMisDeCote, effacer,
      avatar, changerAvatar, retirerPhoto, etatPhoto,
    ],
  );
  return <ContexteProfil.Provider value={valeur}>{children}</ContexteProfil.Provider>;
}
