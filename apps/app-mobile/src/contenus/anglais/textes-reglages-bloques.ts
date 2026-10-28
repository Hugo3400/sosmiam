import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_BLOQUES } from "~/contenus/textes-reglages-bloques";

export const TEXTES_REGLAGES_BLOQUES_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_BLOQUES> = {
  debloque: (prenom: string) => `Done – you've unblocked ${prenom}. You'll see ${prenom}'s messages and comments again, but that doesn't put ${prenom} back in your crew.`,
  confirmerTitre: (prenom: string) => `Unblock ${prenom}?`,
  confirmerTexte: "You'll see their messages and comments again. Unblocking doesn't put anyone back in your crew.",
  annuler: "Cancel",
  debloquer: "Unblock",
  debloquerLu: (prenom: string) => `Unblock ${prenom}`,
  titre: "Blocked people",
  sousTitre: "You no longer see their messages or comments. And you can change your mind whenever you like.",
  videTitre: "Only good vibes",
  videTexte:
    "You haven't blocked anyone. If someone ever bothers you, “Block” is waiting on their profile, their messages and their comments – and you'll find them here.",
  nombre: (n: number) => `${n} ${n === 1 ? "person" : "people"} blocked`,
  note: "Unblocking someone doesn't put them back in your crew. And for now, this list stays on your phone.",
};
