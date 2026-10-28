import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MENU_COMMENTAIRE_ANGLAIS } from "~/contenus/anglais/textes-menu-commentaire";

export const TEXTES_MENU_COMMENTAIRE = {
  masquer: "Masquer (au nom du lieu)",
  detailMasquer: "Il disparaît de ta publication et part en modération",
  modifier: "Modifier",
  detailModifier: "Une faute, un mot à ajouter ? On corrige",
  supprimer: "Supprimer",
  detailSupprimer: "Il disparaîtra de la publication",
  signaler: "Signaler",
  detailSignaler: "Insulte, arnaque, contenu choquant…",
  bloquer: (nom: string) => `Bloquer ${nom}`,
  detailBloquer: "Tu ne verras plus ses commentaires ni ses messages",
  titres: {
    supprimerMien: "Supprimer ton commentaire ?",
    supprimerLieu: "Supprimer la réponse du lieu ?",
    bloquer: (nom: string) => `Bloquer ${nom} ?`,
    masquer: (nom: string) => `Masquer le commentaire de ${nom} ?`,
  },
  details: {
    supprimer: "Il disparaîtra de la publication, et ses J'aime avec. Pas de retour en arrière possible.",
    bloquer: (nom: string, dansBande: boolean) =>
      `${dansBande ? `${nom} sortira de ta bande, et tu` : "Tu"} ne verras plus ses commentaires ni ses messages. Si tu changes d'avis, ça se passe dans Paramètres, « Personnes bloquées ».`,
    masquer:
      "Il disparaît de ta publication pour tout le monde et part en modération : l'équipe SOS Miam le relit. Son auteur est prévenu, et lui seul le voit encore. Tu pourras annuler juste après.",
  },
  boutonMasquer: "Masquer",
  titreMien: "Ton commentaire",
  titreLieu: "La réponse du lieu",
  titreAutre: (nom: string) => `Commentaire de ${nom}`,
  fermer: "Fermer les options",
  garder: "Non, on garde",
  annuler: "Annuler",
};

export const TEXTES_MENU_COMMENTAIRE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MENU_COMMENTAIRE>> = { fr: TEXTES_MENU_COMMENTAIRE, en: TEXTES_MENU_COMMENTAIRE_ANGLAIS };
