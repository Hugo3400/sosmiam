import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MENU_COMMENTAIRE } from "~/contenus/textes-menu-commentaire";

export const TEXTES_MENU_COMMENTAIRE_ANGLAIS: Traduction<typeof TEXTES_MENU_COMMENTAIRE> = {
  masquer: "Hide (on behalf of the place)",
  detailMasquer: "It disappears from your post and goes to moderation",
  modifier: "Edit",
  detailModifier: "A typo, a word to add? Fix it here",
  supprimer: "Delete",
  detailSupprimer: "It'll disappear from the post",
  signaler: "Report",
  detailSignaler: "Insults, scams, shocking content…",
  bloquer: (nom: string) => `Block ${nom}`,
  detailBloquer: "You won't see their comments or messages any more",
  titres: {
    supprimerMien: "Delete your comment?",
    supprimerLieu: "Delete the place's reply?",
    bloquer: (nom: string) => `Block ${nom}?`,
    masquer: (nom: string) => `Hide ${nom}'s comment?`,
  },
  details: {
    supprimer: "It'll disappear from the post, along with its likes. There's no going back.",
    bloquer: (nom: string, dansBande: boolean) =>
      `${dansBande ? `${nom} will leave your crew, and you` : "You"} won't see their comments or messages any more. If you change your mind, head to Settings › Blocked people.`,
    masquer:
      "It disappears from your post for everyone and goes to moderation, where the SOS Miam team reviews it. Its author is told, and they're the only one who can still see it. You can undo this straight after.",
  },
  boutonMasquer: "Hide",
  titreMien: "Your comment",
  titreLieu: "The place's reply",
  titreAutre: (nom: string) => `${nom}'s comment`,
  fermer: "Close the options",
  garder: "No, keep it",
  annuler: "Cancel",
};
