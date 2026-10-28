import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_DISCUSSION_ANGLAIS } from "~/contenus/anglais/textes-ecran-discussion";

export const TEXTES_ECRAN_DISCUSSION = {
  retour: "Retour",
  retourMessages: "Retour à mes messages",
  plusPersonneTitre: "Plus personne au bout du fil",
  plusPersonneTexte: "Cette discussion n'est plus là : tu as peut-être quitté le groupe, ou bloqué la personne. Tes autres potes, eux, t'attendent !",
  plusLesMessagesDe: (prenom: string) => `🚫 C'est fait : tu ne verras plus les messages de ${prenom}`,
  bloque: (prenom: string) => `C'est fait : tu as bloqué ${prenom}.`,
  quitte: (titre: string) => `Tu as quitté ${titre}.`,
  enPause: "Discussion en pause",
  enPauseTitre: "🛡️ Discussion en pause",
  plusSurSosMiam: "Cette personne n'est plus sur SOS Miam : tu peux relire vos messages, mais plus lui en envoyer.",
  plusDansBande: (prenom: string) => `${prenom} n'est plus dans ta bande : vos messages restent là, mais pour vous réécrire, il faut d'abord vous rajouter.`,
  voirProfil: (prenom: string) => `Voir le profil de ${prenom}`,
  quelquun: "Quelqu'un",
  creePar: "toi",
  messages: "Messages",
  messagesNonLus: (nonLus: number) => `Messages, ${nonLus} non lu${nonLus > 1 ? "s" : ""}`,
  messagesIntro: "En privé ou en groupe, avec ta bande. Les meilleurs plans miam commencent par un « t'as faim ? ».",
  finSondageLue: (libelle: string, heure: string) => `${libelle}, à ${heure}`,
} as const;

export const TEXTES_ECRAN_DISCUSSION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_DISCUSSION>> = { fr: TEXTES_ECRAN_DISCUSSION, en: TEXTES_ECRAN_DISCUSSION_ANGLAIS };
