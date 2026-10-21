import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireBilanMenageCarriere } from "../src/fonctions/carriere/decrire-bilan-menage-carriere.ts";
import { verifierPdf } from "../src/fonctions/carriere/verifier-pdf.ts";
import { TEXTE_ILLISIBLE } from "../src/services/carriere-regles.ts";
import { creerChiffrementCarriere } from "../src/services/chiffrement-carriere.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerBancCarriere, creerServicesBancCarriere, CLE_BANC_CARRIERE, fabriquerPdf, OFFRE_BANC } from "./outils/creer-banc-carriere.ts";

const JOUR = 86_400_000;
const PERSONNE = { nom: "Malo Lefèvre", email: "malo.lefevre@exemple.fr", message: "Les pâtisseries de mon quartier méritent d'être connues !", lien: "https://exemple.fr/malo" };
const nouvelle = (o: Partial<typeof PERSONNE> & { cv?: Buffer | null } = {}) => ({
  ...PERSONNE, ...o, majeur: true as const,
  cv: o.cv === null ? null : { nomFichier: "malo.pdf", base64: (o.cv ?? fabriquerPdf("Malo")).toString("base64") },
});

async function preparer(o: Parameters<typeof creerServicesBancCarriere>[0] = {}) {
  const s = creerServicesBancCarriere(o);
  const creee = await s.carriere.creerOffre(OFFRE_BANC);
  assert.ok(creee.ok);
  await s.carriere.publierOffre(creee.offre.id);
  return { ...s, offreId: creee.offre.id };
}

test("verifierPdf : signature au début, %%EOF à la fin, pas de contenu actif", () => {
  assert.equal(verifierPdf(fabriquerPdf()), true);
  assert.equal(verifierPdf(Buffer.concat([fabriquerPdf(), Buffer.from("\r\n\0  ")])), true, "blancs de fin tolérés");
  assert.equal(verifierPdf(Buffer.from("%PDF-")), false);
  assert.equal(verifierPdf(Buffer.concat([Buffer.from(" "), fabriquerPdf()])), false);
  assert.equal(verifierPdf(Buffer.concat([fabriquerPdf(), Buffer.from("du bruit")])), false);
  assert.equal(verifierPdf(fabriquerPdf("/OpenAction << /S /Launch /F (calc.exe) >>")), false);
  assert.equal(verifierPdf(fabriquerPdf("/Names << /EmbeddedFiles 3 0 R >>")), false);
  assert.equal(verifierPdf(fabriquerPdf("/JavaScriptLike n'est pas un nom réservé")), true);
});

test("le message et le CV ne se relisent qu'avec la bonne clé ; une autre clé les dit illisibles", async () => {
  const s = await preparer();
  assert.deepEqual(await s.carriere.deposerCandidature(s.offreId, nouvelle(), new Date(s.horloge())), { ok: true });
  const [ligne] = [...s.memoire.candidatures.values()];
  assert.ok(ligne?.cvFichier);
  assert.equal(s.chiffrement?.dechiffrerTexte(ligne.messageChiffre, ligne.id, "message"), PERSONNE.message);
  assert.throws(() => s.chiffrement?.dechiffrerTexte(ligne.messageChiffre, ligne.id, "nom"), "un chiffré déplacé vers un autre champ ne se relit plus");
  assert.deepEqual(await s.carriere.lireCvCandidature(ligne.id), fabriquerPdf("Malo"));
  assert.equal(await s.carriere.lireCvCandidature("pas-un-id"), null);

  const autre = creerServicesBancCarriere({ cle: new Uint8Array(32).fill(9), depot: s.memoire });
  for (const [fichier, contenu] of s.stockage.fichiers) await autre.stockage.ecrire(fichier, contenu.octets);
  const [illisible] = await autre.carriere.listerCandidatures();
  assert.deepEqual([illisible?.nom, illisible?.email, illisible?.message, illisible?.lien], [TEXTE_ILLISIBLE, TEXTE_ILLISIBLE, TEXTE_ILLISIBLE, TEXTE_ILLISIBLE]);
  assert.equal(await autre.carriere.lireCvCandidature(ligne.id), null);
  const sansCle = creerServicesBancCarriere({ sansCle: true, depot: s.memoire });
  assert.equal((await sansCle.carriere.listerCandidatures())[0]?.message, TEXTE_ILLISIBLE);
});

