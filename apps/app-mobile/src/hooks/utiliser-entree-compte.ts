import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "react-native";

import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { convertirProfilServeur } from "~/fonctions/compte/convertir-profil-serveur";
import { lancerConnexionApple } from "~/fonctions/compte/lancer-connexion-apple";
import { lancerConnexionGoogle } from "~/fonctions/compte/lancer-connexion-google";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";

/** Montre un refus de l'API (texte de contenus/messages-services.ts, au tutoiement) */
export function montrerErreurCompte(erreur: ErreurService, details?: DetailsErreur) {
  const message = decrireEchecVisite(erreur, details);
  Alert.alert(`${message.emoji} ${message.titre}`, message.texte);
}

/**
 * Entrer dans un compte depuis l'inscription : par e-mail (« Me connecter »), avec Apple ou avec Google. Un compte existant
 * ouvre l'app tout de suite (son profil, gardé sur le serveur, est installé sur le téléphone). Un nouveau compte Apple ou
 * Google, ou un compte du site sans date de naissance, passe d'abord par « Fais connaissance ». Dans les écrans d'inscription
 * seulement (il lit le brouillon).
 */
export function utiliserEntreeCompte() {
  const router = useRouter();
  const session = utiliserSession();
  const { profil, enregistrer } = utiliserProfil();
  const { modifier } = utiliserBrouillonInscription();
  const [enCours, setEnCours] = useState<"apple" | "google" | "email" | null>(null);
  const occupe = useRef(false);

  /**
   * Après une connexion à un compte EXISTANT : la session est gardée et son profil installé (sinon, « Fais connaissance »).
   * Faux si le profil n'a pas pu être lu (l'erreur est montrée) : on peut réessayer avec la même session.
   */
  async function entrer(ouverte: SessionOuverte): Promise<boolean> {
    await session.ouvrir(ouverte);
    const lu = await session.comptes.lireProfil();
    if (!lu.ok) {
      montrerErreurCompte(lu.erreur, lu.details);
      return false;
    }
    const local = convertirProfilServeur(lu.profil, profil?.envies.regimes);
    // Installé : la racine bascule toute seule vers les onglets
    if (local) {
      await enregistrer(local);
      return true;
    }
    modifier({ prenom: lu.profil.prenom, nom: lu.profil.nom ?? "", pseudo: lu.profil.pseudo ?? "", ville: lu.profil.ville, connexion: { type: "completer" } });
    router.push("/fais-connaissance");
    return true;
  }

  /** Un geste à la fois (un double appui ne lance jamais deux connexions) */
  async function uneFois(quoi: "apple" | "google" | "email", geste: () => Promise<void>) {
    if (occupe.current) return;
    occupe.current = true;
    setEnCours(quoi);
    try {
      await geste();
    } finally {
      occupe.current = false;
      setEnCours(null);
    }
  }

  /** « Continuer avec Apple » ou « avec Google » : un compte existant entre ; un nouveau passe par « Fais connaissance » */
  const connecterAvec = (fournisseur: "apple" | "google") =>
    uneFois(fournisseur, async () => {
      const natif = fournisseur === "apple" ? await lancerConnexionApple() : await lancerConnexionGoogle();
      if (!natif.ok) {
        if (natif.raison === "indisponible") {
          Alert.alert(
            fournisseur === "apple" ? "Apple n'est pas dispo ici" : "Google n'est pas dispo ici",
            "Ce bouton marche dans l'app installée depuis l'App Store ou Google Play. En attendant, passe par ton e-mail : ça marche partout.",
          );
        } else if (natif.raison === "echec") montrerErreurCompte("jeton-externe-invalide");
        return;
      }
      const prenomApple = "prenom" in natif ? natif.prenom : null;
      const nomApple = "nom" in natif ? natif.nom : null;
      const r = await session.comptes.connecterExterne(
        fournisseur === "apple" && "identityToken" in natif
          ? { fournisseur, identityToken: natif.identityToken, nonce: natif.nonce, profil: { prenom: prenomApple ?? undefined, nom: nomApple } }
          : { fournisseur: "google", idToken: "idToken" in natif ? natif.idToken : "" },
      );
      if (!r.ok) return montrerErreurCompte(r.erreur, r.details);
      if ("aCompleter" in r) {
        // Nouveau compte : « Fais connaissance » d'abord, puis la même demande complétée à « C'est prêt »
        modifier({
          prenom: r.aCompleter.prefill.prenom ?? prenomApple ?? "",
          nom: r.aCompleter.prefill.nom ?? nomApple ?? "",
          connexion: "identityToken" in natif ? { type: "apple", identityToken: natif.identityToken, nonce: natif.nonce } : { type: "google", idToken: "idToken" in natif ? natif.idToken : "" },
        });
        router.push("/fais-connaissance");
        return;
      }
      await entrer(r);
    });

  /** « Me connecter » avec un e-mail et un mot de passe */
  const connecterParEmail = (email: string, motDePasse: string) =>
    uneFois("email", async () => {
      const r = await session.comptes.connecter(email.trim(), motDePasse);
      if (!r.ok) return montrerErreurCompte(r.erreur, r.details);
      await entrer(r);
    });

  return { connecterAvec, connecterParEmail, entrer, enCours };
}
