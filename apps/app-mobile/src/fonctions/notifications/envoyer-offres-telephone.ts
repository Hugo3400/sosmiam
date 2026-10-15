import type { InscriptionTelephone } from "@sos-miam/commun/client-api/contrat-appareils";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { choisirJetonEnvoiOffres } from "~/fonctions/notifications/choisir-jeton-envoi-offres";
import { classerEnvoiOffres } from "~/fonctions/notifications/classer-envoi-offres";
import type { LectureJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";
import type { IssueEnvoiOffres } from "~/services/renvoi-choix-offres";

type OutilsEnvoiOffres = {
  demo: boolean;
  ville: string | null;
  plateforme: string;
  lireActives: () => Promise<boolean>;
  lireJeton: (demander: boolean) => Promise<LectureJetonTelephone>;
  lireJetonGarde: () => Promise<string | null>;
  inscrire: (inscription: InscriptionTelephone) => Promise<ReponseApi>;
  enregistrerJeton: (jeton: string) => Promise<void>;
};

export async function envoyerOffresTelephone(offres: boolean, o: OutilsEnvoiOffres): Promise<IssueEnvoiOffres> {
  if (o.demo || !(await o.lireActives())) return "sans-suite";
  const lu = await o.lireJeton(false);
  const telephone = choisirJetonEnvoiOffres(lu, offres, lu.ok || offres ? null : await o.lireJetonGarde(), o.plateforme);
  if (!telephone) return "sans-suite";
  const r = await o.inscrire({ ...telephone, ville: o.ville || null, offres });
  if (r.ok && lu.ok) await o.enregistrerJeton(lu.jeton);
  return classerEnvoiOffres(r);
}
