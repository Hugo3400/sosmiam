// Liens publics de SOS Miam, affichés sur la page /liens (le lien à mettre en bio TikTok et Instagram).
// L'invitation Discord a été créée par le bot (permanente, sans limite, vers 👋・bienvenue).

export type Reseau = "site" | "discord" | "tiktok" | "instagram";

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
    reseau: "site",
    nom: "Le site",
    adresse: "https://sosmiam.fr",
    identifiant: "sosmiam.fr",
    accroche: "Ça mijote encore en cuisine : passe voir où on en est.",
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
];
