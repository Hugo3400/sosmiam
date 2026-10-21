// Le service du compte, version API (/comptes, contrat dans apps/api/src/routes/comptes.ts). Toujours la session « app »
// (un an, prolongée à chaque usage).

import type { CompteApp, ConnexionsCompte, ProfilACompleter, ProfilServeur } from "../../types/compte-app.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceCompte, SessionOuverte } from "../contrat-compte.ts";
import type { ReponseApi } from "../reponse-api.ts";
import type { DemandeConnexionQr, EtatConnexionQr, QrConnexion } from "../../types/connexion-qr.ts";
import type { LimitationCompteApi } from "../../types/limitation-compte.ts";
import { TYPE_PHOTO_PROFIL } from "../../regles/photo-profil.ts";
import type { PhotoProfilEnvoyee, PhotoProfilRetiree } from "../../types/photo-profil.ts";

export function creerCompteApi(client: ClientHttp): ServiceCompte {
  const ouvrir = async (chemin: string, corps: unknown): Promise<ReponseApi<SessionOuverte>> => {
    const r = await client.demander<{ session: string; compte: CompteApp; nouveau?: boolean }>("POST", chemin, { corps, session: false });
    return r.ok ? { ok: true, session: r.session, compte: r.compte, nouveau: r.nouveau ?? chemin === "/comptes" } : r;
  };

  return {
    inscrire: ({ cgu, ...inscription }) => ouvrir("/comptes", { ...inscription, cgu, espace: "app", support: "app" }),
    connecter: (email, motDePasse) => ouvrir("/comptes/session", { email, motDePasse, support: "app" }),

    async connecterExterne(connexion) {
      const { fournisseur, profil, ...jetons } = connexion;
      const chemin = fournisseur === "apple" ? "/comptes/apple" : "/comptes/google";
      const corps = { ...jetons, ...profil, support: "app" };
      // « Profil à compléter » porte des données (ce qui manque, de quoi pré-remplir) : lu à part
      const brut = await client.demanderBrut("POST", chemin, { corps, session: false });
      if (brut && brut.statut === 409 && brut.corps.erreur === "profil-a-completer") {
        const manque = Array.isArray(brut.corps.manque) ? (brut.corps.manque as ProfilACompleter["manque"]) : [];
        const prefill = (typeof brut.corps.prefill === "object" && brut.corps.prefill ? brut.corps.prefill : { email: "" }) as ProfilACompleter["prefill"];
        return { ok: true, aCompleter: { manque, prefill } };
      }
      return ouvrir(chemin, corps);
    },

    lireCompte: () => client.demander<{ compte: CompteApp }>("GET", "/comptes/session"),
    deconnecter: () => client.demander("DELETE", "/comptes/session"),
    deconnecterPartout: () => client.demander("POST", "/comptes/moi/deconnecter-partout"),
    lireProfil: () => client.demander<{ profil: ProfilServeur }>("GET", "/comptes/moi/profil"),
    modifierProfil: (modifs) => client.demander<{ profil: ProfilServeur }>("PATCH", "/comptes/moi/profil", { corps: modifs }),
    pseudoDisponible: (pseudo) => client.demander<{ disponible: boolean }>("GET", `/comptes/pseudo-disponible?pseudo=${encodeURIComponent(pseudo)}`),
    envoyerPhotoProfil: (fichier) => client.envoyerOctets<PhotoProfilEnvoyee>("/comptes/moi/photo", fichier, TYPE_PHOTO_PROFIL),
    retirerPhotoProfil: () => client.demander<PhotoProfilRetiree>("DELETE", "/comptes/moi/photo"),
    lireConnexions: () => client.demander<{ connexions: ConnexionsCompte }>("GET", "/comptes/moi/connexions"),
    relierConnexion: ({ fournisseur, ...jetons }, confirmation) =>
      client.demander<{ connexions: ConnexionsCompte }>("POST", `/comptes/moi/connexions/${fournisseur}`, {
        corps: { ...jetons, ...("motDePasse" in confirmation ? confirmation : { confirmation }) },
      }),
    delierConnexion: (fournisseur, confirmation) =>
      client.demander<{ connexions: ConnexionsCompte }>("DELETE", `/comptes/moi/connexions/${fournisseur}`, { corps: confirmation }),
    changerMotDePasse: (actuel, nouveau) => client.demander<{ session: string }>("POST", "/comptes/moi/mot-de-passe", { corps: { actuel, nouveau } }),
    motDePasseOublie: (email) => client.demander("POST", "/comptes/mot-de-passe-oublie", { corps: { email }, session: false }),
    renvoyerVerification: () => client.demander<{ dejaVerifie: boolean }>("POST", "/comptes/moi/renvoyer-verification"),
    supprimerCompte: (confirmation) => client.demander("DELETE", "/comptes/moi", { corps: confirmation }),
    lireLimitation: () => client.demander<{ limitation: LimitationCompteApi | null }>("GET", "/comptes/moi/limitation"),
    contesterLimitation: (texte) => client.demander("POST", "/comptes/moi/limitation/contestation", { corps: { texte } }),

    // Connexion par QR code : le nouveau téléphone demande et attend (sans session) ; l'app connectée scanne et répond
    demanderConnexionQr: () => client.demander<QrConnexion>("POST", "/comptes/qr", { corps: { cible: "app" }, session: false }),
    async attendreConnexionQr(secret) {
      const r = await client.demander<{ etat: EtatConnexionQr; session?: string; compte?: CompteApp }>("POST", "/comptes/qr/attente", { corps: { secret }, session: false });
      if (!r.ok) return r;
      if (r.etat === "accepte" && r.session && r.compte) return { ok: true, etat: "accepte", session: r.session, compte: r.compte, nouveau: false };
      return { ok: true, etat: r.etat === "accepte" ? "expire" : r.etat };
    },
    scannerConnexionQr: (code) => client.demander<{ demande: DemandeConnexionQr }>("POST", "/app/qr/scanner", { corps: { code } }),
    repondreConnexionQr: (code, accepte) => client.demander("POST", "/app/qr/repondre", { corps: { code, accepte } }),
  };
}
