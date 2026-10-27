import type { Route } from "./+types/suggestions";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { CarteSuggestion } from "~/composants/pro/CarteSuggestion";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_SUGGESTIONS_PRO_PAR_LANGUE } from "~/contenus/suggestions-pro";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { listerSuggestions } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_SUGGESTIONS_PRO_PAR_LANGUE, langue).meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** Les suggestions de modification de la fiche, les plus récentes d'abord (null : pas pu être lues). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const reponse = await listerSuggestions(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, suggestions: reponse.ok ? reponse.suggestions : null };
}

/** Page /lieu/:id/suggestions : ce que proposent les clients (et toi, pour le nom et l'adresse), et la décision de l'équipe. */
export default function PageSuggestions({ loaderData }: Route.ComponentProps) {
  const { lieu, suggestions } = loaderData;
  const T = utiliserTextes(TEXTES_SUGGESTIONS_PRO_PAR_LANGUE);
  const enAttente = suggestions?.filter((suggestion) => suggestion.statut === "en-attente") ?? [];
  const decidees = suggestions?.filter((suggestion) => suggestion.statut !== "en-attente") ?? [];
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page={T.page}
        chapo={lierPonctuation(T.chapo)}
      />
      {suggestions === null ? (
        <p className="rounded-2xl border-2 border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(T.illisibles)}</p>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
          <Mascotte expression="miam" className="h-24 w-24" />
          <h2 className="mt-4 text-2xl font-extrabold">{lierPonctuation(T.vide.titre)}</h2>
          <p className="mt-2 max-w-md text-gris">{lierPonctuation(T.vide.texte)}</p>
        </div>
      ) : (
        <>
          {enAttente.length > 0 && (
            <section aria-labelledby="suggestions-attente" className="mb-10">
              <h2 id="suggestions-attente" className="mb-4 text-2xl font-extrabold">{T.enAttente(enAttente.length)}</h2>
              <ul className="grid gap-5">{enAttente.map((suggestion) => <CarteSuggestion key={suggestion.id} suggestion={suggestion} />)}</ul>
            </section>
          )}
          {decidees.length > 0 && (
            <section aria-labelledby="suggestions-decidees">
              <h2 id="suggestions-decidees" className="mb-4 text-2xl font-extrabold">{T.decidees}</h2>
              <ul className="grid gap-5">{decidees.map((suggestion) => <CarteSuggestion key={suggestion.id} suggestion={suggestion} />)}</ul>
            </section>
          )}
        </>
      )}
    </Section>
  );
}
