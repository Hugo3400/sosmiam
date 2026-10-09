import { data, useActionData } from "react-router";

import type { Route } from "./+types/miam-safe";
import { CaseACocher } from "~/composants/compte/CaseACocher";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Section } from "~/composants/mise-en-page/Section";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { ENGAGEMENTS_CHARTE_MIAM_SAFE } from "~/contenus/charte-miam-safe";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { formaterJourEnLettres } from "~/fonctions/dates/formater-jour-en-lettres";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { lireCharteMiamSafe, quitterCharteMiamSafe, signerCharteMiamSafe } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

/** « 2026-10-09T08:12:00Z » → le jour à Paris, en lettres (« 9 octobre 2026 ») */
const jourParis = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

const SIGNER = "signer";
const QUITTER = "quitter";

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Miam Safe · ${loaderData.lieu.nom}` : "Miam Safe", description: "La charte Miam Safe de ton lieu." }), { name: "robots", content: "noindex" }];
}

/** La charte du lieu (null : pas pu être lue) et le rôle du compte. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu, role } = await exigerLieuPro(request, params.id);
  const reponse = await lireCharteMiamSafe(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, gerant: role === "gerant", charte: reponse.ok ? reponse.charte : null };
}

const messages: Record<string, string> = {
  "charte-retiree": "L'équipe SOS Miam a retiré la charte de ton lieu après un signalement. Écris-nous à bonjour@sosmiam.fr pour en parler.",
  "reserve-au-gerant": "Seul le gérant signe ou quitte la charte.",
};

/** Signer (case « Mon équipe s'engage » cochée) ou quitter la charte (gérant). */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const geste = formulaire.get("formulaire") === QUITTER ? QUITTER : SIGNER;
  if (geste === SIGNER && formulaire.get("engagement") !== "oui") {
    return { ok: false, formulaire: SIGNER, erreurs: { engagement: lierPonctuation("Coche la case pour signer : c'est ton équipe qui s'engage.") } };
  }
  const reponse = geste === SIGNER ? await signerCharteMiamSafe(jeton, ip, lieu.id) : await quitterCharteMiamSafe(jeton, ip, lieu.id);
  if (reponse.ok) {
    const message = geste === SIGNER ? "C'est signé ! Le badge Miam Safe apparaît sur ta fiche. Merci à toute ton équipe." : "Tu as quitté la charte. Le badge disparaît de ta fiche.";
    return { ok: true, formulaire: geste, message: lierPonctuation(message) };
  }
  await redirigerSiSessionFermee(request, reponse.erreur);
  return { ok: false, formulaire: geste, message: lierPonctuation(messages[reponse.erreur] ?? "Oups, ça n'a pas marché. Réessaie dans un instant.") };
}

/** Page /lieu/:id/miam-safe : la charte, son état, signer ou quitter (gérant). */
export default function PageMiamSafe({ loaderData }: Route.ComponentProps) {
  const { lieu, gerant, charte } = loaderData;
  const reponse = useActionData<ReponseFormulaire>();
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page="Miam Safe"
        chapo={lierPonctuation("Quand un client ne se sent pas en sécurité, il sait qu'il peut compter sur ton équipe. Le badge Miam Safe le dit sur ta fiche, gratuitement.")}
      />
      <div className="grid gap-8">
        {!charte ? (
          <p className="font-semibold">{lierPonctuation("Oups, la charte ne s'est pas affichée. Recharge la page dans un instant.")}</p>
        ) : charte.signee ? (
          <p role="status" className="rounded-2xl border-2 border-encre bg-jaune px-5 py-4 font-bold">
            🛡 {lierPonctuation(`Ton lieu a signé la charte Miam Safe${charte.signeeLe ? ` le ${formaterJourEnLettres(jourParis.format(new Date(charte.signeeLe))) ?? ""}` : ""}.`)}
          </p>
        ) : charte.retireeParEquipe ? (
          <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(messages["charte-retiree"]!)}</p>
        ) : null}

        <section aria-labelledby="charte-engagements" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
          <h2 id="charte-engagements" className="mb-4 text-2xl font-extrabold">Ce que ton équipe s'engage à faire</h2>
          <ol className="grid gap-4">
            {ENGAGEMENTS_CHARTE_MIAM_SAFE.map((e, i) => (
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
          <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation("Seul le gérant signe ou quitte la charte.")}</p>
        ) : charte && !charte.signee && !charte.retireeParEquipe ? (
          <FormulaireCompte nom={SIGNER} bouton="Signer la charte">
            <CaseACocher nom="engagement">{lierPonctuation("J'ai lu la charte, et mon équipe s'engage à la respecter.")}</CaseACocher>
          </FormulaireCompte>
        ) : charte?.signee ? (
          <FormulaireCompte nom={QUITTER} bouton="Quitter la charte" danger>
            <p className="text-gris">{lierPonctuation("Le badge disparaîtra de ta fiche, et les alertes silencieuses ne pourront plus t'être envoyées.")}</p>
          </FormulaireCompte>
        ) : null}
        {reponse && !reponse.erreurs && <p role="status" className={`font-semibold ${reponse.ok ? "text-encre" : "text-rouge-texte"}`}>{reponse.message}</p>}
      </div>
    </Section>
  );
}
