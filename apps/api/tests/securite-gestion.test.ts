import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireBilanMenageSecurite } from "../src/fonctions/chasse-aux-bugs/decrire-bilan-menage-securite.ts";
import { TEXTE_ILLISIBLE } from "../src/services/securite-regles.ts";
import { fabriquerPng } from "./outils/fabriquer-png.ts";
import { CLE_BANC_SECURITE, creerServicesBancSecurite, image, JPEG_POSITION, signalement } from "./outils/creer-banc-securite.ts";

const JOUR = 86_400_000;

async function deposer(s: ReturnType<typeof creerServicesBancSecurite>, o: Record<string, unknown> = {}) {
  const resultat = await s.securite.deposerSignalement(signalement(o) as never, new Date(s.horloge()));
  assert.deepEqual(resultat, { ok: true });
  return [...s.memoire.signalements.values()].at(-1)!.id;
}

test("liste : les nouveaux en tête, puis les plus récents ; déchiffrés ; compte trouvé seulement avec un e-mail confirmé", async () => {
  const s = creerServicesBancSecurite();
  const premier = await deposer(s, { email: "ada@exemple.fr" });
  s.banc.horloge += 60_000;
  const second = await deposer(s, { email: "linus@exemple.fr", lien: null, nomTableauHonneur: null });
  s.banc.horloge += 60_000;
  const troisieme = await deposer(s, { email: "grace@exemple.fr", images: [image(fabriquerPng())] });
  assert.equal((await s.securite.changerSignalementSecurite(troisieme, { statut: "en-cours" })).ok, true);
  s.memoire.comptes.push({ id: 1, email: "ada@exemple.fr", confirme: true }, { id: 2, email: "linus@exemple.fr", confirme: false });
  const liste = await s.securite.listerSignalementsSecurite();
  assert.deepEqual(liste.map((l) => l.id), [second, premier, troisieme]);
  assert.deepEqual(liste.map((l) => l.compteTrouve), [false, true, false]);
  const [lu] = liste;
  assert.deepEqual(
    { ...lu, id: undefined, creeLe: undefined },
    {
      id: undefined, nom: "Zoé Martin", email: "linus@exemple.fr", cible: "api", titre: "Une route rend l'e-mail des autres",
      description: signalement().description, lien: null, nomTableauHonneur: null, auTableauHonneur: false, images: 0, statut: "nouveau",
      gravite: null, compteTrouve: false, badgeDonne: false, creeLe: undefined, clotureLe: null, effaceLe: null,
    },
  );
  assert.equal(liste[2]?.images, 1);
  assert.deepEqual((await s.securite.listerSignalementsSecurite({ statut: "en-cours" })).map((l) => l.id), [troisieme]);
  assert.deepEqual(await s.securite.listerSignalementsSecurite({ statut: "piano" as never }), []);
  assert.equal(await s.securite.lireSignalementSecurite("pas-un-id"), null);
  assert.equal((await s.securite.lireSignalementSecurite(premier))?.email, "ada@exemple.fr");

  const autreCle = creerServicesBancSecurite({ cle: new Uint8Array(32).fill(3), depot: s.memoire });
  const illisible = await autreCle.securite.lireSignalementSecurite(premier);
  assert.deepEqual([illisible?.nom, illisible?.email, illisible?.description, illisible?.compteTrouve], [TEXTE_ILLISIBLE, TEXTE_ILLISIBLE, TEXTE_ILLISIBLE, false]);
  const sansCle = creerServicesBancSecurite({ sansCle: true, depot: s.memoire });
  assert.equal((await sansCle.securite.lireSignalementSecurite(premier))?.titre, TEXTE_ILLISIBLE);
});

