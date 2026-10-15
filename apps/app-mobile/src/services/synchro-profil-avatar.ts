// L'avatar dans la synchro du profil (services/synchro-profil.ts) : il vit à part du profil (stockage/avatar-local.ts),
// le moteur en garde la copie à jour comme celle du profil, l'écrit sur le téléphone et la met à l'écran. Ne part que
// l'emoji ou le Miami (ecrireAvatarPublic) ; une photo ne quitte jamais le téléphone.
import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { fusionnerAvatarServeur } from "~/fonctions/compte/fusionner-avatar-serveur";
import { marquer, type Memoire } from "~/services/synchro-profil-memoire";
import { enregistrerAvatarLocal, supprimerPhotoAvatar, type Avatar } from "~/stockage/avatar-local";

/** La copie de l'avatar du moteur ; `afficher` le met à l'écran */
export function creerCopieAvatar(afficher: (avatar: Avatar) => void) {
  // null : pas encore lu au démarrage (aucun choix n'est fait sans lui)
  let avatar: Avatar | null = null;

  function poser(nouveau: Avatar) {
    avatar = nouveau;
    afficher(nouveau);
  }

  /** Écrit l'avatar sur le téléphone, puis à l'écran ; une photo remplacée quitte les fichiers de l'app */
  async function ecrire(nouveau: Avatar) {
    const avant = avatar;
    await enregistrerAvatarLocal(nouveau);
    poser(nouveau);
    if (avant?.type === "photo" && !(nouveau.type === "photo" && nouveau.uri === avant.uri)) supprimerPhotoAvatar(avant.uri);
  }

  return {
    /** L'avatar lu au démarrage, ou remis par défaut (effacé) : rien n'est écrit sur le téléphone */
    poser,
    ecrire,
    /** Ce qui part pour l'avatar : l'emoji ou « miami:<id> » ; null pour une photo (rien ne part) */
    enPublic: () => (avatar ? ecrireAvatarPublic(avatar) : null),
    /**
     * L'avatar du serveur, sous le verrou du moteur (règles : fusionnerAvatarServeur) : marqué, celui du téléphone gagne ;
     * sinon, il prend celui du serveur, le garde (photo, Miami inconnu) ou part (rattrapage : marque « à envoyer »)
     */
    async recevoir(memoire: Memoire, serveur: string | null, rattrapage: boolean) {
      if (!avatar) return;
      memoire.avatarRefuse = false;
      memoire.etat.avatarServeur = serveur;
      if (memoire.etat.aEnvoyer.some((m) => m.champ === "avatar")) return;
      const choix = fusionnerAvatarServeur(avatar, serveur, rattrapage);
      if (choix.faire === "envoyer") marquer(memoire, ["avatar"]);
      // Le téléphone n'arrive pas à l'écrire : la prochaine lecture refera le même choix
      else if (choix.faire === "adopter") await ecrire(choix.avatar).catch(() => undefined);
    },
  };
}
