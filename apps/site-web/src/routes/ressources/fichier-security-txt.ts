import type { Route } from "./+types/fichier-security-txt";

import { repondreSecurityTxt } from "~/fonctions/securite/repondre-security-txt";

export function loader({ request }: Route.LoaderArgs) {
  return repondreSecurityTxt(request);
}
