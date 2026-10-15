import { creerAnnoncesAppApi } from "@sos-miam/commun/client-api/api/api-annonces-app";

import { clientApiPublic } from "~/services/client-api-public";

export const annoncesAppSansCompte = creerAnnoncesAppApi(clientApiPublic);
