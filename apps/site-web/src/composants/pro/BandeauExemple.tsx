import { useRouteLoaderData } from "react-router";

/** Id de la route du cadre pro (routes.ts), qui montre déjà ce bandeau quand les lieux du compte sont des exemples. */
const ID_CADRE_PRO = "routes/pro/mise-en-page-pro";

type Props = {
  /** Vrai quand la page affiche des données d'exemple */
  actif: boolean | undefined;
  /** Affiché par le cadre pro lui-même (sinon, une page ne le répète pas sous celui du cadre) */
  duCadre?: boolean;
};

/**
 * Bandeau des données d'exemple : affiché seulement par le serveur de développement, quand l'API n'a pas encore les
 * routes de l'espace pro (services/pro.server.ts). En ligne, il n'y a jamais de données d'exemple.
 */
export function BandeauExemple({ actif, duCadre = false }: Props) {
  const cadre = useRouteLoaderData<{ exemple?: boolean }>(ID_CADRE_PRO);
  if (!actif || (!duCadre && cadre?.exemple)) return null;
  return (
    <p role="note" className="border-y-2 border-dashed border-encre bg-jaune-clair px-4 py-2 text-center text-sm font-semibold print:hidden">
      <span aria-hidden="true">🧪 </span>Données d'exemple (serveur de développement) : l'API de l'espace pro n'est pas encore branchée.
    </p>
  );
}
