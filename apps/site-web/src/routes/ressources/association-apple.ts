import type { Route } from "./+types/association-apple";

import { repondreAssociationApple } from "~/fonctions/liens-app/repondre-association-apple";

/** GET /.well-known/apple-app-site-association (sans extension) : liens universels de l'app iOS, sur sosmiam.fr seulement. */
export function loader({ request }: Route.LoaderArgs) {
  return repondreAssociationApple(request);
}
