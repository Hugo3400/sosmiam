import { Badge } from "~/composants/interface/Badge.tsx";
import type { ConnexionsCompte } from "~/services/comptes.ts";

const LIBELLES = { mail: "✉️ Mail", google: "Google", apple: " Apple" } as const;

/** Comment la personne se connecte : par mail (mot de passe), Google, Apple ; « App » si on l'a vue sur l'app */
export function PastillesConnexion({ connexions, surApp }: { connexions?: ConnexionsCompte; surApp?: boolean }) {
  if (!connexions) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {(Object.keys(LIBELLES) as (keyof ConnexionsCompte)[]).filter((methode) => connexions[methode]).map((methode) => (
        <Badge key={methode} ton="contour">{LIBELLES[methode]}</Badge>
      ))}
      {surApp && <Badge ton="jaune">📱 App</Badge>}
    </span>
  );
}
