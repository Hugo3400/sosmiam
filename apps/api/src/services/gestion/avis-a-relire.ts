// La file « Avis à relire » du logiciel de gestion, en lecture seule : les avis en relecture (raison, verdicts des
// ambassadeurs comptés, jamais qui les a donnés) et les réponses des lieux à relire. Trancher passe par le service de la
// session App (avis-gestion.ts), qui change le statut, les points et les défis.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { creerStockagePhotosAvis, type StockagePhotosAvis } from "../stockage-photos-avis.ts";

const PAR_PAGE = 20;
const LIEU = { select: { id: true, nom: true, emoji: true, ville: true } } as const;

export async function listerAvisARelire({ quoi, page }: { quoi: "avis" | "reponses"; page: number }) {
  const ouAvis = { statut: "en-relecture" };
  const ouReponses = { reponseStatut: "en-relecture" };
  const [avis, reponses] = await Promise.all([baseDeDonnees.avis.count({ where: ouAvis }), baseDeDonnees.avis.count({ where: ouReponses })]);
  const compteurs = { avis, reponses };
  if (quoi === "reponses") {
    const lignes = await baseDeDonnees.avis.findMany({
      where: ouReponses, orderBy: [{ reponseLe: "asc" }, { id: "asc" }], skip: (page - 1) * PAR_PAGE, take: PAR_PAGE,
      select: { id: true, note: true, texte: true, signature: true, statut: true, reponseTexte: true, reponseLe: true, reponseParId: true, lieu: LIEU },
    });
    return { compteurs, parPage: PAR_PAGE, avis: [], reponses: lignes };
  }
  const lignes = await baseDeDonnees.avis.findMany({
    where: ouAvis, orderBy: [{ creeLe: "asc" }, { id: "asc" }], skip: (page - 1) * PAR_PAGE, take: PAR_PAGE,
    select: {
      id: true, compteId: true, note: true, texte: true, photo: true, signature: true, visiteId: true, raisonRelecture: true, repasOffert: true, creeLe: true,
      lieu: LIEU, relectures: { select: { verdict: true, motif: true } },
    },
  });
  // L'auteur vu par l'équipe : ses avis en tout et ceux déjà masqués (jamais ce que l'ambassadeur qui relit en sait)
  const auteurs = await baseDeDonnees.avis.groupBy({ by: ["compteId", "statut"], where: { compteId: { in: [...new Set(lignes.map((a) => a.compteId))] } }, _count: { _all: true } });
  const historique = (compteId: number) => ({
    avis: auteurs.filter((g) => g.compteId === compteId).reduce((n, g) => n + g._count._all, 0),
    masques: auteurs.find((g) => g.compteId === compteId && g.statut === "masque")?._count._all ?? 0,
  });
  return {
    compteurs,
    parPage: PAR_PAGE,
    avis: lignes.map(({ photo, visiteId, relectures, ...a }) => ({
      ...a,
      avecPhoto: photo !== null,
      verifie: visiteId !== null,
      verdicts: {
        ok: relectures.filter((r) => r.verdict === "ok").length,
        louche: relectures.filter((r) => r.verdict === "louche").length,
        motifs: relectures.flatMap((r) => (r.verdict === "louche" && r.motif ? [r.motif] : [])),
      },
      auteur: historique(a.compteId),
    })),
    reponses: [],
  };
}

let stockagePhotos: StockagePhotosAvis | null = null;

export async function lirePhotoAvisGestion(avisId: number): Promise<Buffer | null> {
  const avis = await baseDeDonnees.avis.findUnique({ where: { id: avisId }, select: { photo: true } });
  if (!avis?.photo) return null;
  stockagePhotos ??= creerStockagePhotosAvis();
  return stockagePhotos.lire(avis.photo);
}