test("statut, gravité et clôture : clore remplit clotureLe, rouvrir le vide, passer d'un statut clos à l'autre le garde", async () => {
  const s = creerServicesBancSecurite();
  const id = await deposer(s);
  const debut = new Date(s.horloge());
  const clos = await s.securite.changerSignalementSecurite(id, { statut: "corrige", gravite: "haute" }, debut);
  assert.ok(clos.ok);
  assert.equal(clos.signalement.clotureLe, debut.toISOString());
  assert.equal(clos.signalement.effaceLe, "2028-10-22T10:00:00.000Z", "effacé 2 ans après la clôture");
  assert.equal(clos.signalement.gravite, "haute");
  const doublon = await s.securite.changerSignalementSecurite(id, { statut: "doublon" }, new Date(debut.getTime() + 5 * JOUR));
  assert.ok(doublon.ok);
  assert.equal(doublon.signalement.clotureLe, debut.toISOString());
  const rouvert = await s.securite.changerSignalementSecurite(id, { statut: "en-cours", gravite: null });
  assert.ok(rouvert.ok);
  assert.deepEqual([rouvert.signalement.clotureLe, rouvert.signalement.effaceLe, rouvert.signalement.gravite], [null, null, null]);
  for (const [changements, champ] of [[{}, "changements"], [null, "changements"], [{ statut: "ferme" }, "statut"], [{ gravite: "enorme" }, "gravite"], [{ auTableauHonneur: "oui" }, "auTableauHonneur"]] as const) {
    assert.deepEqual(await s.securite.changerSignalementSecurite(id, changements), { ok: false, erreur: "champ-invalide", champ });
  }
  assert.deepEqual(await s.securite.changerSignalementSecurite("3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f", { statut: "corrige" }), { ok: false, erreur: "signalement-inconnu" });
});

test("tableau d'honneur : seulement avec un nom donné, retiré à la demande, et il survit à l'effacement du signalement", async () => {
  const s = creerServicesBancSecurite();
  const anonyme = await deposer(s, { nomTableauHonneur: null });
  assert.deepEqual(await s.securite.changerSignalementSecurite(anonyme, { auTableauHonneur: true }), { ok: false, erreur: "sans-nom-tableau" });
  const id = await deposer(s, { nomTableauHonneur: "Ada L." });
  const ajoute = await s.securite.changerSignalementSecurite(id, { statut: "corrige", auTableauHonneur: true }, new Date("2026-10-31T23:30:00Z"));
  assert.ok(ajoute.ok);
  assert.equal(ajoute.signalement.auTableauHonneur, true);
  assert.deepEqual(await s.securite.listerTableauHonneur(), [{ nom: "Ada L.", mois: "2026-11" }], "le mois à l'heure de Paris");
  assert.equal((await s.securite.changerSignalementSecurite(id, { auTableauHonneur: true })).ok, true, "deux fois : une seule entrée");
  assert.equal(s.memoire.entrees.size, 1);
  const retire = await s.securite.changerSignalementSecurite(id, { auTableauHonneur: false });
  assert.ok(retire.ok);
  assert.equal(retire.signalement.auTableauHonneur, false);
  assert.deepEqual(await s.securite.listerTableauHonneur(), []);

  await s.securite.changerSignalementSecurite(id, { auTableauHonneur: true });
  assert.equal(await s.securite.supprimerSignalementSecurite(id), true);
  const entrees = await s.securite.listerEntreesTableauHonneur();
  assert.deepEqual(entrees.map((e) => [e.nom, e.signalementId]), [["Ada L.", null]], "l'entrée reste, sans lien");
  assert.equal(await s.securite.retirerEntreeTableauHonneur("abc"), false);
  assert.equal(await s.securite.retirerEntreeTableauHonneur(entrees[0]!.id), true);
  assert.equal(await s.securite.retirerEntreeTableauHonneur(entrees[0]!.id), false);
  assert.deepEqual(await s.securite.listerTableauHonneur(), []);
});

