import { data } from "react-router";

import type { Route } from "./+types/inscrire-mon-lieu";

import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { FormulaireDemandeLieu, type ReponseDemandeLieu } from "~/composants/pro/FormulaireDemandeLieu";
import { champsContact, champsLieu, typesDemandeLieu } from "~/contenus/demande-lieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { envoyerDemandeLieu } from "~/services/demandes-lieux.server";

const tousLesChamps = [...champsLieu, ...champsContact];

export function meta(_: Route.MetaArgs) {
  return creerMeta({
    titre: "Inscrire mon lieu",
    description: "Resto, pâtisserie, bar ou sortie indépendant à Montpellier ou dans l'Hérault : inscris ton lieu sur SOS Miam. C'est gratuit, sans abonnement ni commission.",
  });
}

/** Reçoit la demande d'un lieu (avec ou sans JavaScript), la vérifie et l'envoie à l'API. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseDemandeLieu> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/[ \t]+/g, " ").trim();

  const valeurs: Record<string, string> = {};
  for (const c of tousLesChamps) valeurs[c.nom] = lire(c.nom);
  const type = lire("type");
  valeurs.type = typesDemandeLieu.some((t) => t.valeur === type) ? type : "";
  // « monlieu.fr » devient « https://monlieu.fr » : l'API attend une adresse complète
  if (valeurs.siteWeb && !/^https?:\/\//i.test(valeurs.siteWeb)) valeurs.siteWeb = `https://${valeurs.siteWeb}`;

  // Mêmes règles que l'API, vérifiées ici pour signaler d'un coup tous les champs à corriger
  const erreurs: Record<string, string> = {};
  for (const c of tousLesChamps) {
    const valeur = valeurs[c.nom];
    const invalide = (c.obligatoire && !valeur)
      || valeur.length > c.maximum
      || (c.nom === "description" && valeur.length < 20)
      || (c.nom === "contactEmail" && !verifierEmail(valeur))
      || (c.nom === "siteWeb" && valeur !== "" && !/^https?:\/\/\S+$/.test(valeur));
    if (invalide) erreurs[c.nom] = lierPonctuation(c.erreur);
  }
  const fautifs = Object.keys(erreurs);
  if (fautifs.length > 0) {
    const resume = fautifs.length === 1 ? "Un champ est à corriger." : `${fautifs.length} champs sont à corriger.`;
    return { ok: false, message: resume, champ: fautifs[0], erreurs, valeurs };
  }

  const demande = Object.fromEntries(Object.entries(valeurs).filter(([, valeur]) => valeur !== ""));
  const resultat = await envoyerDemandeLieu({ ...demande, piege: lire("piege") }, request.headers.get("x-real-ip"));
  if (resultat.ok) {
    return {
      ok: true,
      message: lierPonctuation("On lit chaque demande. Si tout est bon, on crée la fiche de ton lieu et on t'écrit à l'adresse indiquée. À Montpellier et dans l'Hérault, on peut même passer la créer avec toi."),
    };
  }
  if (resultat.erreur === "champ-invalide") {
    const c = tousLesChamps.find((champ) => champ.nom === resultat.champ);
    if (!c) return { ok: false, message: lierPonctuation("Un champ ne va pas : vérifie le formulaire."), valeurs };
    return { ok: false, message: "Un champ est à corriger.", champ: c.nom, erreurs: { [c.nom]: lierPonctuation(c.erreur) }, valeurs };
  }
  const message = resultat.erreur === "trop-de-demandes"
    ? "Doucement ! Trop de demandes d'affilée : réessaie dans une demi-heure, ou écris-nous à bonjour@sosmiam.fr."
    : "Oups, ta demande n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, message: lierPonctuation(message), valeurs };
}

/** Page /inscrire-mon-lieu : un lieu demande à être sur SOS Miam ; la demande est validée dans le logiciel de gestion. */
export default function PageInscrireMonLieu() {
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation("C'est gratuit, sans abonnement ni commission. Raconte-nous ton lieu : on lit chaque demande et on te répond par e-mail.")}
      >
        Inscris ton lieu
      </TitreSection>
      <FormulaireDemandeLieu />
    </Section>
  );
}
