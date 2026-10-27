// Liens publics de SOS Miam, affichés sur la page /liens (le lien à mettre en bio TikTok et Instagram) : d'abord les
// actions (être prévenu, devenir ambassadeur, espace pro, inscrire son lieu), puis les réseaux, puis le site (choix de Hugo,
// 9 octobre 2026). L'invitation Discord a été créée par le bot (permanente, sans limite, vers 👋・bienvenue).
// « reseau » sert aussi de nom au clic compté (/liens/aller/:reseau, liste CIBLES_CLIC de l'API, controleurs/mesure.ts).

import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_LIENS_PUBLICS_ANGLAIS } from "~/contenus/anglais/liens-publics";
import { assemblerLiensPublics } from "~/fonctions/navigation/assembler-liens-publics";

export type Reseau = "prevenu" | "ambassadeur" | "pro" | "inscrire-lieu" | "site" | "discord" | "tiktok" | "instagram";

/** Les vrais réseaux sociaux (repris dans le pied de page, « Nous suivre ») */
export const RESEAUX_SOCIAUX: readonly Reseau[] = ["discord", "tiktok", "instagram"];

export type LienPublic = {
  /** Choisit aussi l'icône et sa couleur */
  reseau: Reseau;
  nom: string;
  adresse: string;
  /** Affiché sous le nom : le pseudo ou l'adresse courte */
  identifiant: string;
  accroche: string;
};

export const STRUCTURE_LIENS_PUBLICS: readonly { reseau: Reseau; adresse: string; identifiant?: string }[] = [
  { reseau: "prevenu", adresse: "https://sosmiam.fr/#inscription" },
  { reseau: "ambassadeur", adresse: "https://ambassadeur.sosmiam.fr/programme", identifiant: "ambassadeur.sosmiam.fr" },
  { reseau: "pro", adresse: "https://pro.sosmiam.fr", identifiant: "pro.sosmiam.fr" },
  { reseau: "inscrire-lieu", adresse: "https://sosmiam.fr/inscrire-mon-lieu", identifiant: "sosmiam.fr/inscrire-mon-lieu" },
  { reseau: "discord", adresse: "https://discord.gg/Y4xKPU9kDe" },
  { reseau: "tiktok", adresse: "https://www.tiktok.com/@sos.miam", identifiant: "@sos.miam" },
  { reseau: "instagram", adresse: "https://www.instagram.com/official.sosmiam/", identifiant: "@official.sosmiam" },
  { reseau: "site", adresse: "https://sosmiam.fr", identifiant: "sosmiam.fr" },
];

export const TEXTES_LIENS_PUBLICS = {
  meta: {
    titre: "Nos liens",
    description: "Être prévenu du lancement, devenir ambassadeur, l'espace pro, inscrire ton lieu, le Discord, le TikTok, l'Instagram et le site de SOS Miam, au même endroit.",
  },
  slogan: "Sauve une table, régale-toi.",
  presentation:
    "Les restos, bars et pâtisseries indépendants qui ont besoin de monde (et quelques sorties), partout en France. Choisis ta porte d'entrée : on te garde une place.",
  ouNousRetrouver: "Où nous retrouver",
  liens: {
    prevenu: {
      nom: "Être prévenu du lancement",
      identifiant: "Newsletter et bêta de l'app",
      accroche: "Laisse ton e-mail : on te dit dès que l'app arrive près de chez toi, et tu peux la tester avant tout le monde.",
    },
    ambassadeur: {
      nom: "Devenir ambassadeur",
      accroche: "Fais découvrir les pépites de ton coin. 367 places de fondateur partout en France, dès 18 ans.",
    },
    pro: {
      nom: "Espace pro",
      accroche: "Tu tiens un lieu ? Ta fiche, ta carte et les suggestions de tes clients. C'est gratuit.",
    },
    "inscrire-lieu": {
      nom: "J'inscris mon lieu",
      accroche: "Ton lieu n'est pas encore sur SOS Miam ? Présente-le en quelques mots, on s'occupe du reste.",
    },
    discord: {
      nom: "Le Discord",
      identifiant: "Serveur SOS Miam",
      accroche: "La commu : tes pépites, tes questions, et les coulisses du projet.",
    },
    tiktok: {
      nom: "TikTok",
      accroche: "Des vidéos qui donnent faim. Regarde-les le ventre plein, on t'aura prévenu.",
    },
    instagram: {
      nom: "Instagram",
      accroche: "Les photos des bonnes adresses, et les nouvelles de SOS Miam.",
    },
    site: {
      nom: "Le site",
      accroche: "Ça mijote encore en cuisine : passe voir où on en est.",
    },
  },
};

export const TEXTES_LIENS_PUBLICS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_LIENS_PUBLICS>> = {
  fr: TEXTES_LIENS_PUBLICS,
  en: TEXTES_LIENS_PUBLICS_ANGLAIS,
};

export const liensPublics: LienPublic[] = assemblerLiensPublics(STRUCTURE_LIENS_PUBLICS, TEXTES_LIENS_PUBLICS);
