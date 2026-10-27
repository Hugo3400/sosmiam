import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_VERIFICATION_EMAIL_ANGLAIS } from "~/contenus/anglais/verification-email";

export const TEXTES_VERIFICATION_EMAIL = {
  titre: "Confirmer mon e-mail",
  description: "Confirme l'adresse e-mail de ton compte SOS Miam.",
  chapo: "Un clic pour nous dire que cette adresse est bien la tienne.",
  confirme: "C'est confirmé !",
  dejaConfirmee: "Ton adresse est déjà confirmée",
  merci: "Merci ! L'équipe voit maintenant que ton adresse est bien la tienne.",
  allerEspace: "Aller dans mon espace",
  meConnecter: "Me connecter",
  jetonInvalide: "Ce lien ne marche plus : il a déjà servi, ou il a plus de 7 jours.",
  onVerifie: "On vérifie ton lien…",
  bouton: "Confirmer mon adresse",
  lienRefuse: "Ton lien ne marche plus ? On t'en envoie un nouveau, à l'adresse de ton compte.",
  pasRecu: "Pas reçu de lien ? On t'en envoie un nouveau, à l'adresse de ton compte.",
  renvoyerUnLien: "Renvoyer un lien",
  connecteToi: "Ton lien ne marche plus ? Connecte-toi : depuis ton espace, tu pourras t'en faire renvoyer un.",
  bandeau: {
    justeInscrit: "On t'a envoyé un lien pour confirmer ton e-mail (il marche 7 jours). Pense à regarder tes indésirables !",
    aConfirmer: "Confirme ton adresse e-mail : on t'a envoyé un lien.",
    bouton: "Renvoyer le lien",
  },
  renvoi: {
    dejaVerifie: "Bonne nouvelle : ton adresse est déjà confirmée !",
    envoye: "C'est reparti : un nouveau lien t'attend dans ta boîte mail (il marche 7 jours). Pense à regarder tes indésirables !",
    tropTot: (attente: string) => `Un lien est parti il y a peu : attends ${attente} avant d'en demander un autre (et regarde tes indésirables).`,
    pasParti: "Oups, le lien n'est pas parti. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  },
};

export const TEXTES_VERIFICATION_EMAIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_VERIFICATION_EMAIL>> = {
  fr: TEXTES_VERIFICATION_EMAIL,
  en: TEXTES_VERIFICATION_EMAIL_ANGLAIS,
};
