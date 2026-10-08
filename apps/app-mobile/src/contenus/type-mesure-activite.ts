// Ce que l'app sait mesurer sur le téléphone, pour les badges et les défis.
// Les visites validées, avis et sorties entre potes arriveront avec l'API (badges et défis encore verrouillés).

export type MesureActivite = "rescousses" | "premiers-sauvetages";

/** Valeur de chaque mesure pour la personne */
export type MesuresActivite = Record<MesureActivite, number>;
