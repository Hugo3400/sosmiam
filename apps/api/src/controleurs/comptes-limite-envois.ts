// Limite des liens envoyés par mail à un même compte (« Mot de passe oublié », confirmation de l'e-mail) : un toutes
// les 15 minutes et 5 par 24 heures (fonctions/comptes/calculer-attente-envoi.ts). En mémoire seulement : rien dans la
// base, aucune adresse IP ni e-mail (la clé est l'id du compte) ; un compte est oublié 24 heures après son dernier lien.
import { calculerAttenteEnvoi, FENETRE_ENVOIS } from "../fonctions/comptes/calculer-attente-envoi.ts";

/** Jamais plus de 100 000 comptes suivis (les plus anciens partent d'abord) */
const SUIVIS_MAX = 100_000;

export function creerLimiteEnvois(horloge: () => number = Date.now) {
  /** Par compte : moments des liens envoyés. Réinséré à chaque envoi : la Map reste rangée du plus ancien au plus récent. */
  const envois = new Map<string, number[]>();

  function oublierLesAnciens(maintenant: number) {
    for (const [cle, moments] of envois) {
      if (maintenant - (moments.at(-1) ?? 0) < FENETRE_ENVOIS && envois.size <= SUIVIS_MAX) break;
      envois.delete(cle);
    }
  }
  // Ménage chaque minute, comme controleurs/comptes-attente.ts. unref : ne retient pas l'arrêt du serveur.
  setInterval(() => oublierLesAnciens(horloge()), 60_000).unref();

  return {
    /** Secondes à attendre avant le prochain lien pour ce compte (0 : il peut partir). */
    lireAttente(cle: string): number {
      return calculerAttenteEnvoi(envois.get(cle) ?? [], horloge());
    },
    /** Un lien vient de partir (ou va partir) pour ce compte. */
    noterEnvoi(cle: string) {
      const maintenant = horloge();
      const moments = (envois.get(cle) ?? []).filter((moment) => maintenant - moment < FENETRE_ENVOIS);
      moments.push(maintenant);
      envois.delete(cle);
      envois.set(cle, moments);
      oublierLesAnciens(maintenant);
    },
    /** Nombre de comptes suivis en ce moment (de quoi vérifier que le ménage passe bien) */
    compterSuivis(): number {
      return envois.size;
    },
  };
}

export type LimiteEnvois = ReturnType<typeof creerLimiteEnvois>;
