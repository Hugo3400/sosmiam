// Liens publics de SOS Miam, affichés sur la page /liens (le lien à mettre en bio TikTok et Instagram) : d'abord les
// actions (être prévenu, devenir ambassadeur, espace pro, inscrire son lieu), puis les réseaux, puis le site (choix de Hugo,
// 9 octobre 2026). L'invitation Discord a été créée par le bot (permanente, sans limite, vers 👋・bienvenue).
// « reseau » sert aussi de nom au clic compté (/liens/aller/:reseau, liste CIBLES_CLIC de l'API, controleurs/mesure.ts).

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

export const liensPublics: LienPublic[] = [
  {
    reseau: "prevenu",
    nom: "Être prévenu du lancement",
    adresse: "https://sosmiam.fr/#inscription",
    identifiant: "Newsletter et bêta de l'app",
    accroche: "Laisse ton e-mail : on te dit dès que l'app arrive près de chez toi, et tu peux la tester avant tout le monde.",
  },
  {
    reseau: "ambassadeur",
    nom: "Devenir ambassadeur",
    adresse: "https://ambassadeur.sosmiam.fr/programme",
    identifiant: "ambassadeur.sosmiam.fr",
    accroche: "Fais découvrir les pépites de ton coin. 367 places de fondateur partout en France, dès 18 ans.",
  },
  {
    reseau: "pro",
    nom: "Espace pro",
    adresse: "https://pro.sosmiam.fr",
    identifiant: "pro.sosmiam.fr",
    accroche: "Tu tiens un lieu ? Ta fiche, ta carte et les suggestions de tes clients. C'est gratuit.",
  },
  {
    reseau: "inscrire-lieu",
    nom: "J'inscris mon lieu",
    adresse: "https://sosmiam.fr/inscrire-mon-lieu",
    identifiant: "sosmiam.fr/inscrire-mon-lieu",
    accroche: "Ton lieu n'est pas encore sur SOS Miam ? Présente-le en quelques mots, on s'occupe du reste.",
  },
  {
    reseau: "discord",
    nom: "Le Discord",
    adresse: "https://discord.gg/Y4xKPU9kDe",
    identifiant: "Serveur SOS Miam",
    accroche: "La commu : tes pépites, tes questions, et les coulisses du projet.",
  },
  {
    reseau: "tiktok",
    nom: "TikTok",
    adresse: "https://www.tiktok.com/@sos.miam",
    identifiant: "@sos.miam",
    accroche: "Des vidéos qui donnent faim. Regarde-les le ventre plein, on t'aura prévenu.",
  },
  {
    reseau: "instagram",
    nom: "Instagram",
    adresse: "https://www.instagram.com/official.sosmiam/",
    identifiant: "@official.sosmiam",
    accroche: "Les photos des bonnes adresses, et les nouvelles de SOS Miam.",
  },
  {
    reseau: "site",
    nom: "Le site",
    adresse: "https://sosmiam.fr",
    identifiant: "sosmiam.fr",
    accroche: "Ça mijote encore en cuisine : passe voir où on en est.",
  },
];
