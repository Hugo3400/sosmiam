import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { lireAvatarPublic } from "~/fonctions/compte/lire-avatar-public";
import { AVATAR_PAR_DEFAUT, type Avatar } from "~/stockage/avatar-local";

/** Ce que devient l'avatar du téléphone : rien, il part au serveur, ou il prend celui du serveur */
export type ChoixAvatar = { faire: "rien" } | { faire: "envoyer" } | { faire: "adopter"; avatar: Avatar };

const RIEN: ChoixAvatar = { faire: "rien" };

/**
 * L'avatar lu sur le serveur, face à celui du téléphone (pas marqué « à envoyer » : sinon le téléphone gagne). Le serveur
 * fait foi, avec trois exceptions. Une photo ne quitte jamais le téléphone : il la garde, les autres voient ton dernier
 * emoji ou Miami. Rien sur le serveur et l'avatar par défaut ici : c'est pareil. Un Miami que cette version ne connaît pas
 * (ou le Capitaine) : on garde le tien, sans rien renvoyer. Rien sur le serveur et un autre avatar ici : au `rattrapage`
 * (avatar jamais lu sur ce téléphone : première synchro, version d'avant l'avatar, ou choisi pendant la visite avant
 * l'inscription), le tien part ; sinon, l'équipe l'a retiré et le téléphone revient à l'avatar par défaut, sans renvoi.
 */
export function fusionnerAvatarServeur(local: Avatar, serveur: string | null, rattrapage: boolean): ChoixAvatar {
  if (local.type === "photo") return RIEN;
  if (!serveur) {
    if (local.type === "emoji" && local.emoji === AVATAR_PAR_DEFAUT.emoji) return RIEN;
    return rattrapage ? { faire: "envoyer" } : { faire: "adopter", avatar: AVATAR_PAR_DEFAUT };
  }
  if (serveur === ecrireAvatarPublic(local)) return RIEN;
  const lu = lireAvatarPublic(serveur);
  return lu ? { faire: "adopter", avatar: lu } : RIEN;
}
