import { data } from "react-router";

import type { Route } from "./+types/inscrire-mon-lieu";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { FormulaireDemandeLieu, type ReponseDemandeLieu } from "~/composants/pro/FormulaireDemandeLieu";
import { STRUCTURE_DEMANDE_LIEU, TEXTES_DEMANDE_LIEU_PAR_LANGUE } from "~/contenus/demande-lieu";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { assemblerDemandeLieu } from "~/fonctions/lieux/assembler-demande-lieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { envoyerDemandeLieu } from "~/services/demandes-lieux.server";
import { lireLangueRequete } from "~/services/langue.server";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_DEMANDE_LIEU_PAR_LANGUE, langue);
  return creerMeta({ ...T.meta, langue });
}

/** Reçoit la demande d'un lieu (avec ou sans JavaScript), la vérifie et l'envoie à l'API. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseDemandeLieu> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const T = choisirTextes(TEXTES_DEMANDE_LIEU_PAR_LANGUE, lireLangueRequete(request).langue);
  const { champsLieu, champsContact, types } = assemblerDemandeLieu(STRUCTURE_DEMANDE_LIEU, T);
  const tousLesChamps = [...champsLieu, ...champsContact];
  const M = T.messages;
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();

  const valeurs: Record<string, string> = {};
  for (const c of tousLesChamps) valeurs[c.nom] = lire(c.nom);
  const type = lire("type");
  valeurs.type = types.some((t) => t.valeur === type) ? type : "";
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
    const resume = fautifs.length === 1 ? M.unChamp : M.plusieursChamps(fautifs.length);
    return { ok: false, message: resume, champ: fautifs[0], erreurs, valeurs };
  }

  const demande = Object.fromEntries(Object.entries(valeurs).filter(([, valeur]) => valeur !== ""));
  const resultat = await envoyerDemandeLieu({ ...demande, piege: lire("piege") }, request.headers.get("x-real-ip"));
  if (resultat.ok) {
    return {
      ok: true,
      message: lierPonctuation(M.envoyee),
    };
  }
  if (resultat.erreur === "champ-invalide") {
    const c = tousLesChamps.find((champ) => champ.nom === resultat.champ);
    if (!c) return { ok: false, message: lierPonctuation(M.champInconnu), valeurs };
    return { ok: false, message: M.unChamp, champ: c.nom, erreurs: { [c.nom]: lierPonctuation(c.erreur) }, valeurs };
  }
  const message = resultat.erreur === "trop-de-demandes" ? M.tropDeDemandes : M.erreur;
  return { ok: false, message: lierPonctuation(message), valeurs };
}

/** Page /inscrire-mon-lieu : un lieu demande à être sur SOS Miam ; la demande est validée dans le logiciel de gestion. */
export default function PageInscrireMonLieu() {
  const T = utiliserTextes(TEXTES_DEMANDE_LIEU_PAR_LANGUE);
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(T.chapo)}>
        {T.titre}
      </TitreSection>
      <FormulaireDemandeLieu />
    </Section>
  );
}
