import type { InscriptionTelephone } from "@sos-miam/commun/client-api/contrat-appareils";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { choisirJetonEnvoiOffres } from "~/fonctions/notifications/choisir-jeton-envoi-offres";
import { classerEnvoiOffres } from "~/fonctions/notifications/classer-envoi-offres";
import type { LectureJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";
import type { IssueEnvoiOffres } from "~/services/renvoi-choix-offres";
import type { ChoixTelephone } from "~/stockage/choix-offres-a-renvoyer";

const LECTURE_JETON_MAX_MS = 10_000;

type OutilsEnvoiTelephone = {
  demo: boolean;
  ville: string | null;
  plateforme: string;
  lireActives: () => Promise<boolean>;
  lireJeton: () => Promise<LectureJetonTelephone>;
  lireJetonGarde: () => Promise<string | null>;
  inscrire: (inscription: InscriptionTelephone) => Promise<ReponseApi>;
  desinscrire: (jeton: string) => Promise<ReponseApi>;
  enregistrerJeton: (jeton: string) => Promise<void>;
  effacerJeton: () => Promise<void>;
  lireCleApercu?: () => Promise<string | null>;
};

function lireJetonSansBloquer(lire: () => Promise<LectureJetonTelephone>): Promise<LectureJetonTelephone | null> {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<null>((repondre) => {
    minuterie = setTimeout(() => repondre(null), LECTURE_JETON_MAX_MS);
  });
  const lecture = Promise.resolve()
    .then(() => lire())
    .catch((): LectureJetonTelephone => ({ ok: false, raison: "indisponible" }));
  return Promise.race([lecture, limite]).finally(() => clearTimeout(minuterie));
}

async function retirerTelephone(garde: string | null, o: OutilsEnvoiTelephone, valable: () => boolean): Promise<IssueEnvoiOffres> {
  const lu = garde ? null : await lireJetonSansBloquer(o.lireJeton);
  const jeton = garde || (lu?.ok ? lu.jeton : null);
  if (!garde && lu === null) return "a-renvoyer";
  if (!jeton || !valable()) return "sans-suite";
  const r = await o.desinscrire(jeton);
  if (r.ok) await o.effacerJeton();
  return classerEnvoiOffres(r);
}

export async function envoyerChoixTelephone(choix: ChoixTelephone, o: OutilsEnvoiTelephone, valable: () => boolean = () => true): Promise<IssueEnvoiOffres> {
  if (o.demo) return "sans-suite";
  const garde = await o.lireJetonGarde();
  if (choix === "couper" || !(await o.lireActives())) return retirerTelephone(garde, o, valable);
  const offres = choix === "oui";
  const lu = await lireJetonSansBloquer(o.lireJeton);
  const telephone = choisirJetonEnvoiOffres(lu, offres, garde, o.plateforme);
  if (!telephone) return lu === null ? "a-renvoyer" : "sans-suite";
  if (garde !== telephone.jeton) {
    if (garde && valable() && classerEnvoiOffres(await o.desinscrire(garde)) === "a-renvoyer") return "a-renvoyer";
    await o.enregistrerJeton(telephone.jeton);
  }
  if (!valable()) return "sans-suite";
  const cleApercu = o.lireCleApercu ? await o.lireCleApercu().catch(() => null) : null;
  return classerEnvoiOffres(await o.inscrire({ ...telephone, ville: o.ville || null, offres, ...(cleApercu ? { cleApercu } : {}) }));
}
