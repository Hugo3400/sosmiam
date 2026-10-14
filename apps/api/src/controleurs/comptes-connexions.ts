// « Mes façons de me connecter » (décidé le 14 octobre 2026) : un même compte peut avoir en même temps un vrai mot de
// passe, une identité Apple et une identité Google. Relier une identité au compte connecté, ou la délier. Jamais de
// fusion de deux comptes : une identité déjà reliée à un AUTRE compte est refusée, avec un code qui permet d'expliquer
// quoi faire. Ajouter un mot de passe : « Mot de passe oublié » (POST /comptes/mot-de-passe-oublie), déjà ouvert aux
// comptes sans mot de passe. Contrat : routes/comptes.ts. Jamais de jeton, d'e-mail ni de « sub » dans un journal.
import type { Request, Response } from "express";

import type { FournisseurExterne } from "../fonctions/comptes/lire-identite-externe.ts";
import type { ConnexionsCompte } from "../services/comptes-externes-regles.ts";
import { lireCompteId, lireCorps, lireMotDePasse } from "./comptes-champs.ts";
import { CHAMP_JETON, creerControleursComptesExternes, lireJeton, lireNonce } from "./comptes-externes.ts";
import { creerControleursMonCompte } from "./comptes-moi.ts";
import type { ContexteComptes } from "./comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

const AUTRE: Record<FournisseurExterne, FournisseurExterne> = { apple: "google", google: "apple" };
const estFournisseur = (valeur: unknown): valeur is FournisseurExterne => valeur === "apple" || valeur === "google";
const subDe = (connexions: ConnexionsCompte, fournisseur: FournisseurExterne) => (fournisseur === "apple" ? connexions.appleSub : connexions.googleSub);

/** Ce que les pages voient : des booléens, jamais les identifiants eux-mêmes */
const presenter = (connexions: ConnexionsCompte) => ({
  motDePasse: !connexions.sansMotDePasse, apple: connexions.appleSub !== null, google: connexions.googleSub !== null,
});