test("captures : lues déchiffrées par leur numéro, supprimées avec le signalement", async () => {
  const s = creerServicesBancSecurite();
  const png = fabriquerPng();
  const id = await deposer(s, { images: [image(png), image(JPEG_POSITION)] });
  assert.deepEqual(await s.securite.lireImageSignalementSecurite(id, 0), { octets: png, typeMime: "image/png" });
  assert.equal((await s.securite.lireImageSignalementSecurite(id, 1))?.typeMime, "image/jpeg");
  for (const numero of [2, 3, -1, "1.5", "01", null]) assert.equal(await s.securite.lireImageSignalementSecurite(id, numero), null, String(numero));
  assert.equal(await s.securite.lireImageSignalementSecurite("pas-un-id", 0), null);
  const autreCle = creerServicesBancSecurite({ cle: new Uint8Array(32).fill(3), depot: s.memoire });
  for (const [fichier, contenu] of s.stockage.fichiers) await autreCle.stockage.ecrire(fichier, contenu.octets);
  assert.equal(await autreCle.securite.lireImageSignalementSecurite(id, 0), null, "mauvaise clé : rien");
  const fichiers = [...s.memoire.signalements.get(id)!.images];
  assert.equal(await s.securite.supprimerSignalementSecurite(id), true);
  assert.equal(fichiers.some((f) => s.stockage.fichiers.has(f)), false);
  assert.equal(await s.securite.supprimerSignalementSecurite(id), false);
  assert.equal(await s.securite.supprimerSignalementSecurite("pas-un-id"), false);
});

test("badge « chasseur-de-bugs » : au compte dont l'e-mail est confirmé, une seule fois", async () => {
  const s = creerServicesBancSecurite();
  const id = await deposer(s, { email: "Ada@Exemple.fr" });
  assert.deepEqual(await s.securite.donnerBadgeSignalementSecurite(id), { ok: false, erreur: "compte-introuvable" });
  s.memoire.comptes.push({ id: 7, email: "ada@exemple.fr", confirme: false });
  assert.deepEqual(await s.securite.donnerBadgeSignalementSecurite(id), { ok: false, erreur: "compte-introuvable" }, "e-mail pas confirmé");
  s.memoire.comptes[0]!.confirme = true;
  assert.deepEqual(await s.securite.donnerBadgeSignalementSecurite(id), { ok: true, nouveau: true });
  assert.deepEqual([...s.memoire.badges], ["7:chasseur-de-bugs"]);
  assert.deepEqual(await s.securite.donnerBadgeSignalementSecurite(id), { ok: true, nouveau: false });
  const lu = await s.securite.lireSignalementSecurite(id);
  assert.deepEqual([lu?.badgeDonne, lu?.compteTrouve], [true, true]);
  assert.deepEqual(await s.securite.donnerBadgeSignalementSecurite("3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f"), { ok: false, erreur: "signalement-inconnu" });
  const sansCle = creerServicesBancSecurite({ sansCle: true, depot: s.memoire });
  assert.deepEqual(await sansCle.securite.donnerBadgeSignalementSecurite(id), { ok: false, erreur: "chiffrement-indisponible" });
});

test("ménage : effacé 2 ans après la clôture avec ses captures, les ouverts restent ; captures orphelines de plus de 24 h", async () => {
  const s = creerServicesBancSecurite();
  const depart = s.horloge();
  const clos = await deposer(s, { images: [image(fabriquerPng())] });
  const ouvert = await deposer(s, { images: [image(fabriquerPng())] });
  await s.securite.changerSignalementSecurite(clos, { statut: "non-retenu", auTableauHonneur: true }, new Date(depart));
  const orpheline = s.stockage.tirerNom();
  await s.stockage.ecrire(orpheline, Buffer.from("v1:orpheline"));
  s.banc.horloge = depart + 365 * JOUR;
  assert.deepEqual(await s.securite.menager(), { signalements: 0, images: 0, orphelines: 1, rechiffres: 0, illisibles: 0 });
  s.banc.horloge = depart + 733 * JOUR;
  const neuve = s.stockage.tirerNom();
  await s.stockage.ecrire(neuve, Buffer.from("v1:en cours d'envoi"));
  const bilan = await s.securite.menager();
  assert.deepEqual(bilan, { signalements: 1, images: 1, orphelines: 0, rechiffres: 0, illisibles: 0 });
  assert.deepEqual([...s.memoire.signalements.keys()], [ouvert], "l'ouvert reste, même vieux de 2 ans");
  assert.equal(s.stockage.fichiers.has(neuve), true, "une capture de moins de 24 h reste");
  assert.equal(s.stockage.fichiers.size, 2);
  assert.deepEqual((await s.securite.listerEntreesTableauHonneur()).map((e) => e.signalementId), [null], "le nom reste au tableau");
  assert.deepEqual(decrireBilanMenageSecurite(bilan), [[1, "Signalements de sécurité effacés (2 ans après clôture)"], [1, "Captures des signalements effacées (2 ans)"]]);
  for (const [, libelle] of decrireBilanMenageSecurite({ signalements: 1, images: 1, orphelines: 1, rechiffres: 1, illisibles: 1 })) assert.ok(libelle.length <= 60);
});

