import { data } from "react-router";

import type { Route } from "./+types/ma-carte";
import { BlocCarteDuLieu } from "~/composants/lieux/BlocCarteDuLieu";
import { Section } from "~/composants/mise-en-page/Section";
import { EditeurCarte, type ReponseCarte } from "~/composants/pro/EditeurCarte";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { ERREURS_CARTE } from "~/contenus/carte-du-lieu";
import { appliquerGesteCarte } from "~/fonctions/carte/appliquer-geste-carte";
import { convertirBrouillonEnCarte } from "~/fonctions/carte/convertir-brouillon-en-carte";
import { creerBrouillonCarte } from "~/fonctions/carte/creer-brouillon-carte";
import { lireBrouillonCarte } from "~/fonctions/carte/lire-brouillon-carte";
import { nommerBoutonCarte } from "~/fonctions/carte/nommer-bouton-carte";
import { nommerChampCarte } from "~/fonctions/carte/nommer-champ-carte";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { enregistrerCartePro, lireCartePro } from "~/services/pro.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Ma carte · ${loaderData.lieu.nom}` : "Ma carte", description: "La carte de ton lieu sur SOS Miam." }), { name: "robots", content: "noindex" }];
}

/** La fiche du lieu, la carte enregistrée et ce que le compte peut en faire (le gérant modifie, l'équipe lit). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  const reponse = await lireCartePro(jeton, ip, lieu.id);
  if (!reponse.ok) await redirigerSiSessionFermee(request, reponse.erreur);
  return { lieu, peutModifier, carteLue: reponse.ok, carte: reponse.ok ? reponse.carte : null };
}

const messagesEnvoi: Record<string, string> = {
  "trop-de-demandes": "Tu as beaucoup enregistré cette dernière heure : réessaie dans un moment. Ton brouillon est toujours là.",
  "reserve-au-gerant": "Seul le gérant modifie la carte.",
  "carte-invalide": "Ta carte ne passe pas : vérifie les noms et les prix.",
};

/**
 * Un bouton de l'éditeur (ajouter, supprimer, monter, descendre) change le brouillon et le renvoie, sans rien enregistrer ;
 * « Enregistrer ma carte » (ou Entrée) vérifie le brouillon avec la fonction commune, puis l'envoie à l'API (gérant).
 */
export async function action({ request, params }: Route.ActionArgs): Promise<ReponseCarte> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const { jeton, ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  const brouillon = lireBrouillonCarte(formulaire);
  const reponse = { formulaire: "carte" as const, brouillon, focus: null, version: crypto.randomUUID() };
  if (!peutModifier) return { ...reponse, ok: false, message: lierPonctuation("Seul le gérant modifie la carte.") };

  const geste = String(formulaire.get("geste") ?? "enregistrer");
  if (geste !== "enregistrer") {
    const resultat = appliquerGesteCarte(brouillon, geste);
    return {
      ...reponse, ok: resultat.fait, brouillon: resultat.brouillon,
      // Rien de fait : le focus reste sur le bouton touché
      focus: resultat.focus ?? { bouton: nommerBoutonCarte(geste) },
      message: lierPonctuation(resultat.message || "Ce bouton n'a rien changé."),
    };
  }

  const convertie = convertirBrouillonEnCarte(brouillon);
  if (!convertie.ok) {
    const erreurs = Object.fromEntries(Object.entries(convertie.erreurs).map(([nom, texte]) => [nom, lierPonctuation(texte)]));
    const premier = Object.keys(erreurs)[0];
    return { ...reponse, ok: false, erreurs, focus: premier ? { champ: premier } : null, message: convertie.message ? lierPonctuation(convertie.message) : undefined };
  }
  const envoi = await enregistrerCartePro(jeton, ip, lieu.id, convertie.carte);
  if (envoi.ok) {
    const texte = envoi.carte === null
      ? "Ta carte est effacée : plus rien ne s'affiche sur ta fiche."
      : lieu.statut === "publie"
        ? "C'est en ligne : ta carte est à jour sur ta fiche !"
        : "Ta carte est enregistrée : elle s'affichera dès que ta fiche sera publiée.";
    return { ...reponse, ok: true, brouillon: creerBrouillonCarte(envoi.carte), message: lierPonctuation(texte) };
  }
  await redirigerSiSessionFermee(request, envoi.erreur);
  // Refusée par l'API malgré la vérification du site : l'endroit qu'elle donne
  if (envoi.erreur === "carte-invalide" && typeof envoi.section === "number" && envoi.champ && envoi.champ in ERREURS_CARTE) {
    const champ = envoi.champ as keyof typeof ERREURS_CARTE;
    const nom = typeof envoi.element === "number" ? nommerChampCarte(envoi.section, champ === "autre" ? "nom" : champ, envoi.element) : nommerChampCarte(envoi.section, "titre");
    return { ...reponse, ok: false, erreurs: { [nom]: lierPonctuation(ERREURS_CARTE[champ]) }, focus: { champ: nom } };
  }
  const texte = messagesEnvoi[envoi.erreur] ?? "Oups, ta carte n'a pas été enregistrée. Réessaie dans un instant : ton brouillon est toujours là.";
  return { ...reponse, ok: false, message: lierPonctuation(texte) };
}

/** Page /lieu/:id/carte : « Ma carte », l'éditeur et son aperçu (gérant), ou la carte en lecture (équipe). */
export default function PageMaCarte({ loaderData }: Route.ComponentProps) {
  const { lieu, peutModifier, carteLue, carte } = loaderData;
  const visible = carte?.sections.some((section) => section.elements.length > 0) ?? false;
  const apercu = visible && carte
    ? <BlocCarteDuLieu carte={carte} type={lieu.type} id="carte-apercu-titre" niveau={3} />
    : <p className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">{lierPonctuation(peutModifier ? "Rien pour l'instant : enregistre ta carte pour la voir ici." : "Pas encore de carte : le gérant la remplit ici.")}</p>;
  return (
    <Section fond="creme" etroit className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page="Ma carte"
        chapo={lierPonctuation(peutModifier ? "Tes plats, tes boissons, tes formules et leurs prix : en ligne dès que tu enregistres." : "La carte du lieu, telle que les gourmands la voient. Seul le gérant la modifie.")}
      />
      {!carteLue ? (
        <p role="alert" className="font-semibold">{lierPonctuation("Oups, ta carte ne s'est pas affichée. Recharge la page dans un instant.")}</p>
      ) : peutModifier ? (
        <>
          <div className="mb-6 grid gap-2 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 text-sm">
            <p className="font-semibold">{lierPonctuation("Ajoute, range, supprime : rien ne part tant que tu n'appuies pas sur « Enregistrer ma carte ».")}</p>
            <p>{lierPonctuation("Un plat qui contient de l'alcool est montré avec le message sanitaire sur ta fiche, et caché aux moins de 18 ans dans l'app.")}</p>
          </div>
          <EditeurCarte depart={creerBrouillonCarte(carte)} />
          <section aria-labelledby="carte-apercu" className="mt-14">
            <h2 id="carte-apercu" className="mb-2 text-2xl font-extrabold">{lierPonctuation("Aperçu : comme sur ta fiche")}</h2>
            <p className="mb-4 text-gris">{lierPonctuation("Ta carte enregistrée, telle que les gourmands la voient.")}</p>
            {apercu}
          </section>
        </>
      ) : apercu}
    </Section>
  );
}
