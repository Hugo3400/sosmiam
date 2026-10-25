import { creerClientHttp } from "@sos-miam/commun/client-api/client-http";

import { ADRESSE_API } from "~/services/adresse-api";
import { lireLangueActuelle } from "~/services/langue-actuelle";
import { VERSION_INSTALLEE } from "~/services/version-installee";
import { lireJetonSession } from "~/stockage/session-compte";

export const clientApiSignalements = creerClientHttp({ adresse: ADRESSE_API, lireJeton: lireJetonSession, versionApp: VERSION_INSTALLEE ?? undefined, lireLangue: lireLangueActuelle });
