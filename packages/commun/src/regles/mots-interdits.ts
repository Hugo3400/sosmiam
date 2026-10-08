// Filtre des commentaires, messages de sortie et mots envoyés à un pote : une première barrière contre les insultes
// et la haine les plus courantes, avant la modération humaine (logiciel de gestion). Comparé sans accents ni majuscules.
// Volontairement courte : elle bloque l'évident sans gêner les conversations normales (« je crève de faim » passe).

export const LONGUEUR_MAX_COMMENTAIRE = 500;

/**
 * Expressions refusées, en minuscules et sans accents. Par défaut, mot ou expression entière ;
 * avec « * » à la fin, tout mot qui commence ainsi (« connard* » attrape aussi « connards »).
 */
export const EXPRESSIONS_INTERDITES: readonly string[] = [
  "connard*", "connasse*", "salope*", "salaud*", "encule*", "enfoire*", "batard*", "fils de pute", "pute", "putes",
  "nique ta*", "nique ta mere", "ntm", "tg", "ferme ta gueule", "pd", "pds", "pede*", "tarlouze*", "gouine*", "negre*",
  "bougnoul*", "youpin*", "bicot*", "sale arabe", "sale noir", "sale juif", "sale blanc", "retarde*", "mongol", "mongols",
  "tafiole*", "suicide toi", "va te suicider", "va crever", "je vais te tuer", "je vais te buter",
];
