// Le seul endroit qui choisit les services de l'app : la démo locale en développement (ou avec EXPO_PUBLIC_DEMO_VISITES=1,
// valeur figée à la compilation, jamais un réglage caché), sinon les services « indisponibles ». Plus tard,
// creerServicesApi() (lot P6) remplacera la démo.
import type { Services } from "@sos-miam/commun/client-api/services";
import type { RolesCompte } from "@sos-miam/commun/types/roles";

import { creerServicesIndisponibles } from "./creer-services-indisponibles";
import { creerMagasinDemo } from "./demo/magasin-demo";
import { creerOutilsDemo } from "./demo/outils-demo";
import { lireReglagesDemo } from "./demo/reglages-demo-vivants";
import { creerServicesDemo } from "./demo/creer-services-demo";
import type { ClientDemo, ContexteDemo, MagasinDemoVivant, OutilsDemo } from "./demo/types-demo";

/** Même condition que FournisseurModes (rôles de démo) */
const DEMO = __DEV__ || process.env.EXPO_PUBLIC_DEMO_VISITES === "1";

/** Un seul magasin pour toute l'app, même si les services sont recréés : tous les écrans voient les mêmes visites */
let magasin: MagasinDemoVivant | null = null;

const maintenant = () => Date.now();

/**
 * Crée les services de l'app et, en démo, ses outils. `lireClient` (prénom, initiale, emoji, majorité de « moi ») et
 * `lireRoles` sont relus à chaque appel : le faux serveur revérifie tout à chaque demande, comme le fera l'API.
 */
export function choisirServices(o: { lireClient: () => ClientDemo | null; lireRoles: () => RolesCompte }): {
  services: Services;
  outilsDemo: OutilsDemo | null;
} {
  if (!DEMO) return { services: creerServicesIndisponibles(), outilsDemo: null };
  magasin ??= creerMagasinDemo({ maintenant });
  // Les réglages des Coulisses sont lus sur le téléphone dès maintenant, avant la première demande
  lireReglagesDemo();
  const ctx: ContexteDemo = {
    magasin,
    lireClient: o.lireClient,
    lireRoles: o.lireRoles,
    lireReglages: lireReglagesDemo,
    maintenant,
  };
  return { services: creerServicesDemo(ctx), outilsDemo: creerOutilsDemo(ctx) };
}