test("statut : lue, retenue, non retenue ; filtres ; suppression avec son fichier", async () => {
  const s = await preparer();
  await s.carriere.deposerCandidature(s.offreId, nouvelle(), new Date(s.horloge()));
  await s.carriere.deposerCandidature(s.offreId, nouvelle({ email: "autre@exemple.fr", cv: null }), new Date(s.horloge()));
  const [premiere, seconde] = await s.carriere.listerCandidatures();
  assert.ok(premiere && seconde);
  assert.deepEqual(await s.carriere.changerStatutCandidature(premiere.id, "retenue"), { ok: true });
  assert.ok(s.memoire.candidatures.get(premiere.id)?.lueLe, "lue au premier changement");
  assert.deepEqual(await s.carriere.changerStatutCandidature(premiere.id, "embauchee"), { ok: false, erreur: "champ-invalide" });
  assert.deepEqual(await s.carriere.changerStatutCandidature("3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f", "lue"), { ok: false, erreur: "candidature-inconnue" });
  assert.deepEqual((await s.carriere.listerCandidatures({ statut: "retenue" })).map((c) => c.id), [premiere.id]);
  assert.deepEqual(await s.carriere.listerCandidatures({ offreId: "999" }), []);
  assert.deepEqual(await s.carriere.listerCandidatures({ offreId: "abc" }), []);
  const avecCv = [premiere, seconde].find((c) => c.aUnCv)!;
  const fichier = s.memoire.candidatures.get(avecCv.id)!.cvFichier!;
  assert.equal(await s.carriere.supprimerCandidature(avecCv.id), true);
  assert.equal(s.stockage.fichiers.has(fichier), false, "le CV part avec la candidature");
  assert.equal(await s.carriere.supprimerCandidature(avecCv.id), false);
  assert.equal((await s.carriere.listerOffresGestion())[0]?.candidatures, 1);
});

test("ménage : effacée 6 mois après son envoi, CV compris ; fichiers orphelins de plus de 24 h", async () => {
  const s = await preparer();
  const depart = s.horloge();
  await s.carriere.deposerCandidature(s.offreId, nouvelle({ email: "vieille@exemple.fr" }), new Date(depart));
  s.banc.horloge = depart + 2 * JOUR;
  await s.carriere.deposerCandidature(s.offreId, nouvelle({ email: "recente@exemple.fr" }), new Date(s.horloge()));
  const orphelin = s.stockage.tirerNom();
  await s.stockage.ecrire(orphelin, Buffer.from("v1:orphelin"));
  s.banc.horloge = depart + 182 * JOUR;
  const tot = await s.carriere.menager();
  assert.deepEqual(tot, { candidatures: 0, cv: 0, orphelins: 1, rechiffrees: 0, illisibles: 0 });
  assert.equal(s.memoire.candidatures.size, 2);
  s.banc.horloge = depart + 183 * JOUR - 60_000;
  const neuf = s.stockage.tirerNom();
  await s.stockage.ecrire(neuf, Buffer.from("v1:en cours d'envoi"));
  s.banc.horloge = depart + 183 * JOUR + 1;
  const bilan = await s.carriere.menager();
  assert.deepEqual(bilan, { candidatures: 1, cv: 1, orphelins: 0, rechiffrees: 0, illisibles: 0 });
  assert.equal(s.stockage.fichiers.has(neuf), true, "un fichier de moins de 24 h reste");
  assert.deepEqual([...s.memoire.candidatures.values()].map((c) => s.chiffrement?.dechiffrerTexte(c.emailChiffre, c.id, "email")), ["recente@exemple.fr"]);
  assert.equal(s.stockage.fichiers.size, 2);
  assert.deepEqual(decrireBilanMenageCarriere(bilan), [[1, "Candidatures Carrière effacées (6 mois)"], [1, "CV des candidatures effacés (6 mois)"]]);
  for (const [, libelle] of decrireBilanMenageCarriere({ candidatures: 1, cv: 1, orphelins: 1, rechiffrees: 1, illisibles: 1 })) assert.ok(libelle.length <= 60);
});

