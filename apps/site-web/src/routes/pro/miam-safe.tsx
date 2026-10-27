import { data, useActionData } from "react-router";

import type { Route } from "./+types/miam-safe";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { CaseACocher } from "~/composants/compte/CaseACocher";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Section } from "~/composants/mise-en-page/Section";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { ENGAGEMENTS_CHARTE_MIAM_SAFE_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/charte-miam-safe.ts";
import { NOM_MIAM_SAFE } from "~/contenus/cadre-pro";
import { TEXTES_MIAM_SAFE_PRO_PAR_LANGUE } from "~/contenus/miam-safe-pro";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { lireCharteMiamSafe, quitterCharteMiamSafe, signerCharteMiamSafe } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

const SIGNER = "signer";
const QUITTER = "quitter";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_MIAM_SAFE_PRO_PAR_LANGUE, langue).meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : NOM_MIAM_SAFE, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** La charte du lieu (null : pas pu être lue) et le rôle du compte. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu, role } = await exigerLieuPro(request, params.id);
  const reponse = await lireCharteMiamSafe(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, gerant: role === "gerant", charte: reponse.ok ? reponse.charte : null };
}

/** Signer (case « Mon équipe s'engage » cochée) ou quitter la charte (gérant). */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const M = choisirTextes(TEXTES_MIAM_SAFE_PRO_PAR_LANGUE, lireLangueRequete(request).langue).messages;
  const messages: Record<string, string> = M.erreurs;
  const geste = formulaire.get("formulaire") === QUITTER ? QUITTER : SIGNER;
  if (geste === SIGNER && formulaire.get("engagement") !== "oui") {
    return { ok: false, formulaire: SIGNER, erreurs: { engagement: lierPonctuation(M.caseNonCochee) } };
  }
  const reponse = geste === SIGNER ? await signerCharteMiamSafe(jeton, ip, lieu.id) : await quitterCharteMiamSafe(jeton, ip, lieu.id);
  if (reponse.ok) {
    const message = geste === SIGNER ? M.signee : M.quittee;
    return { ok: true, formulaire: geste, message: lierPonctuation(message) };
  }
  await redirigerSiSessionFermee(request, reponse.erreur);
  return { ok: false, formulaire: geste, message: lierPonctuation(messages[reponse.erreur] ?? M.panne) };
}

/** Page /lieu/:id/miam-safe : la charte, son état, signer ou quitter (gérant). */
export default function PageMiamSafe({ loaderData }: Route.ComponentProps) {
  const { lieu, gerant, charte } = loaderData;
  const T = utiliserTextes(TEXTES_MIAM_SAFE_PRO_PAR_LANGUE);
  const engagements = utiliserTextes(ENGAGEMENTS_CHARTE_MIAM_SAFE_PAR_LANGUE);
  const langue = utiliserLangue();
  const reponse = useActionData<ReponseFormulaire>();
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page={NOM_MIAM_SAFE}
        chapo={lierPonctuation(T.chapo)}
      />
      <div className="grid gap-8">
        {T.traductionCourtoisie && <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 text-sm">{T.traductionCourtoisie}</p>}
        {!charte ? (
          <p className="font-semibold">{lierPonctuation(T.illisible)}</p>
        ) : charte.signee ? (
          <p role="status" className="rounded-2xl border-2 border-encre bg-jaune px-5 py-4 font-bold">
            🛡 {lierPonctuation(T.signee(charte.signeeLe ? ecrireDateAParisLangue(charte.signeeLe, langue) ?? "" : null))}
          </p>
        ) : charte.retireeParEquipe ? (
          <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(T.messages.erreurs["charte-retiree"])}</p>
        ) : null}

        <section aria-labelledby="charte-engagements" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
          <h2 id="charte-engagements" className="mb-4 text-2xl font-extrabold">{T.engagements}</h2>
          <ol className="grid gap-4">
            {engagements.map((e, i) => (
              <li key={e.titre} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                <span aria-hidden className="grid size-8 place-items-center rounded-full bg-jaune font-extrabold">{i + 1}</span>
                <div>
                  <p className="font-bold">{lierPonctuation(e.titre)}</p>
                  <p className="text-gris">{lierPonctuation(e.texte)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {!gerant ? (
          <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(T.reserveAuGerant)}</p>
        ) : charte && !charte.signee && !charte.retireeParEquipe ? (
          <FormulaireCompte nom={SIGNER} bouton={T.signer.bouton}>
            <CaseACocher nom="engagement">{lierPonctuation(T.signer.engagement)}</CaseACocher>
          </FormulaireCompte>
        ) : charte?.signee ? (
          <FormulaireCompte nom={QUITTER} bouton={T.quitter.bouton} danger>
            <p className="text-gris">{lierPonctuation(T.quitter.texte)}</p>
          </FormulaireCompte>
        ) : null}
        {reponse && !reponse.erreurs && <p role="status" className={`font-semibold ${reponse.ok ? "text-encre" : "text-rouge-texte"}`}>{reponse.message}</p>}
      </div>
    </Section>
  );
}
