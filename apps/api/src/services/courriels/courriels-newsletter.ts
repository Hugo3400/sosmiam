import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { composerCourrielConfirmation } from "../../fonctions/newsletter/composer-courriel-confirmation.ts";
import { envoyerToutDeSuite } from "./file-courriels.ts";

export function envoyerLienConfirmationNewsletter(email: string, lien: string, expireLe: Date, source: string, langue: Langue) {
  return envoyerToutDeSuite("confirmation-newsletter", email, { ...composerCourrielConfirmation({ lien, expireLe, source, langue }), secrets: [lien], relancer: true });
}
