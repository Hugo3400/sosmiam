import { data } from "react-router";

import type { Route } from "./+types/ma-fiche";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Section } from "~/composants/mise-en-page/Section";
import { FicheEnLecture } from "~/composants/pro/FicheEnLecture";
import { FormulaireFiche } from "~/composants/pro/FormulaireFiche";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { NOMS_CHAMPS } from "~/contenus/infos-pratiques";
import { garderChampsModifies } from "~/fonctions/pro/garder-champs-modifies";
import { lireChampsFiche } from "~/fonctions/pro/lire-champs-fiche";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { modifierFichePro } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { ChampsFiche, FichePro } from "~/types/pro";

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Ma fiche · ${loaderData.lieu.nom}` : "Ma fiche", description: "La fiche de ton lieu sur SOS Miam." }), { name: "robots", content: "noindex" }];
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

const ecrireListe = (champs: string[]) => champs.map((champ) => NOMS_CHAMPS[champ as keyof typeof NOMS_CHAMPS]?.toLowerCase() ?? champ).join(", ");

/**
 * Enregistre la fiche (gérant) : seuls les champs qui changent partent. Les infos sont en ligne tout de suite ; le nom et
 * l'adresse partent vers l'équipe (une adresse vidée n'est pas envoyée : elle ne s'efface pas).
 */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  if (!peutModifier) return { ok: false, formulaire: "fiche", message: lierPonctuation("Seul le gérant modifie la fiche.") };

  const { champs, message, erreurs, valeurs } = lireChampsFiche(formulaire);
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "fiche", erreurs, valeurs };

  const modifies = garderChampsModifies(lireActuel(lieu), champs);
  if (modifies.adresse === null) delete modifies.adresse;
  if (Object.keys(modifies).length === 0) return { ok: true, formulaire: "fiche", message: lierPonctuation("Rien n'a changé : ta fiche est déjà comme ça !") };
  const versEquipe = "nom" in modifies || "adresse" in modifies;

  const reponse = await modifierFichePro(jeton, ip, lieu.id, { ...modifies, ...(versEquipe && message ? { message } : {}) });
  if (reponse.ok) {
    const phrases: string[] = [];
    if (reponse.appliques.length > 0) phrases.push(`C'est en ligne : ${ecrireListe(reponse.appliques)}.`);
    if (reponse.envoyesAEquipe.length > 0) {
      phrases.push(`${reponse.envoyesAEquipe.length > 1 ? "Le nom et l'adresse partent" : reponse.envoyesAEquipe[0] === "nom" ? "Le nom part" : "L'adresse part"} vers l'équipe SOS Miam : sa décision s'affichera dans Suggestions.`);
    }
    if (phrases.length === 0) phrases.push("Rien n'a changé : ta fiche est déjà comme ça !");
    return { ok: true, formulaire: "fiche", message: lierPonctuation(phrases.join(" ")) };
  }
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "proposition-invalide" && reponse.champ && reponse.champ in NOMS_CHAMPS) {
    return { ok: false, formulaire: "fiche", erreurs: { [reponse.champ]: lierPonctuation("Ce champ ne passe pas : vérifie-le (longueur, forme, mots).") }, valeurs };
  }
  if (reponse.erreur === "proposition-invalide" && reponse.champ === "message") {
    return { ok: false, formulaire: "fiche", erreurs: { message: lierPonctuation("Ce petit mot ne passe pas : raccourcis-le un peu.") }, valeurs };
  }
  const texte = reponse.erreur === "trop-de-suggestions"
    ? "Il y a déjà des changements de nom ou d'adresse en attente : rien n'a été enregistré. Retire le nom et l'adresse pour enregistrer le reste, ou attends la réponse de l'équipe."
    : reponse.erreur === "reserve-au-gerant"
      ? "Seul le gérant modifie la fiche."
      : "Oups, ta fiche n'a pas été enregistrée. Réessaie dans un instant.";
  return { ok: false, formulaire: "fiche", message: lierPonctuation(texte), valeurs };
}

/** Page /lieu/:id : « Ma fiche » en sections (gérant), ou en lecture (équipe). */
export default function PageMaFiche({ loaderData }: Route.ComponentProps) {
  const { lieu, peutModifier } = loaderData;
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page="Ma fiche"
        chapo={peutModifier ? lierPonctuation("Horaires, présentation, contact et infos pratiques : en ligne dès que tu enregistres.") : undefined}
      />
      {peutModifier ? <FormulaireFiche lieu={lieu} /> : <FicheEnLecture lieu={lieu} />}
    </Section>
  );
}
