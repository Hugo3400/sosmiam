// Un client de l'API sans session, pour les lectures publiques qui ne dépendent pas du compte :
// utilisable hors des écrans, et jamais avec le jeton de session.
import { creerClientHttp } from "@sos-miam/commun/client-api/client-http";

import { ADRESSE_API } from "~/services/adresse-api";
import { VERSION_INSTALLEE } from "~/services/version-installee";

export const clientApiPublic = creerClientHttp({ adresse: ADRESSE_API, lireJeton: () => null, versionApp: VERSION_INSTALLEE ?? undefined });
