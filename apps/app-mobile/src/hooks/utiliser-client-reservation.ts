import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { utiliserProfil } from "~/hooks/utiliser-profil";

export function utiliserClientReservation(): { prenom: string; avatar: string } {
  const { profil, avatar } = utiliserProfil();
  const initiale = profil?.nom?.trim().charAt(0).toLocaleUpperCase("fr-FR");
  const prenom = profil ? (initiale ? `${profil.prenom} ${initiale}.` : profil.prenom) : "Toi";
  return { prenom, avatar: ecrireAvatarPublic(avatar) ?? "🙂" };
}