export function creerControleursConnexionsCompte(contexte: ContexteComptes) {
  const { services, horloge, externes } = contexte;
  const verification = creerControleursComptesExternes(contexte);
  const { verifierMotDePasseActuel } = creerControleursMonCompte(contexte);
  const sessionExpiree = (reponse: Response) => reponse.status(401).json({ ok: false, erreur: "session-expiree" });
  const indisponible = (reponse: Response, fournisseur: FournisseurExterne) =>
    reponse.status(503).json({ ok: false, erreur: `${fournisseur}-indisponible` });

  /** Les connexions à jour, rendues après un changement : 200 { ok, connexions } */
  async function repondreConnexions(reponse: Response, compteId: number) {
    const connexions = externes ? await externes.services.lireConnexions(compteId) : null;
    if (!connexions) return sessionExpiree(reponse);
    reponse.json({ ok: true, connexions: presenter(connexions) });
  }

  /**
   * POST /comptes/moi/connexions/<fournisseur> : relie l'identité du jeton (même vérification qu'à la connexion) au
   * compte connecté. L'e-mail du compte ne change jamais ; il compte comme confirmé seulement si le jeton porte le même,
   * vérifié.
   */
  async function relier(fournisseur: FournisseurExterne, requete: Request, reponse: Response) {
    const corps = lireCorps(requete);
    const jeton = lireJeton(corps, fournisseur);
    const nonce = lireNonce(corps, fournisseur === "apple");
    if (!externes) return indisponible(reponse, fournisseur);
    const identite = await verification.verifierJeton(reponse, fournisseur, jeton, nonce);
    if (identite === null) return;
    if (identite === "invalide") return reponse.status(401).json({ ok: false, erreur: "jeton-externe-invalide" });
    const id = lireCompteId(reponse);
    const [identifiants, connexions] = await Promise.all([services.lireIdentifiants(id), externes.services.lireConnexions(id)]);
    if (!identifiants || !connexions) return sessionExpiree(reponse);
    const dejaLa = subDe(connexions, fournisseur);
    // Déjà relié à cette même identité : rien à faire (double appui, retour arrière)
    if (dejaLa === identite.sub) return reponse.json({ ok: true, connexions: presenter(connexions) });
    if (dejaLa !== null) return reponse.status(409).json({ ok: false, erreur: "deja-relie" });
    const ailleurs = await externes.services.trouverCompteParSub(fournisseur, identite.sub);
    if (ailleurs !== null && ailleurs !== id) return reponse.status(409).json({ ok: false, erreur: "identite-deja-reliee" });
    const memeEmail = identite.email !== null && identite.emailVerifie && identite.email.toLowerCase() === identifiants.email.toLowerCase();
    const resultat = await externes.services.rattacherSub(id, fournisseur, identite.sub, new Date(horloge()), memeEmail);
    if (resultat === "introuvable") return sessionExpiree(reponse);
    if (resultat === "deja-rattache") return reponse.status(409).json({ ok: false, erreur: "deja-relie" });
    // Un autre compte a pris cette identité entre la lecture et l'écriture
    if (resultat === "sub-pris") return reponse.status(409).json({ ok: false, erreur: "identite-deja-reliee" });
    return repondreConnexions(reponse, id);
  }

  /**
   * Un compte SANS vrai mot de passe confirme avec un NOUVEAU jeton de l'AUTRE fournisseur (celui qui restera) : il
   * prouve à la fois que c'est bien la personne, et que sa dernière façon de se connecter marche. Faux si la réponse est
   * déjà partie (400 {champ: confirmation}, 403 confirmation-incorrecte, 503).
   */
  async function confirmerAvecAutreFournisseur(reponse: Response, corps: Record<string, unknown>, autre: FournisseurExterne, attendu: string) {
    if (corps[CHAMP_JETON[autre]] === undefined || corps[CHAMP_JETON[autre]] === null || corps[CHAMP_JETON[autre]] === "") {
      throw new ChampInvalide("confirmation");
    }
    const jeton = lireJeton(corps, autre);
    const nonce = lireNonce(corps, autre === "apple");
    const identite = await verification.verifierJeton(reponse, autre, jeton, nonce);
    if (identite === null) return false;
    if (identite !== "invalide" && identite.sub === attendu) return true;
    reponse.status(403).json({ ok: false, erreur: "confirmation-incorrecte" });
    return false;
  }

  return {
    /** POST /comptes/moi/connexions/apple : { identityToken, nonce } */
    relierApple: (requete: Request, reponse: Response) => relier("apple", requete, reponse),
    /** POST /comptes/moi/connexions/google : { idToken, nonce? } */
    relierGoogle: (requete: Request, reponse: Response) => relier("google", requete, reponse),

    /**
     * DELETE /comptes/moi/connexions/:fournisseur : { motDePasse } si le compte a un vrai mot de passe, sinon un nouveau
     * jeton de l'autre fournisseur. Refusé (409 derniere-connexion) si c'est la seule façon de se connecter, avant même
     * de demander la confirmation.
     */
    async delier(requete: Request, reponse: Response) {
      const fournisseur = requete.params.fournisseur;
      if (!estFournisseur(fournisseur)) throw new ChampInvalide("fournisseur");
      const id = lireCompteId(reponse);
      const [identifiants, connexions] = await Promise.all([services.lireIdentifiants(id), externes?.services.lireConnexions(id) ?? null]);
      if (!identifiants) return sessionExpiree(reponse);
      // Sans connexion externe branchée, rien n'est relié : rien à délier
      if (!externes || !connexions || subDe(connexions, fournisseur) === null) {
        return reponse.json({ ok: true, connexions: connexions ? presenter(connexions) : { motDePasse: true, apple: false, google: false } });
      }
      const autre = AUTRE[fournisseur];
      const subAutre = subDe(connexions, autre);
      if (connexions.sansMotDePasse && subAutre === null) return reponse.status(409).json({ ok: false, erreur: "derniere-connexion" });
      const corps = lireCorps(requete);
      if (!connexions.sansMotDePasse) {
        if (!(await verifierMotDePasseActuel(reponse, id, identifiants, lireMotDePasse(corps, "motDePasse")))) return;
      } else if (subAutre === null || !(await confirmerAvecAutreFournisseur(reponse, corps, autre, subAutre))) return;
      const resultat = await externes.services.delierSub(id, fournisseur);
      if (resultat === "introuvable") return sessionExpiree(reponse);
      // Un autre changement est passé entre-temps (l'autre fournisseur délié au même moment)
      if (resultat === "derniere-connexion") return reponse.status(409).json({ ok: false, erreur: "derniere-connexion" });
      return repondreConnexions(reponse, id);
    },
  };
}
