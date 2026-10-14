// Tous les services sociaux de l'app en version API (compte connecté) : FournisseurSession les crée à côté des autres
// services (sociaux: creerServicesSociauxApi(client)). Chaque lot ajoute l'import et la ligne de son domaine à la fin,
// comme dans services-sociaux.ts.

import type { ClientHttp } from "../client-http.ts";
import type { ServicesSociaux } from "../services-sociaux.ts";
import { creerClocheApi } from "./api-cloche.ts";
import { creerSocialApi } from "./api-social.ts";

export function creerServicesSociauxApi(client: ClientHttp): ServicesSociaux {
  return {
    social: creerSocialApi(client),
    cloche: creerClocheApi(client),
  };
}
