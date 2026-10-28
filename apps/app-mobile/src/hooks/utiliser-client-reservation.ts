import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function utiliserClientReservation(): { prenom: string; avatar: string } {
  const { profil, avatar } = utiliserProfil();
  const T = utiliserTextes(CARTE_RESERVATION_PAR_LANGUE);
  const initiale = profil?.nom?.trim().charAt(0).toLocaleUpperCase("fr-FR");
  const prenom = profil ? (initiale ? `${profil.prenom} ${initiale}.` : profil.prenom) : T.toi;
  return { prenom, avatar: ecrireAvatarPublic(avatar) ?? "🙂" };
}
