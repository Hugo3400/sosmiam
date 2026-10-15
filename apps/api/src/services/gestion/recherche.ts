// Recherche partout (Ctrl+K dans le logiciel) : lieux, comptes (prénom, pseudo, e-mail), publications, BIG SOS, demandes
// de lieux, inscrits, signalements (par numéro), défis, missions d'ambassadeur, événements et fichiers de l'Espace presse,
// par nom, adresse ou numéro. Quelques résultats par partie, de quoi ouvrir le bon écran directement.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { listerPresse } from "./presse.ts";

const PAR_PARTIE = 5;

export async function rechercherPartout(texte: string) {
  const q = texte.trim();
  if (q.length < 2) return { lieux: [], comptes: [], publications: [], bigSos: [], demandes: [], inscrits: [], signalements: [], defis: [], missions: [], evenements: [], presse: [] };
  const contient = { contains: q, mode: "insensitive" as const };
  // « 12 » ou « n° 12 » : on cherche aussi par numéro
  const numero = Number(q.replace(/^n°\s*/i, ""));
  const parNumero = Number.isInteger(numero) && numero > 0 && numero < 2_147_483_647 ? numero : null;
  const [lieux, comptes, publications, bigSos, demandes, inscrits, signalements, defis, missions, evenements, presse] = await Promise.all([
    baseDeDonnees.lieu.findMany({
      where: { OR: [{ nom: contient }, { ville: contient }, { quartier: contient }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { modifieLe: "desc" }, select: { id: true, nom: true, emoji: true, ville: true, statut: true },
    }),
    baseDeDonnees.compte.findMany({
      where: { OR: [{ prenom: contient }, { pseudo: contient }, { email: contient }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { derniereConnexion: "desc" }, select: { id: true, prenom: true, pseudo: true, email: true, ambassadeur: { select: { statut: true } } },
    }),
    baseDeDonnees.publication.findMany({
      where: { OR: [{ legende: contient }, { auteurPseudo: contient }, { lieu: { nom: contient } }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, legende: true, statut: true, lieu: { select: { nom: true, emoji: true } } },
    }),
    baseDeDonnees.bigSos.findMany({
      where: { OR: [{ lieu: { nom: contient } }, { lieu: { ville: contient } }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, statut: true, lieu: { select: { nom: true, emoji: true, ville: true } } },
    }),
    baseDeDonnees.demandeLieu.findMany({
      where: { OR: [{ nom: contient }, { ville: contient }] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, nom: true, ville: true, statut: true },
    }),
    baseDeDonnees.inscriptionNewsletter.findMany({
      where: { email: contient }, take: PAR_PARTIE, orderBy: { derniereInscription: "desc" }, select: { id: true, email: true, ville: true },
    }),
    // Signalements : par numéro seulement (le leur, ou celui du contenu signalé), jamais par le texte de qui a signalé
    parNumero
      ? baseDeDonnees.signalement.findMany({
        where: { OR: [{ id: parNumero }, { cibleId: String(parNumero) }] },
        take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, cible: true, cibleId: true, statut: true, raison: true },
      })
      : [],
    baseDeDonnees.defi.findMany({ where: { titre: contient }, take: PAR_PARTIE, orderBy: { id: "desc" }, select: { id: true, emoji: true, titre: true, debut: true, fin: true } }),
    baseDeDonnees.missionAmbassadeur.findMany({
      where: { OR: [{ titre: contient }, { lieu: { nom: contient } }, ...(parNumero ? [{ id: parNumero }] : [])] },
      take: PAR_PARTIE, orderBy: { creeLe: "desc" }, select: { id: true, titre: true, statut: true, compteId: true, compte: { select: { prenom: true } } },
    }),
    baseDeDonnees.evenementLieu.findMany({
      where: { OR: [{ titre: contient }, { lieu: { nom: contient } }] },
      take: PAR_PARTIE, orderBy: { debut: "desc" }, select: { id: true, titre: true, debut: true, suspendu: true, lieu: { select: { nom: true, ville: true } } },
    }),
    chercherPresse(q).catch(() => []),
  ]);
  return {
    lieux,
    comptes,
    publications: publications.map((p) => ({ ...p, legende: p.legende.slice(0, 80) })),
    bigSos,
    demandes,
    inscrits,
    signalements,
    defis,
    missions,
    evenements,
    presse,
  };
}

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Les fichiers de l'Espace presse dont le nom ou la description contient le texte */
async function chercherPresse(q: string) {
  const cherche = sansAccents(q);
  const { familles } = await listerPresse();
  return familles
    .flatMap((famille) => famille.fichiers.map((f) => ({ id: f.id, nom: f.nom, format: f.format, famille: famille.titre, texte: sansAccents(`${f.nom} ${f.description}`) })))
    .filter((f) => f.texte.includes(cherche))
    .slice(0, PAR_PARTIE)
    .map(({ texte: _texte, ...f }) => f);
}
