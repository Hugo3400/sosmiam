export type OngletMaintenance = "machines" | "courbes" | "systeme" | "pm2" | "journaux" | "sauvegardes" | "base" | "alertes" | "historique";

export const ONGLETS_MAINTENANCE: { valeur: OngletMaintenance; libelle: string }[] = [
  { valeur: "machines", libelle: "Machines" },
  { valeur: "courbes", libelle: "Courbes" },
  { valeur: "systeme", libelle: "Système" },
  { valeur: "pm2", libelle: "PM2" },
  { valeur: "journaux", libelle: "Journaux" },
  { valeur: "sauvegardes", libelle: "Sauvegardes" },
  { valeur: "base", libelle: "Base" },
  { valeur: "alertes", libelle: "Alertes" },
  { valeur: "historique", libelle: "Historique" },
];
