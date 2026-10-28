import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_SIGNALEMENT_ANGLAIS } from "~/contenus/anglais/textes-signalement";

export const TEXTES_SIGNALEMENT = {
  dangerLu: "Quelqu'un est en danger ?",
  danger: "🚨 Quelqu'un est en danger ?",
  dangerTexte:
    "Appelle tout de suite le 17 (police) ou le 112. Pour les contenus illégaux les plus graves, tu peux aussi alerter Pharos, la plateforme officielle de signalement.",
  appeler17Lu: "Appeler le 17",
  appeler17: "📞 Appeler le 17",
  pharosLu: "Ouvrir Pharos, la plateforme officielle de signalement",
  pharos: "Ouvrir Pharos →",
  masquageImmediat:
    "Ce type de contenu sera masqué pour tout le monde dès son premier signalement, le temps qu'un modérateur le vérifie (dès que l'app sera reliée à notre serveur).",
  plutot: "C'est plutôt…",
  facultatif: "facultatif",
  toucherEncore: "Touche encore pour l'enlever",
  pourquoi: "Pourquoi ?",
  obligatoire: (min: number) => `obligatoire, au moins ${min} caractères`,
  placeholder: "En quelques mots : ce qui ne va pas, à quel moment…",
  aide: (longueur: number, max: number) => `${longueur}/${max} · Plus c'est précis, plus l'équipe peut agir vite.`,
  sincerite:
    "En envoyant, tu confirmes que ton signalement est sincère et, à ta connaissance, exact. Signaler un contenu comme illicite en sachant que c'est faux, pour le faire retirer, peut être sanctionné par la loi.",
  manque: (min: number) => `Écris au moins ${min} caractères pour qu'on sache quoi regarder.`,
  envoyer: "Envoyer le signalement",
  indiceManque: (min: number, champ: string) => `Écris d'abord au moins ${min} caractères dans « ${champ} »`,
  indiceEnvoyer: "Envoie ton signalement à l'équipe SOS Miam",
  merciNote: "Merci, c'est noté",
  merciOnRegarde: "Merci, on regarde ça",
  masqueePourTous:
    "Cette publication n'apparaîtra plus dans ton fil. Ce type de contenu sera masqué pour tout le monde dès son premier signalement, puis vérifié à la main par un modérateur : retiré pour de bon s'il pose problème, remis en ligne sinon.",
  pasMasquee: "Cette publication n'apparaîtra plus dans ton fil. On va regarder ça de près.",
  anonyme:
    "Ton signalement est parti à l'équipe SOS Miam, sans ton nom : personne ne sait qui l'a envoyé. Sans réseau, il attend sur ton téléphone et part dès que ça revient.",
  retourFil: "Retour au fil",
  pourquoiTuSignales: "Pourquoi tu signales ?",
  pourquoiTuLeSignales: "Pourquoi tu le signales ?",
  disNousEnPlus: "Dis-nous-en plus, ça aide l'équipe.",
  publicationSur: (nomLieu: string) => `Publication sur ${nomLieu}`,
  retourRaisons: "Retour aux raisons",
  retourMenu: "Retour au menu",
  retour: "Retour",
  fermer: "Fermer",
  signaler: (sujet: string) => `Signaler ${sujet}`,
  dejaDisparu: "Ça a déjà disparu de ton écran.",
  equipeDira: "L'équipe te dira ce qu'elle a décidé.",
  profilDePres: "On va regarder ce profil de près.",
  nApparaitraPlus: "Ça n'apparaîtra plus pour toi, et on va regarder ça de près.",
  ouRetrouver: (cache: boolean) =>
    `${cache ? "L'équipe te dira ce qu'elle a décidé" : "Tu retrouveras sa décision"} dans Paramètres › Décisions de la modération. La personne concernée ne saura jamais que c'est toi.`,
  gardeSurTelephone:
    "Pour l'instant, ton signalement est gardé sur ton téléphone : il partira à l'équipe SOS Miam dès que l'app sera reliée à notre serveur.",
};

export const TEXTES_SIGNALEMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SIGNALEMENT>> = { fr: TEXTES_SIGNALEMENT, en: TEXTES_SIGNALEMENT_ANGLAIS };
