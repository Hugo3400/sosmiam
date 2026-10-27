import { data, type ActionFunctionArgs, type LoaderFunctionArgs, type ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/securite";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { NouveauSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import { EngagementsSecurite } from "~/composants/securite/EngagementsSecurite";
import { EnTeteSecurite } from "~/composants/securite/EnTeteSecurite";
import type { ReponseSignalement } from "~/composants/securite/FormulaireSignalement";
import { MerciSignalement } from "~/composants/securite/MerciSignalement";
import { PerimetreSecurite } from "~/composants/securite/PerimetreSecurite";
import { RecompensesSecurite } from "~/composants/securite/RecompensesSecurite";
import { ReglesSecurite } from "~/composants/securite/ReglesSecurite";
import { SignalerFaille } from "~/composants/securite/SignalerFaille";
import { TableauHonneur } from "~/composants/securite/TableauHonneur";
import {
  LIMITE_ENVOI_SIGNALEMENT,
  ORDRE_CHAMPS_SIGNALEMENT,
  TEXTES_FORMULAIRE_SECURITE_PAR_LANGUE,
  type ChampSignalement,
  type TextesFormulaireSecurite,
} from "~/contenus/formulaire-securite";
import { TEXTES_META_SECURITE_PAR_LANGUE, TEXTES_SECURITE_PAR_LANGUE } from "~/contenus/securite";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { lireChampSignalement } from "~/fonctions/securite/lire-champ-signalement";
import { lireFormulaireSignalement, type ValeursSignalement } from "~/fonctions/securite/lire-formulaire-signalement";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { ecrireMessageService } from "~/fonctions/texte/ecrire-message-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { lireLangueRequete } from "~/services/langue.server";
import { envoyerSignalementSecurite, listerTableauHonneur } from "~/services/securite.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export function meta(donnees?: Route.MetaArgs) {
  const langue = lireLangueMeta(donnees?.matches);
  return creerMeta({ ...choisirTextes(TEXTES_META_SECURITE_PAR_LANGUE, langue), langue });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { langue } = lireLangueRequete(request);
  return { entrees: await listerTableauHonneur(lireIpVisiteur(request)), textes: choisirTextes(TEXTES_SECURITE_PAR_LANGUE, langue) };
}

export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  if (!formMethod && currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

function repondreErreurs(
  messages: TextesFormulaireSecurite["messages"],
  erreurs: Partial<Record<ChampSignalement, string>>,
  valeurs: ValeursSignalement | undefined,
  imagesARemettre: boolean,
  message?: string,
): ReponseSignalement {
  const fautifs = ORDRE_CHAMPS_SIGNALEMENT.filter((champ) => erreurs[champ]);
  const general = message ?? (fautifs.length === 1 ? messages.unChamp : messages.plusieursChamps(fautifs.length));
  return { ok: false, message: lierPonctuation(general), champ: fautifs[0], erreurs, valeurs, imagesARemettre };
}

function relireValeurs(signalement: NouveauSignalementSecurite): ValeursSignalement {
  return {
    nom: signalement.nom,
    email: signalement.email,
    cible: signalement.cible,
    titre: signalement.titre,
    description: signalement.description,
    lien: signalement.lien ?? "",
    tableauHonneur: signalement.nomTableauHonneur !== null,
    nomTableauHonneur: signalement.nomTableauHonneur ?? "",
    majeur: true,
    reglesAcceptees: true,
  };
}

export async function action({ request }: ActionFunctionArgs): Promise<ReponseSignalement> {
  const { langue } = lireLangueRequete(request);
  const { champs, messages } = choisirTextes(TEXTES_FORMULAIRE_SECURITE_PAR_LANGUE, langue);
  if (Number(request.headers.get("content-length")) > LIMITE_ENVOI_SIGNALEMENT) {
    return repondreErreurs(messages, { images: lierPonctuation(ecrireMessageService("image-trop-lourde", langue)) }, undefined, true);
  }
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });

  const lecture = await lireFormulaireSignalement(formulaire, langue);
  if (!lecture.ok) return repondreErreurs(messages, lecture.erreurs, lecture.valeurs, lecture.imagesEnvoyees);

  const { signalement } = lecture;
  const resultat = await envoyerSignalementSecurite(signalement, lecture.piege, lireIpVisiteur(request));
  if (resultat.ok) return { ok: true };

  const valeurs = relireValeurs(signalement);
  const imagesARemettre = signalement.images.length > 0;
  if (resultat.erreur === "champ-invalide") {
    const champ = lireChampSignalement(resultat.champ);
    const message = ecrireMessageService("champ-invalide", langue);
    if (!champ) return { ok: false, message: lierPonctuation(message), valeurs, imagesARemettre };
    const texte = champ === "images" ? ecrireMessageService("image-format", langue) : champs[champ].erreur;
    return repondreErreurs(messages, { [champ]: lierPonctuation(texte) }, valeurs, imagesARemettre, message);
  }
  if (resultat.erreur === "trop-d-images" || resultat.erreur === "image-trop-lourde" || resultat.erreur === "image-format") {
    return repondreErreurs(messages, { images: lierPonctuation(ecrireMessageService(resultat.erreur, langue)) }, valeurs, imagesARemettre);
  }
  const message = resultat.erreur === "stockage-plein" ? messages.stockagePlein : ecrireMessageService(resultat.erreur, langue);
  return { ok: false, message: lierPonctuation(message), valeurs, imagesARemettre };
}

type Props = { loaderData: Awaited<ReturnType<typeof loader>>; actionData?: ReponseSignalement };

export default function PageSecurite({ loaderData, actionData }: Props) {
  const T = loaderData.textes;
  if (actionData?.ok) return <MerciSignalement textes={T.merci} />;
  return (
    <>
      <EnTeteSecurite textes={T.page} />
      <PerimetreSecurite textes={T.perimetre} />
      <ReglesSecurite textes={T.regles} />
      <EngagementsSecurite textes={T.engagements} />
      <RecompensesSecurite textes={T.recompenses} />
      <TableauHonneur entrees={loaderData.entrees} textes={T.tableauHonneur} />
      <SignalerFaille textes={T.signaler} />
    </>
  );
}
