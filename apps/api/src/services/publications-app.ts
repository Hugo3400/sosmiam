// Le fil « Pour toi » lu par l'app, dans la base : seulement les publications visibles (voir publications-app-regles.ts).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { presenterPublicationApp } from "../fonctions/publications/presenter-publication-app.ts";
import { COMMENTAIRE_VISIBLE_PUBLIC } from "./commentaires-regles.ts";
import { FORME_FICHIER_MEDIA, type CurseurFil, type ServicesPublicationsApp } from "./publications-app-regles.ts";

/**
 * Visible maintenant : publiée, pas suspendue, date passée, lieu publié ; publiée par le lieu seulement s'il est vérifié.
 * Aussi pour les commentaires (services/commentaires.ts) : on ne lit ni n'écrit sous une publication qui ne se voit pas.
 */
export const filtrePublicationVisible = (maintenant: Date) => ({
  statut: "publiee",
  suspendue: false,
  publieeLe: { lte: maintenant },
  lieu: { statut: "publie" },
  OR: [{ auteurType: "createur" }, { lieu: { rattachements: { some: { statut: "valide" } } } }],
});

/** `adresse` : l'adresse publique d'un fichier de média (https://api.sosmiam.fr/app/medias/<fichier>) */
export function creerPublicationsApp(adresse: (fichier: string) => string): ServicesPublicationsApp {
  return {
    async lister(apres: CurseurFil | null, limite: number, maintenant: Date) {
      const lignes = await baseDeDonnees.publication.findMany({
        where: {
          AND: [
            filtrePublicationVisible(maintenant),
            ...(apres ? [{ OR: [{ publieeLe: { lt: apres.publieeLe } }, { publieeLe: apres.publieeLe, id: { lt: apres.id } }] }] : []),
          ],
        },
        select: {
          id: true, lieuId: true, auteurType: true, auteurPseudo: true, partenariat: true, legende: true, illustration: true, publieeLe: true,
          medias: { select: { type: true, fichier: true, ordre: true } },
          // Les commentaires visibles de tout le monde (ni supprimés, ni masqués par le lieu, ni suspendus, ni retirés)
          _count: { select: { jaimes: true, commentaires: { where: COMMENTAIRE_VISIBLE_PUBLIC } } },
        },
        orderBy: [{ publieeLe: "desc" }, { id: "desc" }],
        // Une de plus, pour savoir s'il y a une page après
        take: limite + 1,
      });
      const page = lignes.slice(0, limite);
      const derniere = page[page.length - 1];
      return {
        publications: page.map(({ _count, ...p }) =>
          presenterPublicationApp({ ...p, publieeLe: p.publieeLe ?? maintenant, jaimes: _count.jaimes, commentaires: _count.commentaires }, adresse)),
        suite: lignes.length > limite && derniere?.publieeLe ? { publieeLe: derniere.publieeLe, id: derniere.id } : null,
      };
    },

    async lireMedia(fichier: string, maintenant: Date) {
      if (!FORME_FICHIER_MEDIA.test(fichier)) return null;
      const media = await baseDeDonnees.mediaPublication.findFirst({ where: { fichier, publication: filtrePublicationVisible(maintenant) }, select: { typeMime: true } });
      return media ?? null;
    },
  };
}
