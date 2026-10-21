import { data, type ActionFunctionArgs, type LoaderFunctionArgs, type ShouldRevalidateFunctionArgs } from "react-router";

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
import { champsSignalement, LIMITE_ENVOI_SIGNALEMENT, messagesSignalement, ORDRE_CHAMPS_SIGNALEMENT, type ChampSignalement } from "~/contenus/formulaire-securite";
import { pageSecurite } from "~/contenus/securite";
import { lireChampSignalement } from "~/fonctions/securite/lire-champ-signalement";
import { lireFormulaireSignalement, type ValeursSignalement } from "~/fonctions/securite/lire-formulaire-signalement";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { ecrireMessageService } from "~/fonctions/texte/ecrire-message-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { envoyerSignalementSecurite, listerTableauHonneur } from "~/services/securite.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

export function meta() {
  return creerMeta({ titre: `${pageSecurite.titre} : signale une faille de sécurité`, description: pageSecurite.description });
}

export async function loader({ request }: LoaderFunctionArgs) {
  return { entrees: await listerTableauHonneur(lireIpVisiteur(request)) };
}

export function shouldRevalidate({ currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  if (!formMethod && currentUrl.pathname === nextUrl.pathname) return false;
  return defaultShouldRevalidate;
}

function repondreErreurs(
  erreurs: Partial<Record<ChampSignalement, string>>,
  valeurs: ValeursSignalement | undefined,
  imagesARemettre: boolean,
  message?: string,
): ReponseSignalement {
  const fautifs = ORDRE_CHAMPS_SIGNALEMENT.filter((champ) => erreurs[champ]);
  const general = message ?? (fautifs.length === 1 ? messagesSignalement.unChamp : messagesSignalement.plusieursChamps(fautifs.length));
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
  if (Number(request.headers.get("content-length")) > LIMITE_ENVOI_SIGNALEMENT) {
    return repondreErreurs({ images: lierPonctuation(ecrireMessageService("image-trop-lourde")) }, undefined, true);
  }
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });

  const lecture = await lireFormulaireSignalement(formulaire);
  if (!lecture.ok) return repondreErreurs(lecture.erreurs, lecture.valeurs, lecture.imagesEnvoyees);

  const { signalement } = lecture;
  const resultat = await envoyerSignalementSecurite(signalement, lecture.piege, lireIpVisiteur(request));
  if (resultat.ok) return { ok: true };

  const valeurs = relireValeurs(signalement);
  const imagesARemettre = signalement.images.length > 0;
  if (resultat.erreur === "champ-invalide") {
    const champ = lireChampSignalement(resultat.champ);
    const message = ecrireMessageService("champ-invalide");
    if (!champ) return { ok: false, message: lierPonctuation(message), valeurs, imagesARemettre };
    const texte = champ === "images" ? ecrireMessageService("image-format") : champsSignalement[champ].erreur;
    return repondreErreurs({ [champ]: lierPonctuation(texte) }, valeurs, imagesARemettre, message);
  }
  if (resultat.erreur === "trop-d-images" || resultat.erreur === "image-trop-lourde" || resultat.erreur === "image-format") {
    return repondreErreurs({ images: lierPonctuation(ecrireMessageService(resultat.erreur)) }, valeurs, imagesARemettre);
  }
  const message = resultat.erreur === "stockage-plein" ? messagesSignalement.stockagePlein : ecrireMessageService(resultat.erreur);
  return { ok: false, message: lierPonctuation(message), valeurs, imagesARemettre };
}

type Props = { loaderData: Awaited<ReturnType<typeof loader>>; actionData?: ReponseSignalement };

export default function PageSecurite({ loaderData, actionData }: Props) {
  if (actionData?.ok) return <MerciSignalement />;
  return (
    <>
      <EnTeteSecurite />
      <PerimetreSecurite />
      <ReglesSecurite />
      <EngagementsSecurite />
      <RecompensesSecurite />
      <TableauHonneur entrees={loaderData.entrees} />
      <SignalerFaille />
    </>
  );
}
