// Le service du compte, version API (/comptes, contrat dans apps/api/src/routes/comptes.ts). Toujours la session « app »
// (un an, prolongée à chaque usage).

import type { CompteApp, ConnexionsCompte, ProfilACompleter, ProfilServeur } from "../../types/compte-app.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceCompte, SessionOuverte } from "../contrat-compte.ts";
import type { ReponseApi } from "../reponse-api.ts";

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
    lireConnexions: () => client.demander<{ connexions: ConnexionsCompte }>("GET", "/comptes/moi/connexions"),
    changerMotDePasse: (actuel, nouveau) => client.demander<{ session: string }>("POST", "/comptes/moi/mot-de-passe", { corps: { actuel, nouveau } }),
    motDePasseOublie: (email) => client.demander("POST", "/comptes/mot-de-passe-oublie", { corps: { email }, session: false }),
    renvoyerVerification: () => client.demander<{ dejaVerifie: boolean }>("POST", "/comptes/moi/renvoyer-verification"),
    supprimerCompte: (confirmation) => client.demander("DELETE", "/comptes/moi", { corps: confirmation }),
  };
}