test("changement de clé : la nuit rechiffre textes et CV, l'ancienne clé peut partir", async () => {
  const ancienne = await preparer();
  await ancienne.carriere.deposerCandidature(ancienne.offreId, nouvelle(), new Date(ancienne.horloge()));
  const nouvelleCle = new Uint8Array(32).fill(11);
  const pendant = creerServicesBancCarriere({ cle: nouvelleCle, version: 2, anciennes: [{ version: 1, cle: CLE_BANC_CARRIERE }], depot: ancienne.memoire });
  for (const [fichier, contenu] of ancienne.stockage.fichiers) await pendant.stockage.ecrire(fichier, contenu.octets);
  const [avant] = [...ancienne.memoire.candidatures.values()];
  assert.ok(avant?.cvFichier);
  assert.deepEqual(await pendant.carriere.lireCvCandidature(avant.id), fabriquerPdf("Malo"), "lu avec l'ancienne clé");
  const bilan = await pendant.carriere.menager();
  assert.deepEqual([bilan.rechiffrees, bilan.illisibles], [1, 0]);
  const apres = ancienne.memoire.candidatures.get(avant.id)!;
  assert.match(apres.messageChiffre, /^v2:/);
  assert.notEqual(apres.cvFichier, avant.cvFichier);
  assert.equal(pendant.stockage.fichiers.has(avant.cvFichier), false, "l'ancien fichier part");
  assert.equal((await pendant.carriere.menager()).rechiffrees, 0, "rien à refaire la nuit suivante");

  const apresChangement = creerServicesBancCarriere({ cle: nouvelleCle, version: 2, depot: ancienne.memoire });
  for (const [fichier, contenu] of pendant.stockage.fichiers) await apresChangement.stockage.ecrire(fichier, contenu.octets);
  assert.equal((await apresChangement.carriere.listerCandidatures())[0]?.message, PERSONNE.message);
  assert.deepEqual(await apresChangement.carriere.lireCvCandidature(avant.id), fabriquerPdf("Malo"));
});

test("aucune donnée personnelle dans les journaux, même quand la base tombe", async () => {
  const lignes: string[] = [];
  const originaux = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  for (const nom of Object.keys(originaux) as (keyof typeof originaux)[]) console[nom] = (...args: unknown[]) => void lignes.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : String(a))).join(" "));
  try {
    const banc = await creerBancCarriere();
    const panne = await creerBancCarriere();
    try {
      const id = await banc.publier();
      const corps = { ...nouvelle(), lien: PERSONNE.lien };
      assert.equal((await banc.demander("POST", `/carriere/offres/${id}/candidatures`, corps)).statut, 201);
      assert.equal((await banc.demander("POST", `/carriere/offres/${id}/candidatures`, { ...corps, email: "faux" })).statut, 400);
      assert.equal((await banc.demander("POST", `/carriere/offres/${id}/candidatures`, { ...corps, cv: { nomFichier: "x.pdf", base64: "QUJD" } })).statut, 415);
      await banc.carriere.listerCandidatures();
      await banc.carriere.menager(new Date(banc.horloge() + 400 * JOUR));

      const idPanne = await panne.publier();
      panne.memoire.ajouterCandidature = async (c) => {
        throw new Error(`violation de contrainte : ${JSON.stringify(c)} ${PERSONNE.email} ${PERSONNE.nom}`);
      };
      assert.equal((await panne.demander("POST", `/carriere/offres/${idPanne}/candidatures`, corps)).statut, 500);
      assert.equal(panne.stockage.fichiers.size, 0, "le CV écrit avant la panne est retiré");
    } finally {
      await banc.fermer();
      await panne.fermer();
    }
  } finally {
    Object.assign(console, originaux);
  }
  assert.ok(lignes.length > 0, "la panne a bien été écrite au journal");
  const journal = lignes.join("\n");
  for (const secret of [PERSONNE.nom, "Malo", PERSONNE.email, "malo.lefevre", PERSONNE.message, "pâtisseries", PERSONNE.lien]) {
    assert.ok(!journal.includes(secret), `le journal ne contient pas « ${secret} »`);
  }
});

test("la sous-clé des candidatures n'est pas la clé des comptes, et l'empreinte d'e-mail ignore la casse", () => {
  const chiffrement = creerChiffrementCarriere(creerChiffrementDonnees(CLE_BANC_CARRIERE))!;
  assert.equal(chiffrement.calculerEmpreinteEmail(" Zoe@Exemple.fr "), chiffrement.calculerEmpreinteEmail("zoe@exemple.fr"));
  assert.match(chiffrement.calculerEmpreinteEmail("zoe@exemple.fr"), /^[0-9a-f]{64}$/);
  const donnees = creerChiffrementDonnees(CLE_BANC_CARRIERE);
  const chiffre = chiffrement.chiffrerTexte("Zoé", "3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f", "nom");
  assert.throws(() => donnees.dechiffrer(chiffre, "nom"));
  assert.equal(chiffrement.dechiffrerTexte(chiffre, "3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f", "nom"), "Zoé");
  assert.throws(() => chiffrement.dechiffrerTexte(chiffre, "0f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f", "nom"));
});
