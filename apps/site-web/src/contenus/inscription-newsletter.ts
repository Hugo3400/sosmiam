import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_INSCRIPTION_NEWSLETTER_ANGLAIS } from "~/contenus/anglais/inscription-newsletter";

export const TEXTES_INSCRIPTION_NEWSLETTER = {
  titre: "Prêt à sauver ta première table ?",
  intro: "L'app est encore en cuisine : laisse ton e-mail, on te prévient dès qu'elle arrive près de chez toi.",
  email: { libelle: "Ton e-mail", exemple: "ton@email.fr" },
  ville: { libelle: "Ta ville ou ta région", facultatif: "(facultatif)" },
  telephone: {
    question: "Ton téléphone (pour savoir sur quel store sortir l'app) :",
    iphone: "iPhone (Apple)",
    android: "Android (Samsung, Google Pixel ou autre)",
  },
  beta: {
    libelle: "Je veux tester l'app avant sa sortie (bêta)",
    aide: "Choisis aussi ton téléphone juste au-dessus. Sur Android, ton e-mail doit être celui de ton compte Google (souvent ton Gmail) ; sur iPhone, de préférence celui de ton compte Apple.",
  },
  ambassadeur: "Je veux devenir ambassadeur (dès 18 ans)",
  envoi: "Envoi…",
  bouton: "Préviens-moi",
  mentions: {
    avant:
      "D'abord, un mail pour vérifier que l'adresse est bien la tienne : sans ton clic, pas de newsletter. Ensuite, on te prévient du lancement, puis on t'envoie la newsletter (un mail suffit pour te désinscrire). Si tu coches la bêta, on transmet ton adresse à Google ou à Apple pour t'inviter à tester l'app ; si tu coches ambassadeur, on t'invite par mail à créer ton compte sur ambassadeur.sosmiam.fr. On ne vend jamais tes données",
    lien: "confidentialité",
    nouvelOnglet: ", s'ouvre dans un nouvel onglet",
  },
  erreurs: {
    "email-invalide": "Oups, cette adresse e-mail ne semble pas valide.",
    "telephone-requis": "Pour la bêta, dis-nous si tu as un iPhone ou un Android.",
    "trop-de-demandes": "Doucement ! Trop d'essais d'affilée : réessaie dans quelques minutes.",
    erreur: "Oups, ton inscription n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  },
  confirmation: (ou: string) =>
    `Presque fini ! Un lien de confirmation t'attend dans ta boîte mail (jette un œil aux spams) : un clic, et on te prévient dès que SOS Miam arrive ${ou}. 🛟`,
  ou: (lieu: { nom: string; ou: string } | null) => lieu?.ou ?? "près de chez toi",
  suiteBeta: "On t'invite à tester la bêta dès qu'elle est prête. 🧪",
  suiteAmbassadeur: "On t'écrira aussi pour t'inviter dans l'espace ambassadeur (dès 18 ans). 🎖️",
};

export const TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INSCRIPTION_NEWSLETTER>> = {
  fr: TEXTES_INSCRIPTION_NEWSLETTER,
  en: TEXTES_INSCRIPTION_NEWSLETTER_ANGLAIS,
};
