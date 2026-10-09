// Pour les pages d'un lieu de l'espace pro (/lieu/:id/…) : la fiche, le rôle du compte, ou la bonne erreur.
import { data } from "react-router";

import { lireFichePro } from "~/services/pro.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

/**
 * Le compte connecté (sinon /connexion) et la fiche du lieu de l'adresse : 404 si l'id est mal écrit, si le lieu n'existe
 * pas ou n'est pas à lui (l'API répond « pas-pro » dans les deux cas : rien n'est révélé), 503 si l'API ne répond pas.
 */
export async function exigerLieuPro(request: Request, idTexte: string | undefined) {
  const connecte = await exigerCompte(request);
  if (!idTexte || !/^\d{1,9}$/.test(idTexte) || Number(idTexte) <= 0) throw data(null, { status: 404 });
  const ip = lireIpVisiteur(request);
  const reponse = await lireFichePro(connecte.jeton, ip, Number(idTexte));
  if (reponse.ok) return { ...connecte, ip, lieu: reponse.fiche, role: reponse.role, peutModifier: reponse.peutModifier };
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "pas-pro") throw data(null, { status: 404 });
  throw data("Espace pro momentanément indisponible", { status: 503 });
}
