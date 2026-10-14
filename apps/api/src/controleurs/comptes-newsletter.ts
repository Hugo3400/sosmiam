// Newsletter cochée à la création d'un compte de l'app (inscription « app », Apple ou Google) : « soft opt-in » de la
// CNIL, l'app montre une case claire que la personne peut décocher. On n'inscrit que sur `newsletter: true` ; absent
// (anciennes versions de l'app) ou false : rien. Contrat : routes/comptes.ts. Jamais d'e-mail dans un journal.
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Inscription à la newsletter (services/gestion/newsletter.ts en vrai, la mémoire dans les tests) */
export type InscriptionNewsletterComptes = { inscrireCompte(email: string, ville: string | null): Promise<unknown> };

/** Le choix de la case : vrai seulement sur `true` ; absent ou null : faux ; présent mais pas booléen : 400 {champ: newsletter} */
export function lireChoixNewsletter(corps: Record<string, unknown>): boolean {
  if (corps.newsletter === undefined || corps.newsletter === null) return false;
  if (typeof corps.newsletter !== "boolean") throw new ChampInvalide("newsletter");
  return corps.newsletter;
}

/** Inscrit sans attendre la réponse : une panne est journalisée (sans l'e-mail) et ne fait jamais échouer la création */
export function inscrireNewsletterSansAttendre(newsletter: InscriptionNewsletterComptes | undefined, email: string, ville: string | null) {
  if (!newsletter) return;
  Promise.resolve()
    .then(() => newsletter.inscrireCompte(email.toLowerCase(), ville))
    .catch((erreur: unknown) => console.error("Comptes : inscription à la newsletter impossible :", resumerErreur(erreur)));
}
