import type { LoaderFunctionArgs } from "react-router";

import { repondreSecurityTxt } from "~/fonctions/securite/repondre-security-txt";

export function loader({ request }: LoaderFunctionArgs) {
  return repondreSecurityTxt(request);
}
