// Ce que la démo sait mesurer sur le téléphone, pour ses badges et ses défis d'exemple. Avec un compte, c'est le serveur
// qui compte tout (défis : GET /app/defis ; badges : compte.badges).

export type MesureActivite = "rescousses" | "premiers-sauvetages";

/** Valeur de chaque mesure pour la personne */
export type MesuresActivite = Record<MesureActivite, number>;
