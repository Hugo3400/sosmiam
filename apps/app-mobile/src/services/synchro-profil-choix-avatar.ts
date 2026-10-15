import type { Profil } from "@sos-miam/commun/types/profil";
import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import { lireAvatarPublic } from "~/fonctions/compte/lire-avatar-public";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { oublierMarques, type EtatPhotoSynchro, type Memoire } from "~/services/synchro-profil-memoire";
import { AVATAR_PAR_DEFAUT, type Avatar } from "~/stockage/avatar-local";
import type { ChampSynchro, SynchroProfil } from "~/stockage/synchro-profil";

type OutilsChoix = {
  lireMemoire: () => Memoire;
  lireProfil: () => Profil | null;
  sousVerrou: <T>(etape: () => Promise<T>) => Promise<T>;
  marquerAvantEcriture: (champs: ChampSynchro[]) => Promise<void>;
  lireAvatar: () => Avatar | null;
  ecrireAvatar: (avatar: Avatar) => Promise<void>;
  garder: () => void;
  lancer: () => void;
  oublierAttentePhoto: (m: Memoire) => void;
  montrerPhoto: (etat: EtatPhotoSynchro | null) => void;
};

type EtatAvant = Pick<SynchroProfil, "aEnvoyer" | "retraitPhoto">;

export function creerChoixAvatar(o: OutilsChoix) {
  const partageable = () => o.lireProfil() !== null && !DEMO_VISITES_ACTIVE;

  function retirerMarqueAvatar(m: Memoire) {
    if (!m.etat.aEnvoyer.some((x) => x.champ === "avatar")) return;
    oublierMarques(m, ["avatar"], m.numero);
    o.garder();
  }

  function poserRetrait(m: Memoire, oui: boolean) {
    if (oui) m.etat.retraitPhoto = true;
    else delete m.etat.retraitPhoto;
  }

  function preparer(m: Memoire): EtatAvant {
    const avant: EtatAvant = { aEnvoyer: m.etat.aEnvoyer, retraitPhoto: m.etat.retraitPhoto };
    o.oublierAttentePhoto(m);
    o.montrerPhoto(null);
    return avant;
  }

  async function ecrireOuRendre(m: Memoire, nouveau: Avatar, avant: EtatAvant) {
    try {
      await o.ecrireAvatar(nouveau);
    } catch (erreur) {
      if (m === o.lireMemoire()) {
        m.etat.aEnvoyer = avant.aEnvoyer;
        poserRetrait(m, avant.retraitPhoto === true);
        o.garder();
      }
      throw erreur;
    }
  }

  async function modifierAvatar(nouveau: Avatar) {
    await o.sousVerrou(async () => {
      const m = o.lireMemoire();
      const avant = preparer(m);
      const choix: Avatar = nouveau.type === "photo" && nouveau.partage === "a-envoyer" && !partageable() ? { type: "photo", uri: nouveau.uri } : nouveau;
      poserRetrait(m, false);
      if (choix.type === "photo" && choix.partage !== "a-envoyer") retirerMarqueAvatar(m);
      else if (partageable()) await o.marquerAvantEcriture(["avatar"]);
      await ecrireOuRendre(m, choix, avant);
    });
    o.lancer();
  }

  async function retirerPhoto() {
    await o.sousVerrou(async () => {
      const m = o.lireMemoire();
      if (o.lireAvatar()?.type !== "photo") return;
      const avant = preparer(m);
      const serveur = m.etat.avatarServeur;
      const enLigne = partageable() && (serveur === undefined || lireAvatarPhoto(serveur) !== null);
      poserRetrait(m, enLigne);
      if (enLigne) {
        await o.marquerAvantEcriture(["avatar"]);
        return ecrireOuRendre(m, AVATAR_PAR_DEFAUT, avant);
      }
      retirerMarqueAvatar(m);
      const repli = partageable() && serveur ? lireAvatarPublic(serveur) : null;
      await ecrireOuRendre(m, repli ?? AVATAR_PAR_DEFAUT, avant);
    });
    o.lancer();
  }

  return { modifierAvatar, retirerPhoto };
}
