import { useCallback, useEffect, useRef, useState } from "react";

import type { ConnexionsCompte } from "@sos-miam/commun/types/compte-app";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { type FournisseurConnexion, messagesMesConnexions, NOMS_FOURNISSEURS } from "~/contenus/mes-connexions";
import { lancerConnexionApple } from "~/fonctions/compte/lancer-connexion-apple";
import { lancerConnexionGoogle } from "~/fonctions/compte/lancer-connexion-google";
import { utiliserSession } from "~/hooks/utiliser-session";

const AUTRE: Record<FournisseurConnexion, FournisseurConnexion> = { apple: "google", google: "apple" };

type Jeton = { identityToken: string; nonce: string } | { idToken: string };

/** Ce qu'un geste a donné : un mot de réussite, rien (annulé), ou une erreur à montrer (avec son texte à elle s'il le faut) */
export type ResultatMesConnexions = { ok: true; message: string } | { ok: false; erreur: ErreurService | null; texte?: string };

/** Un NOUVEAU jeton d'Apple ou de Google, demandé au téléphone (la feuille d'Apple, le choix du compte Google) */
async function demanderJeton(fournisseur: FournisseurConnexion): Promise<{ ok: true; jeton: Jeton } | { ok: false; erreur: ErreurService | null }> {
  const natif = fournisseur === "apple" ? await lancerConnexionApple() : await lancerConnexionGoogle();
  if (natif.ok) return { ok: true, jeton: "identityToken" in natif ? { identityToken: natif.identityToken, nonce: natif.nonce } : { idToken: natif.idToken } };
  if (natif.raison === "annule") return { ok: false, erreur: null };
  return { ok: false, erreur: natif.raison === "indisponible" ? `${fournisseur}-indisponible` : "jeton-externe-invalide" };
}

/**
 * « Tes clés pour entrer » (Mon compte) : les façons de se connecter au compte (mot de passe, Apple, Google), relier ou
 * délier Apple et Google, et ajouter un mot de passe (par le lien de « Mot de passe oublié », valable 24 heures). Jamais de
 * fusion de deux comptes : une identité déjà reliée à un autre compte est refusée par l'API.
 */
export function utiliserMesConnexions() {
  const { comptes, rafraichir } = utiliserSession();
  const [connexions, setConnexions] = useState<ConnexionsCompte | null>(null);
  const [enCours, setEnCours] = useState<FournisseurConnexion | "mot-de-passe" | null>(null);
  const occupe = useRef(false);

  useEffect(() => {
    let actif = true;
    void comptes.lireConnexions().then((r) => {
      if (actif && r.ok) setConnexions(r.connexions);
    });
    return () => {
      actif = false;
    };
  }, [comptes]);

  /** Un seul geste à la fois (double appui, feuille d'Apple encore ouverte) */
  const enUnSeulGeste = useCallback(async (quoi: FournisseurConnexion | "mot-de-passe", geste: () => Promise<ResultatMesConnexions>) => {
    if (occupe.current) return { ok: false, erreur: null } as const;
    occupe.current = true;
    setEnCours(quoi);
    try {
      return await geste();
    } finally {
      occupe.current = false;
      setEnCours(null);
    }
  }, []);

  const relier = useCallback(
    (fournisseur: FournisseurConnexion) =>
      enUnSeulGeste(fournisseur, async () => {
        const demande = await demanderJeton(fournisseur);
        if (!demande.ok) return demande;
        const { jeton } = demande;
        const r = await comptes.relierConnexion("identityToken" in jeton ? { fournisseur: "apple", ...jeton } : { fournisseur: "google", ...jeton });
        if (!r.ok) return { ok: false, erreur: r.erreur };
        setConnexions(r.connexions);
        // Le même e-mail, confirmé par Apple ou Google, peut confirmer celui du compte
        void rafraichir();
        return { ok: true, message: messagesMesConnexions.relie(NOMS_FOURNISSEURS[fournisseur]) };
      }),
    [comptes, enUnSeulGeste, rafraichir],
  );

  /** Délier : avec le mot de passe s'il y en a un, sinon avec un nouveau jeton de l'AUTRE fournisseur (la clé qui restera) */
  const delier = useCallback(
    (fournisseur: FournisseurConnexion, motDePasse?: string) =>
      enUnSeulGeste(fournisseur, async () => {
        const autre = AUTRE[fournisseur];
        let confirmation: Parameters<typeof comptes.delierConnexion>[1];
        if (motDePasse !== undefined) confirmation = { motDePasse };
        else {
          const demande = await demanderJeton(autre);
          if (!demande.ok) return demande;
          confirmation = demande.jeton;
        }
        const r = await comptes.delierConnexion(fournisseur, confirmation);
        if (!r.ok) {
          return r.erreur === "confirmation-incorrecte"
            ? { ok: false, erreur: r.erreur, texte: messagesMesConnexions.autreCompte(NOMS_FOURNISSEURS[autre]) }
            : { ok: false, erreur: r.erreur };
        }
        setConnexions(r.connexions);
        return { ok: true, message: messagesMesConnexions.delie(NOMS_FOURNISSEURS[fournisseur]) };
      }),
    [comptes, enUnSeulGeste],
  );

  /** Ajouter un mot de passe : le lien de « Mot de passe oublié », qui sert aussi aux comptes qui n'en ont pas */
  const ajouterMotDePasse = useCallback(
    (email: string) =>
      enUnSeulGeste("mot-de-passe", async () => {
        const r = await comptes.motDePasseOublie(email);
        if (!r.ok) return { ok: false, erreur: r.erreur };
        return { ok: true, message: messagesMesConnexions.lienEnvoye };
      }),
    [comptes, enUnSeulGeste],
  );

  return { connexions, enCours, relier, delier, ajouterMotDePasse };
}
