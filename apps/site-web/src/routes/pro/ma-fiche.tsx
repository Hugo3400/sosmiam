import { data } from "react-router";

import type { Route } from "./+types/ma-fiche";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Section } from "~/composants/mise-en-page/Section";
import { EncartImagesLieu } from "~/composants/pro/EncartImagesLieu";
import { FicheEnLecture } from "~/composants/pro/FicheEnLecture";
import { FormulaireFiche } from "~/composants/pro/FormulaireFiche";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_FICHE_PRO_PAR_LANGUE } from "~/contenus/fiche-pro";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { garderChampsModifies } from "~/fonctions/pro/garder-champs-modifies";
import { lireChampsFiche } from "~/fonctions/pro/lire-champs-fiche";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { expliquerCompteLimite } from "~/fonctions/compte/expliquer-compte-limite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { modifierFichePro } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { ChampsFiche, FichePro } from "~/types/pro";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_FICHE_PRO_PAR_LANGUE, langue).meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** La fiche du lieu et ce que le compte peut en faire (le gérant modifie, l'équipe lit). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { lieu, peutModifier } = await exigerLieuPro(request, params.id);
  return { lieu, peutModifier };
}

/** Les champs de la fiche tels qu'ils sont enregistrés, avec « » (horaires, texte vides) lu comme inconnu. */
function lireActuel(lieu: FichePro): ChampsFiche {
  const { nom, adresse, horaires, texte, telephone, siteWeb, instagram, animaux, accessible, terrasse, wifi, enfants, parking, paiements, reservation } = lieu;
  return { nom, adresse, horaires: horaires || null, texte: texte || null, telephone, siteWeb, instagram, animaux, accessible, terrasse, wifi, enfants, parking, paiements, reservation };
}

type NomsChamps = (typeof TEXTES_FICHE_PRO_PAR_LANGUE)["fr"]["nomsChamps"];

const nommerChamp = (noms: NomsChamps, champ: string) => (Object.hasOwn(noms, champ) ? noms[champ as keyof NomsChamps] : undefined);

const ecrireListe = (noms: NomsChamps, champs: string[]) => champs.map((champ) => nommerChamp(noms, champ)?.toLowerCase() ?? champ).join(", ");

/**
 * Enregistre la fiche (gérant) : seuls les champs qui changent partent. Les infos sont en ligne tout de suite ; le nom et
 * l'adresse partent vers l'équipe (une adresse vidée n'est pas envoyée : elle ne s'efface pas).
 */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  const langue = lireLangueRequete(request).langue;
  const T = choisirTextes(TEXTES_FICHE_PRO_PAR_LANGUE, langue);
  const M = T.messages;
  if (!peutModifier) return { ok: false, formulaire: "fiche", message: lierPonctuation(M.reserveAuGerant) };

  const { champs, message, erreurs, valeurs } = lireChampsFiche(formulaire, langue);
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "fiche", erreurs, valeurs };

  const modifies = garderChampsModifies(lireActuel(lieu), champs);
  if (modifies.adresse === null) delete modifies.adresse;
  if (Object.keys(modifies).length === 0) return { ok: true, formulaire: "fiche", message: lierPonctuation(M.rienChange) };
  const versEquipe = "nom" in modifies || "adresse" in modifies;

  const reponse = await modifierFichePro(jeton, ip, lieu.id, { ...modifies, ...(versEquipe && message ? { message } : {}) });
  if (reponse.ok) {
    const phrases: string[] = [];
    if (reponse.appliques.length > 0) phrases.push(M.enLigne(ecrireListe(T.nomsChamps, reponse.appliques)));
    if (reponse.envoyesAEquipe.length > 0) {
      phrases.push(reponse.envoyesAEquipe.length > 1 ? M.versEquipe.deux : reponse.envoyesAEquipe[0] === "nom" ? M.versEquipe.nom : M.versEquipe.adresse);
    }
    if (phrases.length === 0) phrases.push(M.rienChange);
    return { ok: true, formulaire: "fiche", message: lierPonctuation(phrases.join(" ")) };
  }
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "proposition-invalide" && reponse.champ && reponse.champ in T.nomsChamps) {
    return { ok: false, formulaire: "fiche", erreurs: { [reponse.champ]: lierPonctuation(M.champInvalide) }, valeurs };
  }
  if (reponse.erreur === "proposition-invalide" && reponse.champ === "message") {
    return { ok: false, formulaire: "fiche", erreurs: { message: lierPonctuation(M.messageInvalide) }, valeurs };
  }
  // Compte limité : la fiche publique ne change pas tant que ça dure
  if (reponse.erreur === "compte-limite") return { ok: false, formulaire: "fiche", message: lierPonctuation(expliquerCompteLimite(reponse.jusqua, langue)), valeurs };
  const texte = reponse.erreur === "trop-de-suggestions"
    ? M.tropDeSuggestions
    : reponse.erreur === "reserve-au-gerant"
      ? M.reserveAuGerant
      : M.panne;
  return { ok: false, formulaire: "fiche", message: lierPonctuation(texte), valeurs };
}

/** Page /lieu/:id : « Ma fiche » en sections (gérant), ou en lecture (équipe). */
export default function PageMaFiche({ loaderData }: Route.ComponentProps) {
  const { lieu, peutModifier } = loaderData;
  const T = utiliserTextes(TEXTES_FICHE_PRO_PAR_LANGUE);
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page={T.page}
        chapo={peutModifier ? lierPonctuation(T.chapo) : undefined}
      />
      {lieu.estVerifie && <EncartImagesLieu lieuId={lieu.id} gerant={peutModifier} />}
      {peutModifier ? <FormulaireFiche lieu={lieu} /> : <FicheEnLecture lieu={lieu} />}
    </Section>
  );
}
