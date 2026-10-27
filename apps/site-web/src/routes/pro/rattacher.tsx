import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/rattacher";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { Section } from "~/composants/mise-en-page/Section";
import { FormulaireRattachement } from "~/composants/pro/FormulaireRattachement";
import { RechercheLieu } from "~/composants/pro/RechercheLieu";
import { TEXTES_RATTACHER_LIEU_PAR_LANGUE, type CodeRechercheLieu } from "~/contenus/rattacher-lieu";
import { ecrireAdresseSitePrincipal } from "~/fonctions/hotes/ecrire-adresse-site-principal";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { chercherLieux, demanderRattachement, lireFichePublique } from "~/services/pro.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  return [...creerMeta({ ...choisirTextes(TEXTES_RATTACHER_LIEU_PAR_LANGUE, langue).meta, langue }), { name: "robots", content: "noindex" }];
}

/**
 * /rattacher?texte=… : la recherche (côté serveur, pour la page sans JavaScript) ; /rattacher/:id : le lieu choisi, pour
 * le formulaire de demande (sauf s'il est déjà dans le tableau du compte). Un lieu encore en brouillon n'a pas de fiche
 * publique : son nom vient alors de la recherche (?nom=…&ville=…).
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, compte } = await exigerCompte(request);
  const ip = lireIpVisiteur(request);
  const parametres = new URL(request.url).searchParams;
  if (params.id !== undefined) {
    const id = Number(params.id);
    if (!/^\d{1,9}$/.test(params.id) || id <= 0) throw data(null, { status: 404 });
    const fiche = await lireFichePublique(id, ip);
    if (!fiche.ok && fiche.erreur !== "lieu-inconnu") throw data("Espace pro momentanément indisponible", { status: 503 });
    const lieu = fiche.ok
      ? { id, nom: fiche.lieu.nom, ville: fiche.lieu.ville, type: fiche.lieu.type }
      : { id, nom: (parametres.get("nom") ?? "").slice(0, 80), ville: (parametres.get("ville") ?? "").slice(0, 80), type: null };
    const deja = compte.pro?.lieux.find((rattache) => rattache.lieuId === id && rattache.statut !== "refuse") ?? null;
    return { recherche: null, lieu, deja: deja?.statut ?? null };
  }
  const texte = (parametres.get("texte") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (texte.length < 2) return { recherche: { texte, trouves: null, code: texte ? ("trop-court" as const) : null }, lieu: null, deja: null };
  const reponse = await chercherLieux(texte, jeton, ip);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  const code: CodeRechercheLieu | null = !reponse.ok
    ? reponse.erreur === "trop-de-demandes" ? "trop-de-demandes" : "panne"
    : reponse.lieux.length === 0 ? "aucun" : null;
  return { recherche: { texte, trouves: reponse.ok ? reponse.lieux : null, code }, lieu: null, deja: null };
}

/** Envoie la demande : l'équipe vérifie, puis le lieu s'ouvre dans le tableau. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const lieuId = Number(formulaire.get("lieuId"));
  if (!Number.isInteger(lieuId) || lieuId <= 0) throw data("Lieu inconnu", { status: 400 });
  const preuve = String(formulaire.get("preuve") ?? "").trim();
  const siretTape = String(formulaire.get("siret") ?? "").trim();
  const siret = siretTape.replace(/[\s.]/g, "");
  const valeurs = { gerant: formulaire.get("gerant") === "oui" ? "oui" : "", preuve, siret: siretTape };
  const E = choisirTextes(TEXTES_RATTACHER_LIEU_PAR_LANGUE, lireLangueRequete(request).langue).erreurs;

  const erreurs: Record<string, string> = {};
  if (!valeurs.gerant) erreurs.gerant = E.gerant;
  if (preuve.length < 1 || preuve.length > 600) erreurs.preuve = E.preuve;
  if (siret && !/^\d{14}$/.test(siret)) erreurs.siret = E.siret;
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "rattacher", erreurs, valeurs };

  const { jeton } = await exigerCompte(request);
  const reponse = await demanderRattachement(jeton, lireIpVisiteur(request), { lieuId, role: "gerant", preuve, ...(siret ? { siret } : {}) });
  if (reponse.ok) throw redirect("/tableau?rattachement=envoye");
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "champ-invalide" && (reponse.champ === "preuve" || reponse.champ === "siret")) {
    const messageChamp = reponse.champ === "siret" ? E.siretRefuse : E.preuve;
    return { ok: false, formulaire: "rattacher", erreurs: { [reponse.champ]: lierPonctuation(messageChamp) }, valeurs };
  }
  const message = reponse.erreur === "deja-demande"
    ? E.dejaDemande
    : reponse.erreur === "trop-de-demandes"
      ? E.tropDeDemandes
      : reponse.erreur === "lieu-inconnu"
      ? E.lieuInconnu
        : reponse.erreur === "champ-invalide"
          ? E.champInvalide
          : E.panne;
  return { ok: false, formulaire: "rattacher", message: lierPonctuation(message), valeurs };
}

/** Page /rattacher : chercher son lieu, puis dire qu'il est à soi. */
export default function PageRattacher({ loaderData }: Route.ComponentProps) {
  const { recherche, lieu, deja } = loaderData;
  const T = utiliserTextes(TEXTES_RATTACHER_LIEU_PAR_LANGUE);
  const P = T.page;
  const langue = utiliserLangue();
  return (
    <>
      <Section fond="creme" etroit className="!pt-10 md:!pt-14">
        <TitreSection principal aGauche chapo={lierPonctuation(T.chapo)}>
          {T.titre}
        </TitreSection>
        {lieu ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
              {lieu.type && <PictoCategorie type={lieu.type} className="h-12 w-12 shrink-0" />}
              <div className="min-w-0">
                <p className="font-titre text-2xl font-extrabold [overflow-wrap:anywhere]">{lieu.nom || T.lieuNumero(lieu.id)}</p>
                {lieu.ville && <p className="font-medium">{lieu.ville}</p>}
              </div>
            </div>
            {deja ? (
              <p role="status" className="rounded-2xl border-2 border-encre bg-white px-5 py-4 font-semibold">
                {lierPonctuation(deja === "valide" ? P.dejaValide : P.dejaDemande)}
                <Link to="/tableau" className={classeLien}>{P.retourTableau}</Link>
              </p>
            ) : (
              <FormulaireRattachement lieuId={lieu.id} />
            )}
            <p className="mt-6 text-gris">
              {lierPonctuation(P.pasLeBon)}
              <Link to="/rattacher" className={classeLien}>{P.autreLieu}</Link>
            </p>
          </>
        ) : (
          <RechercheLieu texte={recherche?.texte ?? ""} trouves={recherche?.trouves ?? null} code={recherche?.code ?? null} />
        )}
        <p className="mt-8 text-gris">
          {lierPonctuation(P.pasEncore)}
          <a href={ecrireAdresseSitePrincipal("/inscrire-mon-lieu", langue)} className={classeLien}>{P.inscrisLe}</a>
          {lierPonctuation(P.inscrisSuite)}
        </p>
      </Section>
    </>
  );
}
