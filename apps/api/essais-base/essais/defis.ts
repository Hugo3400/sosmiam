// Essai sur base (PGlite, toutes les migrations du dépôt) du service Prisma des défis (services/defis.ts) : les mesures des
// défis de départ (rescousses, sauvetages, visites pendant un SOS, sorties, noctambules, semaines d'affilée), le crédit
// unique de leurs points (ajouterPointsDans, sous le verrou du compte), leur reprise quand une visite est retirée puis
// rendue, les badges qui restent, et les services de gestion du logiciel (liste, modifier, créer, supprimer). Le client
// global de l'API (connexion.ts) est branché sur PGlite. Aucune vraie base.
import "../socle/garde-fou.ts";
import { ajouterPointsDans, donnerBadge } from "../../src/services/comptes.ts";
import { creerDefis } from "../../src/services/defis.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const base = essai.db;
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const defis = creerDefis({ ajouterPointsDans, donnerBadge });

const compte = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa", points: 0 });
const autre = await inserer("comptes", { email: "zoe@exemple.fr", prenom: "Zoé", points: 0 });
const lieu = async (type: string, ville: string) => inserer("lieux", { type, ville, statut: "publie" });
const patis1 = await lieu("patisserie", "Montpellier");
const patis2 = await lieu("patisserie", "Sète");
const sortie = await lieu("sortie", "Lyon");
const bar = await lieu("bar", "Nantes");
const visite = (lieuId: number, iso: string, pendantSos = false, statut = "validee") =>
  inserer("visites", { compte_id: compte, lieu_id: lieuId, mode: "comptoir", statut, valide_le: new Date(iso), pendant_sos: pendantSos });

// 14 octobre 2026 (premier jour des défis de départ)
const T = (iso: string) => new Date(iso);
// Rescousses (la Brigade : 9) et un premier sauvetage
for (const [i, iso] of ["2026-10-14T09:00:00Z", "2026-10-15T09:00:00Z"].entries()) {
  await inserer("rescousses", { compte_id: compte, lieu_id: [patis1, sortie][i], semaine: "2026-S42", cree_le: T(iso) });
}
await inserer("premiers_sauveteurs", { lieu_id: patis1, compte_id: compte, cree_le: T("2026-10-14T09:00:00Z") });
// Visites validées : 2 pâtisseries pendant un SOS (Pompier de service : 2), une sortie, un bar ; une refusée
const visitePatis1 = await visite(patis1, "2026-10-14T20:30:00Z", true); // 22 h 30
await visite(patis2, "2026-10-21T22:30:00Z", true); // 0 h 30
await visite(sortie, "2026-10-28T11:00:00Z");
await visite(bar, "2026-10-29T01:00:00Z"); // 3 h du matin (heure d'hiver : +1)
await visite(sortie, "2026-10-30T11:00:00Z", true, "refusee");
// Plume gourmande ne compte que les avis vérifiés (écrits grâce à une visite) : celui de la visite de patis1 ; pas celui du bar,
// publié lui aussi, mais sans visite
await inserer("avis", { compte_id: compte, lieu_id: patis1, visite_id: visitePatis1, note: 5, texte: "Miam", signature: "Léa", statut: "publie", photo: "a.jpg", cree_le: T("2026-10-15T10:00:00Z") });
await inserer("avis", { compte_id: compte, lieu_id: bar, note: 5, texte: "Sans visite", signature: "Léa", statut: "publie", photo: "b.jpg", cree_le: T("2026-10-15T11:00:00Z") });
await inserer("avis", { compte_id: compte, lieu_id: patis2, note: 4, texte: "Bon", signature: "Léa", statut: "en-relecture", cree_le: T("2026-10-16T10:00:00Z") });

const maintenant = T("2026-10-30T10:00:00Z");
const bilan = await defis.reevaluer(compte, maintenant);
const ids = Object.fromEntries((await baseDeDonnees.defi.findMany({ select: { id: true, titre: true } })).map((d: { id: number; titre: string }) => [d.titre, d.id]));
// Pompier de service (2 visites pendant un SOS) et Sors de ta cuisine ? (1 sortie seulement) ; Fidèle au poste : semaines 12, 19, 26 → 3 !
egal(bilan.reussis.sort(), [ids["Pompier de service"], ids["Fidèle au poste"]].sort());
egal(bilan.badges, ["premiere-rescousse", "noctambule"]);
const liste = await defis.listerPourCompte(compte, maintenant);
const fait = Object.fromEntries(liste.map((d: { titre: string; fait: number; etat: string }) => [d.titre, `${d.fait}/${d.etat}`]));
egal(fait, {
  "Premiers de cordée": "1/en-cours", "La Brigade de l'automne": "2/en-cours", "Globe-croqueur": "4/en-cours", "La tournée des pâtissiers": "2/en-cours",
  "Sors de ta cuisine": "1/en-cours", "Pompier de service": "2/reussi", "Plume gourmande": "1/en-cours", "Fidèle au poste": "3/reussi",
});
const journal = await baseDeDonnees.journalPoints.findMany({ where: { compteId: compte }, orderBy: { id: "asc" }, select: { points: true, raison: true, detail: true } });
egal(journal.map((j: { detail: string }) => j.detail).sort(), [`defi:${ids["Fidèle au poste"]}`, `defi:${ids["Pompier de service"]}`].sort());
vrai(journal.every((j: { points: number; raison: string }) => j.points === 40 && j.raison === "defi"));
egal((await baseDeDonnees.compte.findUniqueOrThrow({ where: { id: compte } })).points, 80);
egal((await baseDeDonnees.badgeCompte.findMany({ where: { compteId: compte }, orderBy: { id: "asc" } })).map((b: { badge: string }) => b.badge), ["premiere-rescousse", "noctambule"]);

