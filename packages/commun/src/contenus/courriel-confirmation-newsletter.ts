import type { ParLangue, Traduction } from "../types/traduction.ts";
import { TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_ANGLAIS } from "./anglais/courriel-confirmation-newsletter.ts";

export const TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER = {
  objet: "Un petit clic pour confirmer ta newsletter 🛟",
  titre: "Encore un petit clic, et tu es des nôtres !",
  paragraphes: (echeance: string) => [
    "Quelqu'un (toi, on espère !) vient de demander la newsletter de SOS Miam avec cette adresse : les nouveaux lieux, les nouvelles villes et les BIG SOS près de chez toi.",
    "Avant de t'écrire, on préfère vérifier que c'est bien toi. Un clic sur le bouton, et tu rejoins les Miamis.",
    `Le lien marche jusqu'au ${echeance}, une seule fois. Déjà inscrit ? Il met simplement tes infos à jour.`,
    "Tu n'as rien demandé ? Ignore ce mail : sans clic, la demande s'efface toute seule au bout de 7 jours, et le Capitaine Bouiboui retourne à sa sieste.",
  ],
  bouton: "Je confirme mon inscription",
  pieds: {
    app: "Tu reçois ce mail parce que la case de la newsletter était cochée à la création d'un compte SOS Miam avec cette adresse. Sans ton clic, tu ne recevras aucune newsletter.",
    site: "Tu reçois ce mail parce que cette adresse a été tapée dans le formulaire « Préviens-moi » de sosmiam.fr. Sans ton clic, tu ne recevras aucune newsletter.",
  },
};

export const TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER>> = {
  fr: TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER,
  en: TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_ANGLAIS,
};
