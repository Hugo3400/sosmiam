import { composerCourrielConfirmation } from "../../fonctions/newsletter/composer-courriel-confirmation.ts";
import { envoyerToutDeSuite } from "./file-courriels.ts";

export function envoyerLienConfirmationNewsletter(email: string, lien: string, expireLe: Date, source: string) {
  return envoyerToutDeSuite("confirmation-newsletter", email, { ...composerCourrielConfirmation({ lien, expireLe, source }), secrets: [lien], relancer: true });
}
