import { APP_ID_IOS, CHEMINS_LIENS_APP } from "../../contenus/liens-app.ts";

/**
 * Le contenu de /.well-known/apple-app-site-association : les adresses de sosmiam.fr que l'app iOS ouvre (liens universels).
 * Format moderne (iOS 13 et plus : appIDs et components) et, dans la même entrée, l'ancien (appID et paths, avec « apps »
 * vide) pour les iPhone plus anciens : chaque version lit ses clés et ignore les autres.
 */
export function creerAssociationApple() {
  return {
    applinks: {
      apps: [] as string[],
      details: [
        {
          appIDs: [APP_ID_IOS],
          components: CHEMINS_LIENS_APP.map((chemin) => ({ "/": chemin })),
          appID: APP_ID_IOS,
          paths: [...CHEMINS_LIENS_APP],
        },
      ],
    },
  };
}