test("changement de clé : la nuit rechiffre textes et captures, l'ancienne clé peut partir", async () => {
  const ancienne = creerServicesBancSecurite();
  const png = fabriquerPng();
  const id = await deposer(ancienne, { images: [image(png)] });
  const nouvelleCle = new Uint8Array(32).fill(11);
  const pendant = creerServicesBancSecurite({ cle: nouvelleCle, version: 2, anciennes: [{ version: 1, cle: CLE_BANC_SECURITE }], depot: ancienne.memoire });
  for (const [fichier, contenu] of ancienne.stockage.fichiers) await pendant.stockage.ecrire(fichier, contenu.octets);
  const avant = ancienne.memoire.signalements.get(id)!;
  assert.deepEqual((await pendant.securite.lireImageSignalementSecurite(id, 0))?.octets, png, "lue avec l'ancienne clé");
  const bilan = await pendant.securite.menager();
  assert.deepEqual([bilan.rechiffres, bilan.illisibles], [1, 0]);
  const apres = ancienne.memoire.signalements.get(id)!;
  for (const champ of ["nomChiffre", "emailChiffre", "titreChiffre", "descriptionChiffree", "lienChiffre", "nomTableauChiffre"] as const) assert.match(apres[champ]!, /^v2:/, champ);
  assert.notEqual(apres.images[0], avant.images[0]);
  assert.equal(pendant.stockage.fichiers.has(avant.images[0]!), false, "l'ancien fichier part");
  assert.equal((await pendant.securite.menager()).rechiffres, 0, "rien à refaire la nuit suivante");
  const apresChangement = creerServicesBancSecurite({ cle: nouvelleCle, version: 2, depot: ancienne.memoire });
  for (const [fichier, contenu] of pendant.stockage.fichiers) await apresChangement.stockage.ecrire(fichier, contenu.octets);
  assert.equal((await apresChangement.securite.lireSignalementSecurite(id))?.nom, "Zoé Martin");
  assert.deepEqual((await apresChangement.securite.lireImageSignalementSecurite(id, 0))?.octets, png);
});

test("aucune donnée personnelle dans les journaux, même quand la base tombe ; les captures écrites avant la panne partent", async () => {
  const lignes: string[] = [];
  const originaux = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  for (const nom of Object.keys(originaux) as (keyof typeof originaux)[]) console[nom] = (...args: unknown[]) => void lignes.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : String(a))).join(" "));
  const s = creerServicesBancSecurite();
  try {
    s.memoire.ajouterSignalement = async (ligne) => {
      throw new Error(`violation de contrainte : ${JSON.stringify(ligne)} zoe@exemple.fr Zoé Martin`);
    };
    await assert.rejects(s.securite.deposerSignalement(signalement({ email: "zoe@exemple.fr", images: [image(fabriquerPng())] }) as never), (erreur: Error) => {
      lignes.push(erreur.message);
      return true;
    });
  } finally {
    Object.assign(console, originaux);
  }
  assert.equal(s.stockage.fichiers.size, 0);
  const journal = lignes.join("\n");
  for (const secret of ["Zoé", "zoe@exemple.fr", "e-mail d'un autre", "exemple.fr/video", "v1:"]) assert.ok(!journal.includes(secret), `rien de « ${secret} »`);
});
