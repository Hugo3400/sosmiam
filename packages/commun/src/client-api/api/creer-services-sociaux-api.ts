// Tous les services sociaux de l'app en version API (compte connecté) : FournisseurSession les crée à côté des autres
// services (sociaux: creerServicesSociauxApi(client)). Chaque lot ajoute l'import et la ligne de son domaine à la fin,
// comme dans services-sociaux.ts.

import type { ClientHttp } from "../client-http.ts";
import type { ServicesSociaux } from "../services-sociaux.ts";
import { creerClocheApi } from "./api-cloche.ts";
import { creerSocialApi } from "./api-social.ts";
import { creerSortiesApi } from "./api-sorties.ts";
import { creerListesApi } from "./api-listes.ts";
import { creerCommentairesApi } from "./api-commentaires.ts";
import { creerModerationAppApi } from "./api-moderation-app.ts";
import { creerSignalementsSociauxApi } from "./api-signalements-sociaux.ts";
import { creerBandeApi } from "./api-bande.ts";
import { creerSuivisPersonnesApi } from "./api-suivis-personnes.ts";
import { creerMessagerieApi } from "./api-messagerie.ts";

export function creerServicesSociauxApi(client: ClientHttp): ServicesSociaux {
  return {
    social: creerSocialApi(client),
    cloche: creerClocheApi(client),
    sorties: creerSortiesApi(client),
    listes: creerListesApi(client),
    commentaires: creerCommentairesApi(client),
    signalements: creerSignalementsSociauxApi(client),
    moderation: creerModerationAppApi(client),
    bande: creerBandeApi(client),
    suivis: creerSuivisPersonnesApi(client),
    messagerie: creerMessagerieApi(client),
  };
}
