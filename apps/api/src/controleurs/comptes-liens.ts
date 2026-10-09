// Liens envoyés par mail aux comptes : « Mot de passe oublié » en libre-service, et confirmation de l'e-mail (à
// l'inscription, puis renvoyée à la demande). Décidés le 9 octobre 2026 (docs/decisions.md, « Espace ambassadeur »).
// Les jetons sont rendus une seule fois, mis dans le lien après un « # » (jamais envoyé au serveur du site, donc jamais
// dans un journal), et la base n'en garde que l'empreinte. Les mails partent sans être attendus : la réponse n'attend
// jamais le serveur de mail. Jamais d'e-mail ni de jeton dans un journal.
import type { Request, Response } from "express";

import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { FORME_JETON } from "../middlewares/proteger-comptes.ts";
import { lireCompteId, lireCorps, lireEmail } from "./comptes-champs.ts";
import type { ContexteComptes } from "./comptes.ts";

/** Adresse de l'espace ambassadeur, écrite en dur (jamais tirée d'une requête) : base des liens envoyés par mail */
export const ADRESSE_ESPACE = "https://ambassadeur.sosmiam.fr";

type ResultatEnvoi = { ok: boolean; erreur?: string };

/** Ce qui envoie les mails des liens : services/courriels/courriels-comptes.ts en vrai, un faux qui note tout dans les tests */
export type CourrielsComptes = {
  envoyerLienMotDePasse: (compteId: number, lien: string, expireLe: Date) => Promise<ResultatEnvoi>;
  envoyerLienVerificationEmail: (compteId: number, lien: string, expireLe: Date) => Promise<ResultatEnvoi>;
};

/** Note un envoi raté dans le journal, sans e-mail ni jeton : seulement le type de lien et l'erreur résumée. */
function noterEchec(quoi: string, erreur: unknown) {
  console.error(`Comptes : envoi du lien « ${quoi} » impossible :`, typeof erreur === "string" ? erreur : resumerErreur(erreur));
}

/** Lance l'envoi sans l'attendre : un échec (mail mal réglé, serveur absent) est seulement noté dans le journal. */
function envoyerSansAttendre(quoi: string, envoi: () => Promise<ResultatEnvoi>) {
  void envoi()
    .then((resultat) => {
      if (!resultat.ok) noterEchec(quoi, resultat.erreur ?? "refusé");
    })
    .catch((erreur: unknown) => noterEchec(quoi, erreur));
}

export function creerControleursLiens({ services, courriels, limiteOubli, limiteVerification, adresseEspace, horloge }: ContexteComptes) {
  /**
   * Nouveau mot de passe demandé pour cet e-mail : rien si le compte n'existe pas, ou s'il a déjà reçu un lien il y a
   * moins de 15 minutes (ou 5 en 24 heures) ; sinon un lien de 24 heures, comme celui que prépare l'équipe.
   */
  /**
   * Base des liens d'un compte : l'espace ambassadeur pour un ambassadeur, l'espace pro (pro.sosmiam.fr) pour un compte
   * sans ligne Ambassadeur. L'API de démonstration garde sa propre adresse (pas de « ambassadeur. » dedans).
   */
  async function choisirAdresse(compteId: number): Promise<string> {
    const compte = await services.lireCompte(compteId);
    return compte && !compte.ambassadeur ? adresseEspace.replace("://ambassadeur.", "://pro.") : adresseEspace;
  }

  async function preparerLienMotDePasse(email: string) {
    const compte = await services.trouverCompteParEmail(email);
    if (!compte) return;
    const cle = String(compte.id);
    // Lire et noter sans rien attendre entre les deux : deux demandes en même temps n'envoient pas deux liens
    if (limiteOubli.lireAttente(cle) > 0) return;
    limiteOubli.noterEnvoi(cle);
    const { jeton, expireLe } = await services.preparerReinitialisation(compte.id);
    const adresse = await choisirAdresse(compte.id);
    envoyerSansAttendre("mot-de-passe", () => courriels.envoyerLienMotDePasse(compte.id, `${adresse}/nouveau-mot-de-passe#jeton=${jeton}`, expireLe));
  }

  /** Nouveau lien de confirmation de l'e-mail (7 jours ; il remplace le précédent), envoyé sans attendre. */
  async function envoyerVerification(compteId: number) {
    limiteVerification.noterEnvoi(String(compteId));
    const { jeton, expireLe } = await services.preparerVerificationEmail(compteId);
    const adresse = await choisirAdresse(compteId);
    envoyerSansAttendre("verification-email", () =>
      courriels.envoyerLienVerificationEmail(compteId, `${adresse}/verifier-email#jeton=${jeton}`, expireLe));
  }

  return {
    envoyerVerification,

    /**
     * POST /comptes/mot-de-passe-oublie : { email } → toujours 200 { ok: true }, que l'adresse ait un compte ou non. La
     * réponse part AVANT de chercher le compte : sa durée ne dit rien de l'existence de l'adresse. Le lien, s'il y a lieu,
     * est préparé et envoyé ensuite.
     */
    async motDePasseOublie(requete: Request, reponse: Response) {
      const email = lireEmail(lireCorps(requete));
      reponse.json({ ok: true });
      void preparerLienMotDePasse(email).catch((erreur: unknown) => noterEchec("mot-de-passe", erreur));
    },

    /** POST /comptes/verifier-email : { jeton } → 200 { ok } (e-mail confirmé, jeton effacé) · 400 « jeton-invalide ». */
    async verifierEmail(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const jeton = typeof corps.jeton === "string" ? corps.jeton.trim() : "";
      const bon = FORME_JETON.test(jeton) && (await services.verifierEmail(calculerEmpreinteJeton(jeton), new Date(horloge())));
      if (!bon) return reponse.status(400).json({ ok: false, erreur: "jeton-invalide" });
      reponse.json({ ok: true });
    },

    /**
     * POST /comptes/moi/renvoyer-verification (connecté) : un nouveau lien de confirmation, 1 toutes les 15 minutes et
     * 5 par 24 heures (l'envoi de l'inscription compte), sinon 429 avec l'attente ; rien à faire si l'e-mail est déjà
     * confirmé.
     */
    async renvoyerVerification(_requete: Request, reponse: Response) {
      const id = lireCompteId(reponse);
      const compte = await services.lireCompte(id);
      if (!compte) return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
      if (compte.emailVerifie) return reponse.json({ ok: true, dejaVerifie: true });
      const attente = limiteVerification.lireAttente(String(id));
      if (attente > 0) return reponse.set("Retry-After", String(attente)).status(429).json({ ok: false, erreur: "trop-de-demandes", attente });
      await envoyerVerification(id);
      reponse.json({ ok: true, dejaVerifie: false });
    },
  };
}
