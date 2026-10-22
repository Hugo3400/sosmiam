// Les écrans du logiciel, dans l'ordre du menu.
import {
  AppWindow, Bell, Briefcase, Bug, Smartphone, Lightbulb, CalendarCheck, CalendarDays, Newspaper, PartyPopper, Target, ChartColumn, Clapperboard, HeartHandshake, Inbox, LayoutDashboard, LifeBuoy, Mail, MailOpen, MapPinned, Megaphone, Server, Settings, ShieldAlert, ShieldCheck, Star, Store,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Ecran =
  | "tableau-de-bord" | "statistiques" | "newsletter" | "lieux" | "demandes" | "publications" | "moderation" | "annonces"
  | "notifications" | "big-sos" | "utilisateurs" | "maintenance" | "reglages" | "ambassadeurs" | "calendrier" | "villes" | "boite" | "miam-safe" | "defis" | "presse" | "evenements" | "reservations" | "avis" | "pop-ups" | "communaute" | "carriere" | "chasse-aux-bugs" | "versions-app";

export type EntreeMenu = { ecran: Ecran; libelle: string; icone: LucideIcon; bientot?: boolean };

/** Les écrans rangés par métier (réorganisé le 14 octobre 2026) : chaque groupe se replie dans le menu */
export const MENU: { groupe: string; entrees: EntreeMenu[] }[] = [
  {
    groupe: "Pilotage",
    entrees: [
      { ecran: "tableau-de-bord", libelle: "Tableau de bord", icone: LayoutDashboard },
      { ecran: "statistiques", libelle: "Statistiques", icone: ChartColumn },
      { ecran: "calendrier", libelle: "Calendrier", icone: CalendarDays },
    ],
  },
  {
    groupe: "Lieux",
    entrees: [
      { ecran: "lieux", libelle: "Fiches des lieux", icone: Store },
      { ecran: "demandes", libelle: "Demandes de lieux", icone: Inbox },
      { ecran: "villes", libelle: "Villes", icone: MapPinned },
      { ecran: "reservations", libelle: "Réservations", icone: CalendarCheck },
      { ecran: "big-sos", libelle: "BIG SOS", icone: LifeBuoy },
    ],
  },
  {
    groupe: "Dans l'app",
    entrees: [
      { ecran: "publications", libelle: "Publications", icone: Clapperboard },
      { ecran: "evenements", libelle: "Événements", icone: PartyPopper },
      { ecran: "defis", libelle: "Défis", icone: Target },
      { ecran: "notifications", libelle: "Notifications", icone: Bell },
      { ecran: "pop-ups", libelle: "Pop-ups de l'app", icone: AppWindow },
      { ecran: "versions-app", libelle: "Versions de l'app", icone: Smartphone },
    ],
  },
  {
    groupe: "Sécurité",
    entrees: [
      { ecran: "moderation", libelle: "Modération", icone: ShieldAlert },
      { ecran: "avis", libelle: "Avis à relire", icone: Star },
      { ecran: "miam-safe", libelle: "Miam Safe", icone: ShieldCheck },
      { ecran: "chasse-aux-bugs", libelle: "Chasse aux bugs", icone: Bug },
    ],
  },
  {
    groupe: "Communauté",
    entrees: [
      { ecran: "utilisateurs", libelle: "Comptes", icone: Users },
      { ecran: "ambassadeurs", libelle: "Ambassadeurs", icone: HeartHandshake },
      { ecran: "communaute", libelle: "Idées et sorties", icone: Lightbulb },
      { ecran: "carriere", libelle: "Carrière", icone: Briefcase },
    ],
  },
  {
    groupe: "Communication",
    entrees: [
      { ecran: "boite", libelle: "Boîte mail", icone: MailOpen },
      { ecran: "newsletter", libelle: "Newsletter", icone: Mail },
      { ecran: "annonces", libelle: "Annonces Discord", icone: Megaphone },
      { ecran: "presse", libelle: "Espace presse", icone: Newspaper },
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
