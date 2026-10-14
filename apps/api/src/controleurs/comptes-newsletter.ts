// Case « newsletter » à la création d'un compte : dans l'app (inscription « app », Apple ou Google) et à l'inscription de
// l'espace ambassadeur. « Soft opt-in » de la CNIL : une case claire, cochée d'avance, que la personne peut décocher.
// - true : un compte de l'app est inscrit tout de suite ; un ambassadeur, à la validation de sa candidature (logiciel).
// - false : le « non » est retenu (noterRefus : liste des désinscrits, 3 ans), pour qu'aucune inscription automatique ne
//   le reprenne par erreur.
// - absent ou null (anciennes versions de l'app) : rien. Contrat : routes/comptes.ts. Jamais d'e-mail dans un journal.
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** La newsletter vue des comptes (services/gestion/newsletter.ts en vrai, la mémoire dans les tests) */
export type InscriptionNewsletterComptes = {
  /** Inscrit un compte de l'app (case cochée) */
  inscrireCompte(email: string, ville: string | null): Promise<unknown>;
  /** Retient le « non » (case décochée) : noterDesinscription en vrai ; absente, le refus n'est pas retenu */
  noterRefus?(email: string): Promise<unknown>;
};

/** Le choix de la case : true ou false ; absent ou null : null (pas de case) ; présent mais pas booléen : 400 {champ: newsletter} */
export function lireChoixNewsletter(corps: Record<string, unknown>): boolean | null {
  if (corps.newsletter === undefined || corps.newsletter === null) return null;
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

/** Retient le refus sans attendre la réponse : une panne est journalisée (sans l'e-mail) et ne fait jamais échouer la création */
export function noterRefusNewsletterSansAttendre(newsletter: InscriptionNewsletterComptes | undefined, email: string) {
  const noterRefus = newsletter?.noterRefus;
  if (!noterRefus) return;
  Promise.resolve()
    .then(() => noterRefus.call(newsletter, email.toLowerCase()))
    .catch((erreur: unknown) => console.error("Comptes : refus de la newsletter non retenu :", resumerErreur(erreur)));
}
