export const ALERTES_MACHINE: { titre: string; aide: string; regle: string }[] = [
  { titre: "Le relevé ne répond plus", aide: "Aucune mesure de la machine depuis 3 minutes", regle: "tout de suite" },
  { titre: "Le processeur reste chargé", aide: "Une pointe de quelques secondes ne compte pas", regle: "> 90 % pendant 10 min" },
  { titre: "La mémoire déborde", aide: "La machine commence à ramer", regle: "> 90 %" },
  { titre: "Le disque se remplit", aide: "La même règle qu'avant", regle: "> 90 %" },
  { titre: "Le processeur a trop chaud", aide: "Les Xeon se coupent vers 90 °C", regle: "> 80 °C" },
  { titre: "Un service du système s'arrête", aide: "nginx, PostgreSQL, Stalwart, MariaDB, PHP-FPM, pm2", regle: "tout de suite" },
  { titre: "Un programme de SOS Miam s'arrête", aide: "L'API, le site ou le bot", regle: "tout de suite" },
  { titre: "La sauvegarde de la nuit manque", aide: "Rien depuis plus de 30 heures", regle: "> 30 h" },
];