// Relu : rien ne change (crédit unique)
await defis.reevaluer(compte, maintenant);
await defis.listerPourCompte(compte, maintenant);
egal(await baseDeDonnees.journalPoints.count({ where: { compteId: compte } }), 2);

// Une visite pendant un SOS (semaine du 19) retirée par l'équipe : Pompier de service retombe à 1 sur 2, Fidèle au poste
// à 1 semaine d'affilée ; leurs 40 points repartent
await base.query(`UPDATE visites SET statut = 'retiree' WHERE lieu_id = $1`, [patis2]);
const reprise = await defis.reevaluer(compte, maintenant);
egal(reprise.repris.sort(), [ids["Pompier de service"], ids["Fidèle au poste"]].sort());
egal((await baseDeDonnees.compte.findUniqueOrThrow({ where: { id: compte } })).points, 0);
const derniers = await baseDeDonnees.journalPoints.findMany({ where: { compteId: compte }, orderBy: { id: "desc" }, take: 2 });
egal(derniers.map((d: { points: number; detail: string }) => [d.points, d.detail]).sort(), [
  [-40, `defi:${ids["Fidèle au poste"]} retiré`], [-40, `defi:${ids["Pompier de service"]} retiré`],
].sort());
egal(await baseDeDonnees.defiReussi.count({ where: { compteId: compte } }), 0);
// L'équipe donne raison au client : la visite revient, les deux défis aussi
await base.query(`UPDATE visites SET statut = 'validee' WHERE lieu_id = $1`, [patis2]);
egal((await defis.reevaluer(compte, maintenant)).reussis.length, 2);
egal((await baseDeDonnees.compte.findUniqueOrThrow({ where: { id: compte } })).points, 80);
// Les badges restent
egal(await baseDeDonnees.badgeCompte.count({ where: { compteId: compte } }), 2);

// Gestion : la liste (brouillons compris), les réussites comptées
const gestion = await defis.listerGestion();
egal(gestion.length, 8);
egal(gestion.find((d: { id: number }) => d.id === ids["Fidèle au poste"]).reussites, 1);
egal(gestion.find((d: { id: number }) => d.id === ids["La tournée des pâtissiers"]).filtres, { typesLieu: ["patisserie"] });
egal(await defis.modifier(ids["Fidèle au poste"], { objectif: 4 }), { ok: false, erreur: "defi-deja-reussi" });
const renomme = await defis.modifier(ids["Fidèle au poste"], { titre: "Fidèle au poste, toujours", ordre: 20 });
vrai(renomme.ok && renomme.defi.titre === "Fidèle au poste, toujours" && renomme.defi.reussites === 1);
egal(await defis.supprimer(ids["Fidèle au poste"]), { ok: false, erreur: "defi-deja-reussi" });
egal(await defis.modifier(9999, { titre: "x" }), { ok: false, erreur: "defi-inconnu" });
const cree = await defis.creer({ emoji: "🌙", titre: "Couche-tard", texte: "2 visites validées après 22 h.", mesure: "visites", filtres: { apresHeure: 22 }, objectif: 2, points: 20, debut: "2026-10-14", fin: "2026-10-20" });
vrai(cree.ok && cree.defi.publie === false && cree.defi.fin === "2026-10-20");
egal(await defis.creer({ emoji: "🍺", titre: "Tournée des bières", texte: "x", mesure: "visites", objectif: 1, points: 1, debut: "2026-10-14" }), { ok: false, erreur: "champ-invalide", champ: "emoji" });
// Publié : fini le 20 octobre ; le 30, plus que les 7 jours de rattrapage : jamais crédité (1 seule visite après 22 h dans la période, de toute façon)
await defis.modifier(cree.defi.id, { publie: true });
vrai(!(await defis.listerPourCompte(compte, maintenant)).some((d: { id: number }) => d.id === cree.defi.id));
const sansFiltre = await defis.modifier(cree.defi.id, { filtres: null });
vrai(sansFiltre.ok && sansFiltre.defi.filtres === null);
egal((await baseDeDonnees.defi.findUniqueOrThrow({ where: { id: cree.defi.id } })).filtres, null);
egal(await defis.supprimer(cree.defi.id), { ok: true });
egal(await defis.supprimer(cree.defi.id), { ok: false, erreur: "defi-inconnu" });

// Un autre compte, sans rien : tous les défis en cours à 0, aucun point ; un compte effacé : liste vide
vrai((await defis.listerPourCompte(autre, maintenant)).every((d: { fait: number }) => d.fait === 0));
egal(await baseDeDonnees.journalPoints.count({ where: { compteId: autre } }), 0);
egal(await defis.listerPourCompte(424242, maintenant), []);
egal(await defis.reevaluer(424242, maintenant), { reussis: [], repris: [], badges: [] });


await terminerEssai(import.meta.url, essai, verifications.nombre);
