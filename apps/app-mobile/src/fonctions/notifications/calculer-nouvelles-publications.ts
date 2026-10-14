import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { NotificationSuivi } from "@sos-miam/commun/types/suivis";
import type { Publication } from "~/contenus/type-publication";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";

/** Une nouveauté reste dans la cloche deux semaines */
const DUREE_JOURS = 14;

type Sources = {
  /** Les clés suivies dans l'activité (« lieu:13 », « createur:lea.mange ») */
  suivis: readonly string[];
  publications: readonly Publication[];
  lieux: readonly Lieu[];
  estMasquee: (publicationId: string) => boolean;
  maintenant: Date;
};

/**
 * « … a posté » avec un compte connecté : calculé sur le téléphone, à partir du fil déjà chargé (rien n'est gardé sur le
 * serveur). Les publications des lieux et créateurs que tu suis, parues ces deux dernières semaines (ni masquées, ni d'un
 * lieu disparu), de la plus récente à la plus ancienne. Une publication sans date de parution n'est jamais annoncée.
 */
export function calculerNouvellesPublications({ suivis, publications, lieux, estMasquee, maintenant }: Sources): NotificationSuivi[] {
  const suivies = new Set(suivis);
  const depuis = maintenant.getTime() - DUREE_JOURS * 24 * 60 * 60_000;
  return publications
    .flatMap((p): NotificationSuivi[] => {
      const date = p.publieeLe ? Date.parse(p.publieeLe) : Number.NaN;
      if (Number.isNaN(date) || date < depuis || date > maintenant.getTime()) return [];
      const cle = calculerCleSuivi(p.auteur, p.lieuId);
      if (!suivies.has(cle) || estMasquee(p.id) || !lieux.some((l) => l.id === p.lieuId)) return [];
      return [{ id: `publication:${p.id}`, date: new Date(date).toISOString(), type: "nouvelle-publication", cle, publicationId: p.id }];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
