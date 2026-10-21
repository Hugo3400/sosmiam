import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { DepotConfirmationsNewsletter } from "./confirmations-newsletter-regles.ts";
import { enregistrerInscription, type Telephone } from "./inscriptions.ts";

const estDoublon = (erreur: unknown) => typeof erreur === "object" && erreur !== null && "code" in erreur && erreur.code === "P2002";
const lireTelephone = (telephone: string | null): Telephone | null => (telephone === "iphone" || telephone === "android" ? telephone : null);

export function creerDepotConfirmationsNewsletter(): DepotConfirmationsNewsletter {
  return {
    lireAttente: (email) =>
      baseDeDonnees.confirmationNewsletter.findUnique({ where: { email }, select: { jetonEmpreinte: true, envoyeLe: true, expireLe: true, envois: true } }),

    async creerAttente(attente) {
      try {
        await baseDeDonnees.confirmationNewsletter.create({ data: attente, select: { id: true } });
        return true;
      } catch (erreur) {
        if (estDoublon(erreur)) return false;
        throw erreur;
      }
    },

    async remplacerAttente(ancienneEmpreinte, attente) {
      const { count } = await baseDeDonnees.confirmationNewsletter.updateMany({ where: { email: attente.email, jetonEmpreinte: ancienneEmpreinte }, data: attente });
      return count === 1;
    },

    confirmer: (jetonEmpreinte, maintenant) =>
      baseDeDonnees.$transaction(async (transaction) => {
        const attente = await transaction.confirmationNewsletter.findUnique({ where: { jetonEmpreinte } });
        if (!attente || attente.expireLe.getTime() <= maintenant.getTime()) return false;
        const { count } = await transaction.confirmationNewsletter.deleteMany({ where: { id: attente.id, jetonEmpreinte } });
        if (count !== 1) return false;
        const { email, ville, ambassadeur, telephone, beta, source } = attente;
        await enregistrerInscription({ email, ville, ambassadeur, telephone: lireTelephone(telephone), beta, source }, transaction, maintenant);
        return true;
      }),
  };
}

export async function effacerConfirmationsNewsletterExpirees(maintenant = new Date()): Promise<number> {
  const { count } = await baseDeDonnees.confirmationNewsletter.deleteMany({ where: { expireLe: { lte: maintenant } } });
  return count;
}
