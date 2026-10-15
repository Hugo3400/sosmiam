import "../socle/garde-fou.ts";
import { readFileSync } from "node:fs";
import { construireDecisionAvis } from "../../src/fonctions/avis/construire-decision-avis.ts";
import { retirerMetadonneesJpeg } from "../../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { creerStockagePhotosAvisEnMemoire } from "../../src/services/stockage-photos-avis.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { citationsPhotosAvis } = await import("../../src/services/citations-photos-avis.ts");
const { creerPhotosAvis } = await import("../../src/services/photos-avis.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const T = new Date("2027-05-01T03:30:00Z");
const JOUR = 86_400_000;
const ilYa = (ms: number) => new Date(T.getTime() - ms);
const PHOTO = readFileSync(new URL("../../tests/donnees/photo-exif-position.jpg", import.meta.url));
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);

const LEA = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa", points: 0, palier: "curieux" });
const MALO = await inserer("comptes", { email: "malo@exemple.fr", prenom: "Malo", points: 0, palier: "curieux" });
const PUBLIE = await inserer("lieux", { nom: "Restaurant du Capitaine Bouiboui", type: "resto", emoji: "🍝", ville: "Montpellier", statut: "publie" });
const BROUILLON = await inserer("lieux", { nom: "La Cambuse du Mousse", type: "resto", emoji: "🥘", ville: "Sète", statut: "brouillon" });

const horloge = { maintenant: T.getTime() };
const stockage = creerStockagePhotosAvisEnMemoire({ horloge: () => horloge.maintenant });
const photos = creerPhotosAvis({ stockage, citations: citationsPhotosAvis, horloge: () => horloge.maintenant });

async function deposer(compteId: number, age = 0): Promise<string> {
  horloge.maintenant = T.getTime() - age;
  const r = await photos.deposer(compteId, PHOTO);
  horloge.maintenant = T.getTime();
  if (!r.ok) throw new Error(`dépôt refusé : ${r.erreur}`);
  return r.photo;
}
const ecrireAvis = (photo: string | null, o: { compteId?: number; lieuId?: number; statut?: string; age?: number } = {}) => inserer("avis", {
  compte_id: o.compteId ?? LEA, lieu_id: o.lieuId ?? PUBLIE, note: 4, texte: "Les crêpes du Capitaine, la Brigade valide.", photo, signature: "Léa",
  statut: o.statut ?? "publie", cree_le: ilYa(o.age ?? 0),
});
async function decider(cible: "avis" | "reponse-avis", avisId: number, d: { traite: number; conteste?: number; reexamine?: number }) {
  const { id } = await baseDeDonnees.signalement.create({
    data: construireDecisionAvis({ cible, avisId, lieuId: PUBLIE, compteId: LEA, motif: "fausse-info", motivation: "Ton avis parlait d'un autre lieu.", maintenant: ilYa(d.traite) }),
    select: { id: true },
  });
  await baseDeDonnees.signalement.update({
    where: { id },
    data: { contesteLe: d.conteste === undefined ? null : ilYa(d.conteste), reexamineLe: d.reexamine === undefined ? null : ilYa(d.reexamine) },
  });
  return id;
}

egal(await citationsPhotosAvis.lister([]), [], "rien à chercher : aucune requête");
egal(await citationsPhotosAvis.listerDecisions([]), []);

const libre = await deposer(LEA);
egal(await photos.verifier(libre, LEA), true, "déposée à l'instant, encore libre");
egal(await photos.verifier(libre, MALO), false, "pas la sienne");
egal(await photos.lirePublique(libre), null, "aucun avis ne la cite : jamais servie");

const visible = await deposer(LEA);
const avisVisible = await ecrireAvis(visible, { age: 0 });
const relue = await deposer(LEA);
const avisRelu = await ecrireAvis(relue, { statut: "en-relecture" });
const cachee = await deposer(LEA);
const avisCache = await ecrireAvis(cachee, { statut: "masque" });
const brouillon = await deposer(LEA);
const avisBrouillon = await ecrireAvis(brouillon, { lieuId: BROUILLON });

