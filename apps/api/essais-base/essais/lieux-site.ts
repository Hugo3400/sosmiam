import "../socle/garde-fou.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const { creerLieuxSite, LIEUX_PAR_PAGE } = await import("../../src/services/lieux-site.ts");
const { lireFichePublique } = await import("../../src/services/lieux-publics.ts");
const { creerLieuxApp } = await import("../../src/services/lieux-app.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const MAINTENANT = new Date("2026-10-25T18:00:00Z");
const site = creerLieuxSite({ lireFichePublique, lireLieuApp: (id, maintenant) => creerLieuxApp().lireLieu(id, maintenant) });
const gerant = await inserer("comptes", { email: "gerant@exemple.fr", prenom: "Gérant" });

const lieu = (nom: string, valeurs: Record<string, unknown> = {}) =>
  inserer("lieux", { nom, type: "resto", ville: "Montpellier", statut: "publie", latitude: 43.61, longitude: 3.877, ...valeurs });

const enSos = await lieu("Zinc du port", { banniere: "0b3a3f0e-1111-4c22-8333-444455556666.jpg", logo: "0b3a3f0e-1111-4c22-8333-444455556667.png" });
await inserer("rattachements_lieux", { lieu_id: enSos, compte_id: gerant, role: "gerant", preuve: "Kbis", statut: "valide" });
await inserer("sos_lieux", { lieu_id: enSos, compte_id: gerant, places: 6, jusqua: new Date("2026-10-25T20:30:00Z"), cree_le: new Date("2026-10-25T17:00:00Z") });
const verifie = await lieu("Bistrot vérifié", { latitude: 43.612 });
await inserer("rattachements_lieux", { lieu_id: verifie, compte_id: gerant, role: "gerant", preuve: "Kbis", statut: "valide" });
const sosNonVerifie = await lieu("Aaa sans compte");
await inserer("sos_lieux", { lieu_id: sosNonVerifie, compte_id: gerant, places: 4, jusqua: new Date("2026-10-25T20:30:00Z"), cree_le: new Date("2026-10-25T17:00:00Z") });
for (let i = 0; i < 30; i += 1) await lieu(`Resto ${String(i).padStart(2, "0")}`, { latitude: 43.6 + i / 1000 });
await lieu("Bar de Lyon", { type: "bar", ville: "Lyon", latitude: 45.76, longitude: 4.83 });
await lieu("Brouillon caché", { statut: "brouillon" });
await lieu("Sans position", { latitude: null, longitude: null, quartier: "Antigone" });

const premiere = await site.listerPage({ ville: "montpellier", type: null, recherche: null, page: 1 }, MAINTENANT);
egal([premiere.total, premiere.pages, premiere.lieux.length], [34, 2, LIEUX_PAR_PAGE], "Montpellier : 34 lieux publiés, 2 pages de 24");
egal(premiere.lieux.slice(0, 2).map(({ nom, verifie: v, sos }) => [nom, v, sos]), [["Zinc du port", true, { places: 6 }], ["Bistrot vérifié", true, null]], "le SOS vérifié d'abord, puis les vérifiés ; un SOS sans compte ne compte pas");
egal(premiere.lieux[0]?.logo, "/app/lieux/images/0b3a3f0e-1111-4c22-8333-444455556667.png", "le logo en adresse relative");
const deuxieme = await site.listerPage({ ville: "Montpellier", type: null, recherche: null, page: 9 }, MAINTENANT);
egal([deuxieme.page, deuxieme.lieux.length], [2, 10], "une page trop grande rend la dernière");
egal(new Set([...premiere.lieux, ...deuxieme.lieux].map(({ id }) => id)).size, 34, "aucun lieu en double ni oublié entre les pages");
egal((await site.listerPage({ ville: null, type: "bar", recherche: null, page: 1 }, MAINTENANT)).lieux.map(({ nom }) => nom), ["Bar de Lyon"], "filtre par type");
egal((await site.listerPage({ ville: null, type: null, recherche: "antigone", page: 1 }, MAINTENANT)).lieux.map(({ nom }) => nom), ["Sans position"], "recherche dans le quartier");

egal(await site.listerVilles(), [{ ville: "Montpellier", nombre: 34 }, { ville: "Lyon", nombre: 1 }], "villes avec leur nombre, sans les brouillons");
const epingles = await site.listerEpingles({ ville: "Montpellier", type: null }, MAINTENANT);
egal([epingles.length, epingles.find(({ id }) => id === enSos)?.sos, epingles.find(({ id }) => id === sosNonVerifie)?.sos], [33, true, false], "épingles : seulement avec une position ; SOS seulement vérifié");

const accueil = await site.choisirAccueil(MAINTENANT);
egal([accueil.length, accueil[0]?.id], [8, enSos], "accueil : 8 lieux, le SOS vérifié d'abord");

const fiche = await site.lireFiche(enSos, MAINTENANT);
egal([fiche?.banniere, fiche?.logo?.endsWith(".png"), fiche?.sos?.places, fiche?.position?.latitude], ["/app/lieux/images/0b3a3f0e-1111-4c22-8333-444455556666.jpg", true, 6, 43.61], "fiche : bannière, logo, SOS et position");
egal(fiche?.autour.length, 4, "fiche : 4 lieux autour");
vrai(fiche?.autour.every(({ id }) => id !== enSos) ?? false, "le lieu n'est pas dans son propre « autour »");
egal(await site.lireFiche(9999, MAINTENANT), null, "fiche inconnue : null");
egal((await site.lireFiche(await lieu("Sans voisin", { latitude: 48.85, longitude: 2.35 }), MAINTENANT))?.autour, [], "sans voisin : autour vide");

await terminerEssai(import.meta.url, essai, verifications.nombre);
