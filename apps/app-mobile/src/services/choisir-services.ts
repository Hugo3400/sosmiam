// Les services de l'app sans compte connecté (FournisseurServices prend creerServicesApi() dès qu'un compte l'est) : la
// démo locale quand le mode démo est allumé (bouton « Démo », en développement seulement), sinon les services
// « indisponibles » (une visite sans compte ne valide rien).
import type { Services } from "@sos-miam/commun/client-api/services";
import type { RolesCompte } from "@sos-miam/commun/types/roles";

import { creerServicesIndisponibles } from "./creer-services-indisponibles";
import { DEMO_VISITES_ACTIVE } from "./demo/demo-visites-active";
import { creerMagasinDemo } from "./demo/magasin-demo";
import { creerOutilsDemo } from "./demo/outils-demo";
import { lireReglagesDemo } from "./demo/reglages-demo-vivants";
import { creerServicesDemo } from "./demo/creer-services-demo";
import type { ClientDemo, ContexteDemo, MagasinDemoVivant, OutilsDemo } from "./demo/types-demo";

/** Un seul magasin pour toute l'app, même si les services sont recréés : tous les écrans voient les mêmes visites */
let magasin: MagasinDemoVivant | null = null;

const maintenant = () => Date.now();

/**
 * Crée les services de l'app et, en démo, ses outils. `lireClient` (prénom, initiale et emoji de « moi ») et
 * `lireRoles` sont relus à chaque appel : le faux serveur revérifie tout à chaque demande, comme le fera l'API.
 */
export function choisirServices(o: { lireClient: () => ClientDemo | null; lireRoles: () => RolesCompte }): {
  services: Services;
  outilsDemo: OutilsDemo | null;
} {
  if (!DEMO_VISITES_ACTIVE) return { services: creerServicesIndisponibles(), outilsDemo: null };
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
