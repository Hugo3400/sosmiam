import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/rattacher";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { Section } from "~/composants/mise-en-page/Section";
import { FormulaireRattachement } from "~/composants/pro/FormulaireRattachement";
import { RechercheLieu } from "~/composants/pro/RechercheLieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { chercherLieux, demanderRattachement, lireFichePublique } from "~/services/pro.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Rattacher mon lieu", description: "Dis-nous que ce lieu est à toi pour gérer sa fiche." }), { name: "robots", content: "noindex" }];
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
      : { id, nom: (parametres.get("nom") ?? "").slice(0, 80) || `Lieu n° ${id}`, ville: (parametres.get("ville") ?? "").slice(0, 80), type: null };
    const deja = compte.pro?.lieux.find((rattache) => rattache.lieuId === id && rattache.statut !== "refuse") ?? null;
    return { recherche: null, lieu, deja: deja?.statut ?? null };
  }
  const texte = (parametres.get("texte") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (texte.length < 2) return { recherche: { texte, trouves: null, message: texte ? "Tape au moins 2 lettres." : null }, lieu: null, deja: null };
  const reponse = await chercherLieux(texte, jeton, ip);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  const message = !reponse.ok
    ? reponse.erreur === "trop-de-demandes" ? "Beaucoup de recherches d'un coup : réessaie dans quelques minutes." : "La recherche ne répond pas. Réessaie dans un instant."
    : reponse.lieux.length === 0 ? "Aucun lieu trouvé. Essaie avec un autre mot, ou inscris ton lieu." : null;
  return { recherche: { texte, trouves: reponse.ok ? reponse.lieux : null, message }, lieu: null, deja: null };
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

  const erreurs: Record<string, string> = {};
  if (!valeurs.gerant) erreurs.gerant = "Coche la case : seul le gérant peut demander la fiche (il invitera son équipe ensuite).";
  if (preuve.length < 1 || preuve.length > 600) erreurs.preuve = "Dis-nous en quelques mots comment vérifier (600 caractères au plus).";
  if (siret && !/^\d{14}$/.test(siret)) erreurs.siret = "Un SIRET, c'est 14 chiffres. Pas sous la main ? Laisse vide.";
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "rattacher", erreurs, valeurs };

  const { jeton } = await exigerCompte(request);
  const reponse = await demanderRattachement(jeton, lireIpVisiteur(request), { lieuId, role: "gerant", preuve, ...(siret ? { siret } : {}) });
  if (reponse.ok) throw redirect("/tableau?rattachement=envoye");
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "champ-invalide" && (reponse.champ === "preuve" || reponse.champ === "siret")) {
    const messageChamp = reponse.champ === "siret" ? "Ce SIRET ne semble pas juste : vérifie les 14 chiffres, ou laisse vide." : "Dis-nous en quelques mots comment vérifier (600 caractères au plus).";
    return { ok: false, formulaire: "rattacher", erreurs: { [reponse.champ]: lierPonctuation(messageChamp) }, valeurs };
  }
  const message = reponse.erreur === "deja-demande"
    ? "Tu as déjà demandé ce lieu : l'équipe regarde ta demande. Tu la retrouves dans ton tableau."
    : reponse.erreur === "trop-de-demandes"
      ? "Ça fait beaucoup de demandes d'un coup : réessaie demain, ou écris-nous à bonjour@sosmiam.fr."
      : reponse.erreur === "lieu-inconnu"
      ? "Ce lieu n'est plus sur SOS Miam. Cherche-le de nouveau, ou inscris-le."
        : reponse.erreur === "champ-invalide"
          ? "Un champ ne va pas : vérifie le formulaire."
          : "Oups, ta demande n'est pas partie. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: "rattacher", message: lierPonctuation(message), valeurs };
}

/** Page /rattacher : chercher son lieu, puis dire qu'il est à soi. */
export default function PageRattacher({ loaderData }: Route.ComponentProps) {
  const { recherche, lieu, deja } = loaderData;
  return (
    <>
      <Section fond="creme" etroit className="!pt-10 md:!pt-14">
        <TitreSection principal aGauche chapo={lierPonctuation("Trouve ton lieu sur SOS Miam, dis-nous qu'il est à toi : l'équipe vérifie, et sa fiche s'ouvre dans ton tableau.")}>
          Rattacher mon lieu
        </TitreSection>
        {lieu ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
              {lieu.type && <PictoCategorie type={lieu.type} className="h-12 w-12 shrink-0" />}
              <div className="min-w-0">
                <p className="font-titre text-2xl font-extrabold [overflow-wrap:anywhere]">{lieu.nom}</p>
                {lieu.ville && <p className="font-medium">{lieu.ville}</p>}
              </div>
            </div>
            {deja ? (
              <p role="status" className="rounded-2xl border-2 border-encre bg-white px-5 py-4 font-semibold">
                {lierPonctuation(deja === "valide" ? "Ce lieu est déjà à toi ! " : "Tu as déjà demandé ce lieu : l'équipe regarde. ")}
                <Link to="/tableau" className={classeLien}>Retour au tableau</Link>
              </p>
            ) : (
              <FormulaireRattachement lieuId={lieu.id} />
            )}
            <p className="mt-6 text-gris">
              {lierPonctuation("Pas le bon ? ")}
              <Link to="/rattacher" className={classeLien}>Chercher un autre lieu</Link>
            </p>
          </>
        ) : (
          <RechercheLieu texte={recherche?.texte ?? ""} trouves={recherche?.trouves ?? null} message={recherche?.message ?? null} />
        )}
        <p className="mt-8 text-gris">
          {lierPonctuation("Ton lieu n'est pas encore sur SOS Miam ? ")}
          <a href="https://sosmiam.fr/inscrire-mon-lieu" className={classeLien}>Inscris-le gratuitement</a>
          {lierPonctuation(" : l'équipe crée sa fiche, puis tu reviens ici.")}
        </p>
      </Section>
    </>
  );
}
