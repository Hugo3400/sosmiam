// Double en mémoire du fil lu par l'app, pour les tests (aucune base de données).
import { presenterPublicationApp, type LignePublicationApp } from "../fonctions/publications/presenter-publication-app.ts";
import { FORME_FICHIER_MEDIA, type ServicesPublicationsApp } from "./publications-app-regles.ts";

/** Une publication de test, avec ce qui décide si elle est visible */
export type PublicationAppEnMemoire = Omit<LignePublicationApp, "publieeLe" | "jaimes" | "commentaires" | "medias"> & {
  statut: "brouillon" | "publiee" | "masquee";
  suspendue: boolean;
  publieeLe: Date | null;
  /** Statut du lieu et lieu vérifié (au moins un rattachement validé) */
  lieuPublie: boolean;
  lieuVerifie: boolean;
  medias: (LignePublicationApp["medias"][number] & { typeMime: string })[];
};

export function creerPublicationsAppEnMemoire(adresse: (fichier: string) => string) {
  const publications = new Map<number, PublicationAppEnMemoire>();
  const estVisible = (p: PublicationAppEnMemoire, maintenant: Date) =>
    p.statut === "publiee" && !p.suspendue && p.publieeLe !== null && p.publieeLe <= maintenant && p.lieuPublie && (p.auteurType === "createur" || p.lieuVerifie);

  const services: ServicesPublicationsApp = {
    async lister(apres, limite, maintenant) {
      const triees = [...publications.values()]
        .filter((p) => estVisible(p, maintenant))
        .sort((a, b) => b.publieeLe!.getTime() - a.publieeLe!.getTime() || b.id - a.id)
        .filter((p) => !apres || p.publieeLe! < apres.publieeLe || (p.publieeLe!.getTime() === apres.publieeLe.getTime() && p.id < apres.id));
      const page = triees.slice(0, limite);
      const derniere = page[page.length - 1];
      return {
        publications: page.map((p) => presenterPublicationApp({ ...p, publieeLe: p.publieeLe!, jaimes: 0, commentaires: 0 }, adresse)),
        suite: triees.length > limite && derniere ? { publieeLe: derniere.publieeLe!, id: derniere.id } : null,
      };
    },
    async lireMedia(fichier, maintenant) {
      if (!FORME_FICHIER_MEDIA.test(fichier)) return null;
      for (const p of publications.values()) {
        const media = p.medias.find((m) => m.fichier === fichier);
        if (media) return estVisible(p, maintenant) ? { typeMime: media.typeMime } : null;
      }
      return null;
    },
  };
  return { services, publications };
}
