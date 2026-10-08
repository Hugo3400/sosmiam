// Les écrans du logiciel, dans l'ordre du menu.
import {
  Bell, ChartColumn, Clapperboard, HeartHandshake, Inbox, LayoutDashboard, LifeBuoy, Mail, Megaphone, Server, Settings, ShieldAlert, Store, Users, type LucideIcon,
} from "lucide-react";

export type Ecran =
  | "tableau-de-bord" | "statistiques" | "newsletter" | "lieux" | "demandes" | "publications" | "moderation" | "annonces"
  | "notifications" | "big-sos" | "utilisateurs" | "maintenance" | "reglages" | "ambassadeurs";

export type EntreeMenu = { ecran: Ecran; libelle: string; icone: LucideIcon; bientot?: boolean };

export const MENU: { groupe: string; entrees: EntreeMenu[] }[] = [
  {
    groupe: "Suivi",
    entrees: [
      { ecran: "tableau-de-bord", libelle: "Tableau de bord", icone: LayoutDashboard },
      { ecran: "statistiques", libelle: "Statistiques", icone: ChartColumn },
    ],
  },
  {
    groupe: "Contenus",
    entrees: [
      { ecran: "lieux", libelle: "Lieux", icone: Store },
      { ecran: "demandes", libelle: "Demandes de lieux", icone: Inbox },
      { ecran: "publications", libelle: "Publications", icone: Clapperboard },
      { ecran: "moderation", libelle: "Modération", icone: ShieldAlert },
    ],
  },
  {
    groupe: "Communauté",
    entrees: [
      { ecran: "utilisateurs", libelle: "Comptes", icone: Users },
      { ecran: "ambassadeurs", libelle: "Ambassadeurs", icone: HeartHandshake },
      { ecran: "newsletter", libelle: "Newsletter", icone: Mail },
      { ecran: "annonces", libelle: "Annonces Discord", icone: Megaphone },
    ],
  },
  {
    groupe: "Bientôt",
    entrees: [
      { ecran: "big-sos", libelle: "BIG SOS", icone: LifeBuoy, bientot: true },
      { ecran: "notifications", libelle: "Notifications", icone: Bell, bientot: true },
    ],
  },
  {
    groupe: "Serveur",
    entrees: [
      { ecran: "maintenance", libelle: "Maintenance", icone: Server },
      { ecran: "reglages", libelle: "Réglages", icone: Settings },
    ],
  },
];
