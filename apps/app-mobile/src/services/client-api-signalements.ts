import { creerClientHttp } from "@sos-miam/commun/client-api/client-http";

import { ADRESSE_API } from "~/services/adresse-api";
import { lireJetonSession } from "~/stockage/session-compte";

export const clientApiSignalements = creerClientHttp({ adresse: ADRESSE_API, lireJeton: lireJetonSession });