const lues = await citationsPhotosAvis.lister([visible, relue, cachee, brouillon, libre, "8b0e7c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.jpg", visible]);
egal(lues.map((c) => [c.photo, c.avisId, c.statut, c.lieuPublie]).sort((a, b) => Number(a[1]) - Number(b[1])), [
  [visible, avisVisible, "publie", true],
  [relue, avisRelu, "en-relecture", true],
  [cachee, avisCache, "masque", true],
  [brouillon, avisBrouillon, "publie", false],
], "chaque avis qui cite une photo, son statut et celui de son lieu");
vrai(lues.every((c) => c.creeLe instanceof Date));

egal(await photos.verifier(visible, LEA), false, "déjà citée par un avis");
egal(await photos.lirePublique(visible), retirerMetadonneesJpeg(PHOTO), "avis publié chez un lieu publié : servie, sans métadonnées");
egal(await photos.lirePublique(relue), retirerMetadonneesJpeg(PHOTO), "en relecture : toujours visible");
egal(await photos.lirePublique(cachee), null, "avis masqué");
egal(await photos.lirePublique(brouillon), null, "lieu pas publié");

const decisionCachee = await decider("avis", avisCache, { traite: 10 * JOUR });
await decider("reponse-avis", avisCache, { traite: 300 * JOUR });
await baseDeDonnees.signalement.create({
  data: { cible: "message", cibleId: String(avisCache), raison: "haine", source: "app", statut: "rejete", traiteLe: ilYa(300 * JOUR) },
});
const decisions = await citationsPhotosAvis.listerDecisions([avisCache, avisCache]);
egal(decisions.length, 1, "seulement les décisions sur l'avis lui-même (ni la réponse du lieu, ni un message qui aurait le même numéro)");
egal([decisions[0]!.avisId, decisions[0]!.statut, decisions[0]!.traiteLe?.toISOString(), decisions[0]!.contesteLe, decisions[0]!.reexamineLe],
  [avisCache, "retenu", ilYa(10 * JOUR).toISOString(), null, null]);
vrai(decisionCachee > 0);

const garder = [libre, visible, relue, cachee, brouillon];
const effacer: string[] = [];
const orpheline = await deposer(LEA, 26 * 3600_000);
effacer.push(orpheline);
garder.push(await deposer(MALO, 24.5 * 3600_000));
const avisEfface = await deposer(LEA, 40 * JOUR);
const idEfface = await ecrireAvis(avisEfface, { age: 40 * JOUR });
await baseDeDonnees.avis.delete({ where: { id: idEfface } });
effacer.push(avisEfface);
const compteEfface = await deposer(MALO, 40 * JOUR);
const MAX = await inserer("comptes", { email: "max@exemple.fr", prenom: "Max", points: 0, palier: "curieux" });
await ecrireAvis(compteEfface, { compteId: MAX, age: 40 * JOUR });
await baseDeDonnees.compte.delete({ where: { id: MAX } });
effacer.push(compteEfface);
const masqueAncien = await deposer(LEA, 250 * JOUR);
await decider("avis", await ecrireAvis(masqueAncien, { statut: "masque", age: 250 * JOUR }), { traite: 200 * JOUR });
effacer.push(masqueAncien);
const conteste = await deposer(LEA, 250 * JOUR);
await decider("avis", await ecrireAvis(conteste, { statut: "masque", age: 250 * JOUR }), { traite: 200 * JOUR, conteste: 190 * JOUR });
garder.push(conteste);
const reexamine = await deposer(LEA, 250 * JOUR);
await decider("avis", await ecrireAvis(reexamine, { statut: "masque", age: 250 * JOUR }), { traite: 200 * JOUR, conteste: 190 * JOUR, reexamine: 20 * JOUR });
garder.push(reexamine);
const reexamineAncien = await deposer(LEA, 400 * JOUR);
await decider("avis", await ecrireAvis(reexamineAncien, { statut: "masque", age: 400 * JOUR }), { traite: 380 * JOUR, conteste: 370 * JOUR, reexamine: 190 * JOUR });
effacer.push(reexamineAncien);

egal(await photos.menager(T), effacer.length, "les photos effacées");
egal([...stockage.fichiers.keys()].sort(), [...garder].sort(), "ce qui reste sur le disque");
egal(await photos.menager(T), 0, "un second passage ne trouve plus rien");
egal(await essai.sql("SELECT count(*)::int AS n FROM avis WHERE photo IS NOT NULL"), [{ n: "8" }], "le ménage ne touche jamais aux avis");

await terminerEssai(import.meta.url, essai, verifications.nombre);
