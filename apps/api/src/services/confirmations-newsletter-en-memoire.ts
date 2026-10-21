import type { DepotConfirmationsNewsletter, NouvelleAttenteConfirmation } from "./confirmations-newsletter-regles.ts";
import type { NouvelleInscription } from "./inscriptions.ts";

export type InscritNewsletterEnMemoire = NouvelleInscription & { premiereInscription: Date; derniereInscription: Date };

export function creerConfirmationsNewsletterEnMemoire() {
  const attentes = new Map<string, NouvelleAttenteConfirmation>();
  const inscrits = new Map<string, InscritNewsletterEnMemoire>();

  function inscrire(nouvelle: NouvelleInscription, maintenant: Date) {
    const ancien = inscrits.get(nouvelle.email);
    if (!ancien) {
      inscrits.set(nouvelle.email, { ...nouvelle, premiereInscription: maintenant, derniereInscription: maintenant });
      return;
    }
    inscrits.set(nouvelle.email, {
      ...ancien,
      derniereInscription: maintenant,
      ville: nouvelle.ville || ancien.ville,
      telephone: nouvelle.telephone ?? ancien.telephone,
      ambassadeur: ancien.ambassadeur || nouvelle.ambassadeur,
      beta: ancien.beta || nouvelle.beta,
    });
  }

  const depot: DepotConfirmationsNewsletter = {
    async lireAttente(email) {
      const attente = attentes.get(email);
      return attente ? { jetonEmpreinte: attente.jetonEmpreinte, envoyeLe: attente.envoyeLe, expireLe: attente.expireLe, envois: attente.envois } : null;
    },
    async creerAttente(attente) {
      if (attentes.has(attente.email)) return false;
      attentes.set(attente.email, { ...attente });
      return true;
    },
    async remplacerAttente(ancienneEmpreinte, attente) {
      if (attentes.get(attente.email)?.jetonEmpreinte !== ancienneEmpreinte) return false;
      attentes.set(attente.email, { ...attente });
      return true;
    },
    async confirmer(jetonEmpreinte, maintenant) {
      const attente = [...attentes.values()].find((ligne) => ligne.jetonEmpreinte === jetonEmpreinte);
      if (!attente || attente.expireLe.getTime() <= maintenant.getTime()) return false;
      attentes.delete(attente.email);
      const { email, ville, ambassadeur, telephone, beta, source } = attente;
      inscrire({ email, ville, ambassadeur, telephone, beta, source }, maintenant);
      return true;
    },
  };

  return {
    depot,
    attentes,
    inscrits,
    effacerExpirees(maintenant: Date) {
      let effacees = 0;
      for (const [email, attente] of attentes) {
        if (attente.expireLe.getTime() > maintenant.getTime()) continue;
        attentes.delete(email);
        effacees++;
      }
      return effacees;
    },
  };
}
