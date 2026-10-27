import { data } from "react-router";

import type { Route } from "./+types/ma-carte";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { BlocCarteDuLieu } from "~/composants/lieux/BlocCarteDuLieu";
import { Section } from "~/composants/mise-en-page/Section";
import { EditeurCarte, type ReponseCarte } from "~/composants/pro/EditeurCarte";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_EDITEUR_CARTE_PAR_LANGUE } from "~/contenus/editeur-carte";
import { appliquerGesteCarte } from "~/fonctions/carte/appliquer-geste-carte";
import { convertirBrouillonEnCarte } from "~/fonctions/carte/convertir-brouillon-en-carte";
import { creerBrouillonCarte } from "~/fonctions/carte/creer-brouillon-carte";
import { lireBrouillonCarte } from "~/fonctions/carte/lire-brouillon-carte";
import { nommerBoutonCarte } from "~/fonctions/carte/nommer-bouton-carte";
import { nommerChampCarte } from "~/fonctions/carte/nommer-champ-carte";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { expliquerCompteLimite } from "~/fonctions/compte/expliquer-compte-limite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { enregistrerCartePro, lireCartePro } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_EDITEUR_CARTE_PAR_LANGUE, langue).meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** La fiche du lieu, la carte enregistrée et ce que le compte peut en faire (le gérant modifie, l'équipe lit). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  const reponse = await lireCartePro(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, peutModifier, carteLue: reponse.ok, carte: reponse.ok ? reponse.carte : null };
}

/**
 * Un bouton de l'éditeur (ajouter, supprimer, monter, descendre) change le brouillon et le renvoie, sans rien enregistrer ;
 * « Enregistrer ma carte » (ou Entrée) vérifie le brouillon avec la fonction commune, puis l'envoie à l'API (gérant).
 */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseCarte> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  const langue = lireLangueRequete(request).langue;
  const T = choisirTextes(TEXTES_EDITEUR_CARTE_PAR_LANGUE, langue);
  const M = T.messages;
  const messagesEnvoi: Record<string, string> = M.envoi;
  const brouillon = lireBrouillonCarte(formulaire);
  const reponse = { formulaire: "carte" as const, brouillon, focus: null, version: crypto.randomUUID() };
  if (!peutModifier) return { ...reponse, ok: false, message: lierPonctuation(M.reserveAuGerant) };

  const geste = String(formulaire.get("geste") ?? "enregistrer");
  if (geste !== "enregistrer") {
    const resultat = appliquerGesteCarte(brouillon, geste, langue);
    return {
      ...reponse, ok: resultat.fait, brouillon: resultat.brouillon,
      // Rien de fait : le focus reste sur le bouton touché
      focus: resultat.focus ?? { bouton: nommerBoutonCarte(geste) },
      message: lierPonctuation(resultat.message || M.rienChange),
    };
  }

  const convertie = convertirBrouillonEnCarte(brouillon, langue);
  if (!convertie.ok) {
    const erreurs = Object.fromEntries(Object.entries(convertie.erreurs).map(([nom, texte]) => [nom, lierPonctuation(texte)]));
    const premier = Object.keys(erreurs)[0];
    return { ...reponse, ok: false, erreurs, focus: premier ? { champ: premier } : null, message: convertie.message ? lierPonctuation(convertie.message) : undefined };
  }
  const envoi = await enregistrerCartePro(jeton, ip, lieu.id, convertie.carte);
  if (envoi.ok) {
    const texte = envoi.carte === null
      ? M.effacee
      : lieu.statut === "publie"
        ? M.enLigne
        : M.enregistree;
    return { ...reponse, ok: true, brouillon: creerBrouillonCarte(envoi.carte), message: lierPonctuation(texte) };
  }
  await redirigerSiSessionFermee(request, envoi.erreur);
  // Refusée par l'API malgré la vérification du site : l'endroit qu'elle donne
  if (envoi.erreur === "carte-invalide" && typeof envoi.section === "number" && envoi.champ && envoi.champ in T.erreurs) {
    const champ = envoi.champ as keyof typeof T.erreurs;
    const nom = typeof envoi.element === "number" ? nommerChampCarte(envoi.section, champ === "autre" ? "nom" : champ, envoi.element) : nommerChampCarte(envoi.section, "titre");
    return { ...reponse, ok: false, erreurs: { [nom]: lierPonctuation(T.erreurs[champ]) }, focus: { champ: nom } };
  }
  // Compte limité : la carte en ligne ne change pas tant que ça dure (le brouillon reste là)
  if (envoi.erreur === "compte-limite") return { ...reponse, ok: false, message: lierPonctuation(M.compteLimite(expliquerCompteLimite(envoi.jusqua, langue))) };
  const texte = messagesEnvoi[envoi.erreur] ?? M.panne;
  return { ...reponse, ok: false, message: lierPonctuation(texte) };
}

/** Page /lieu/:id/carte : « Ma carte », l'éditeur et son aperçu (gérant), ou la carte en lecture (équipe). */
export default function PageMaCarte({ loaderData }: Route.ComponentProps) {
  const { lieu, peutModifier, carteLue, carte } = loaderData;
  const T = utiliserTextes(TEXTES_EDITEUR_CARTE_PAR_LANGUE);
  const visible = carte?.sections.some((section) => section.elements.length > 0) ?? false;
  const apercu = visible && carte
    ? <BlocCarteDuLieu carte={carte} type={lieu.type} id="carte-apercu-titre" niveau={3} />
    : <p className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(peutModifier ? T.apercu.videGerant : T.apercu.videEquipe)}</p>;
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page={T.page}
        chapo={lierPonctuation(peutModifier ? T.chapoGerant : T.chapoEquipe)}
      />
      {!carteLue ? (
        <p role="alert" className="font-semibold">{lierPonctuation(T.illisible)}</p>
      ) : peutModifier ? (
        <>
          <div className="mb-6 grid gap-2 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 text-sm">
            <p className="font-semibold">{lierPonctuation(T.aide)}</p>
            <p>{lierPonctuation(T.alcool)}</p>
          </div>
          <EditeurCarte depart={creerBrouillonCarte(carte)} />
          <section aria-labelledby="carte-apercu" className="mt-14">
            <h2 id="carte-apercu" className="mb-2 text-2xl font-extrabold">{lierPonctuation(T.apercu.titre)}</h2>
            <p className="mb-4 text-gris">{lierPonctuation(T.apercu.texte)}</p>
            {apercu}
          </section>
        </>
      ) : apercu}
    </Section>
  );
}
