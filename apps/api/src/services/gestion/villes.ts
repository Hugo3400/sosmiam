// « Lancer une ville » dans le logiciel de gestion : où en est une ville, tout au même endroit (fiches, ambassadeurs,
// places de fondateur, public qu'on peut prévenir). Aucun seuil n'est imposé : c'est Hugo qui décide quand c'est prêt.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { listerManquesLieu } from "../../fonctions/lieux/lister-manques-lieu.ts";
import { chercherCommunes } from "../../fonctions/geo/chercher-communes.ts";
import { normaliserNomCommune } from "../../fonctions/geo/normaliser-nom-commune.ts";
import { lireListeInscrits } from "./boite-mail.ts";
import { trouverZoneDeCommune } from "../zones-fondateurs.ts";

const meme = (a: string | null | undefined, b: string) => normaliserNomCommune(a ?? "") === b;

/** Les villes qui ont des lieux, avec leurs lieux en ligne et en tout (écritures voisines regroupées), les plus fournies d'abord. */
export async function listerVilles() {
  const groupes = await baseDeDonnees.lieu.groupBy({ by: ["ville", "statut"], _count: { _all: true } });
  const villes = new Map<string, { ville: string; lieux: number; enLigne: number }>();
  for (const groupe of groupes) {
    const cle = normaliserNomCommune(groupe.ville);
    if (!cle) continue;
    const ville = villes.get(cle) ?? { ville: groupe.ville.trim(), lieux: 0, enLigne: 0 };
    ville.lieux += groupe._count._all;
    if (groupe.statut === "publie") ville.enLigne += groupe._count._all;
    villes.set(cle, ville);
  }
  return [...villes.values()].sort((a, b) => b.lieux - a.lieux || a.ville.localeCompare(b.ville, "fr"));
}

/** Tout ce qu'il faut savoir avant d'annoncer une ville. */
export async function lireLancementVille(nom: string) {
  const cle = normaliserNomCommune(nom);
  const [lieux, ambassadeurs, appareils, inscrits] = await Promise.all([
    baseDeDonnees.lieu.findMany({
      select: {
        ville: true, statut: true, info: true, texte: true, adresse: true, quartier: true, latitude: true, longitude: true, horaires: true, ouverture: true,
        plat: true, telephone: true, siteWeb: true, instagram: true, animaux: true, accessible: true, terrasse: true, wifi: true, enfants: true,
        parking: true, paiements: true, reservation: true,
      },
    }),
    baseDeDonnees.ambassadeur.findMany({ where: { statut: { in: ["actif", "en-attente"] } }, select: { ville: true, statut: true, compte: { select: { id: true, prenom: true, palier: true } } } }),
    baseDeDonnees.appareilPush.findMany({ where: { actif: true, ville: { not: null } }, select: { ville: true } }),
    lireListeInscrits(),
  ]);
  const ici = lieux.filter((lieu) => meme(lieu.ville, cle));
  const brouillons = ici.filter((lieu) => lieu.statut === "brouillon");
  const ambassadeursIci = ambassadeurs.filter((a) => meme(a.ville, cle));
  const capitaine = ambassadeursIci.find((a) => a.statut === "actif" && a.compte.palier === "ambassadeur-ville");
  // Zone de fondateurs : la commune la plus proche de ce nom, puis sa zone (la ville, ou son département)
  const commune = chercherCommunes(nom, 1)[0];
  const zone = commune ? (await trouverZoneDeCommune(commune.code))?.zone ?? null : null;
  return {
    ville: nom.trim(),
    commune: commune ? { nom: commune.nom, codeDepartement: commune.codeDepartement, population: commune.population } : null,
    lieux: {
      total: ici.length,
      enLigne: ici.filter((lieu) => lieu.statut === "publie").length,
      brouillons: brouillons.length,
      brouillonsComplets: brouillons.filter((lieu) => listerManquesLieu(lieu).length === 0).length,
      masques: ici.filter((lieu) => lieu.statut === "masque").length,
    },
    ambassadeurs: {
      actifs: ambassadeursIci.filter((a) => a.statut === "actif").length,
      enAttente: ambassadeursIci.filter((a) => a.statut === "en-attente").length,
      ambassadeurDeVille: capitaine ? { id: capitaine.compte.id, prenom: capitaine.compte.prenom } : null,
    },
    fondateurs: zone ? { zone: zone.nom, type: zone.type, places: zone.places, prises: zone.prises } : null,
    public: {
      inscrits: inscrits ? inscrits.filter((inscrit) => meme(inscrit.ville, cle)).length : null,
      appareils: appareils.filter((appareil) => meme(appareil.ville, cle)).length,
    },
  };
}
