import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { open, type FileHandle } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { after, test } from "node:test";

import { creerStockagePhotosAvis, FORME_PHOTO_AVIS, type DisquePhotosAvis } from "../src/services/stockage-photos-avis.ts";

const racine = mkdtempSync(join(tmpdir(), "sos-miam-photos-avis-essai-"));
after(() => rmSync(racine, { recursive: true, force: true }));

const FICHE = { compteId: 7, deposeLe: new Date("2026-10-15T10:00:00Z") };
const OCTETS = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

test("disque : dossier 0700, photo et fiche 0600, noms tirés, jamais un chemin, pas d'écrasement", async () => {
  const dossier = join(racine, "a", "photos-avis");
  const s = creerStockagePhotosAvis(dossier);
  const photo = s.tirerNom();
  assert.match(photo, FORME_PHOTO_AVIS);
  assert.notEqual(s.tirerNom(), photo);
  await s.ecrire(photo, OCTETS, FICHE);
  const fiche = photo.replace(".jpg", ".json");
  assert.equal(statSync(dossier).mode & 0o777, 0o700);
  for (const nom of [photo, fiche]) assert.equal(statSync(join(dossier, nom)).mode & 0o777, 0o600, nom);
  assert.deepEqual([await s.lire(photo), await s.lireFiche(photo), await s.existe(photo)], [OCTETS, FICHE, true]);
  await assert.rejects(s.ecrire(photo, Buffer.from("autre"), { compteId: 8, deposeLe: new Date() }), (e: NodeJS.ErrnoException) => e.code === "EEXIST");
  assert.deepEqual([await s.lire(photo), await s.lireFiche(photo)], [OCTETS, FICHE], "rien n'est écrasé ni effacé");

  writeFileSync(join(racine, "secret.jpg"), "x");
  for (const mauvais of ["../secret.jpg", "secret.jpg", photo.toUpperCase(), fiche, `${photo}/x`, "", "/etc/passwd"]) {
    await assert.rejects(s.ecrire(mauvais, OCTETS, FICHE), /refusé/, mauvais);
    assert.deepEqual([await s.lire(mauvais), await s.lireFiche(mauvais), await s.existe(mauvais)], [null, null, false], mauvais);
  }
  assert.equal(await s.supprimer(["../secret.jpg", "secret.jpg"]), 0);
  assert.deepEqual(readdirSync(racine).includes("secret.jpg"), true);
  const part = await s.lirePartLibre();
  assert.ok(part > 0 && part <= 1);
});

test("lister et supprimer : dans l'ordre, la date de la fiche (sinon celle du disque), photo et fiche ensemble", async () => {
  const dossier = join(racine, "b");
  const s = creerStockagePhotosAvis(dossier);
  assert.deepEqual(await s.lister(null, 10), [], "dossier absent : rien");
  const noms = [s.tirerNom(), s.tirerNom(), s.tirerNom()].sort();
  for (const nom of noms) await s.ecrire(nom, OCTETS, FICHE);
  writeFileSync(join(dossier, noms[1]!.replace(".jpg", ".json")), "pas du json");
  const ancienne = new Date("2026-09-01T00:00:00Z");
  utimesSync(join(dossier, noms[1]!), ancienne, ancienne);
  rmSync(join(dossier, noms[2]!));
  writeFileSync(join(dossier, "intrus.txt"), "x");
  assert.deepEqual(await s.lister(null, 10), [
    { photo: noms[0], deposeLe: FICHE.deposeLe },
    { photo: noms[1], deposeLe: ancienne },
    { photo: noms[2], deposeLe: FICHE.deposeLe },
  ]);
  assert.deepEqual((await s.lister(noms[0]!, 1)).map((r) => r.photo), [noms[1]]);
  assert.equal(await s.lireFiche(noms[1]!), null, "fiche illisible");
  assert.equal(await s.existe(noms[2]!), false, "fiche sans photo");
  assert.equal(await s.supprimer([...noms, "intrus.txt"]), 2);
  assert.deepEqual(readdirSync(dossier), ["intrus.txt"]);
});

test("fsync : la fiche, puis la photo, puis le dossier ; une panne d'écriture ne laisse ni l'une ni l'autre", async () => {
  const dossier = join(racine, "c");
  const gestes: string[] = [];
  const panne = { photo: false, dossier: "" };
  const espion = (async (chemin: string, drapeaux: string, mode?: number) => {
    const nom = basename(chemin);
    gestes.push(`open ${nom} ${drapeaux}`);
    const poignee = await open(chemin, drapeaux, mode);
    return {
      writeFile: async (donnees: Uint8Array | string) => {
        if (panne.photo && nom.endsWith(".jpg")) throw Object.assign(new Error("disque plein"), { code: "ENOSPC" });
        return poignee.writeFile(donnees);
      },
      sync: async () => {
        gestes.push(`sync ${nom}`);
        if (panne.dossier && nom === basename(dossier)) throw Object.assign(new Error("fsync"), { code: panne.dossier });
        return poignee.sync();
      },
      close: async () => {
        gestes.push(`close ${nom}`);
        return poignee.close();
      },
    } as unknown as FileHandle;
  }) as unknown as DisquePhotosAvis["open"];
  const s = creerStockagePhotosAvis(dossier, { disque: { open: espion } });

  const photo = s.tirerNom();
  const fiche = photo.replace(".jpg", ".json");
  await s.ecrire(photo, OCTETS, FICHE);
  assert.deepEqual(gestes, [
    `open ${fiche} wx`, `sync ${fiche}`, `close ${fiche}`,
    `open ${photo} wx`, `sync ${photo}`, `close ${photo}`,
    "open c r", "sync c", "close c",
  ]);

  panne.photo = true;
  const ratee = s.tirerNom();
  await assert.rejects(s.ecrire(ratee, OCTETS, FICHE), /disque plein/);
  assert.deepEqual(readdirSync(dossier).sort(), [fiche, photo].sort(), "ni fiche ni photo de l'envoi raté");
  panne.photo = false;

  panne.dossier = "EINVAL";
  const tolere = s.tirerNom();
  await s.ecrire(tolere, OCTETS, FICHE);
  assert.equal(await s.existe(tolere), true, "un dossier qui ne sait pas se forcer : la photo l'est déjà");
  panne.dossier = "EIO";
  await assert.rejects(s.ecrire(s.tirerNom(), OCTETS, FICHE), /fsync/);
  assert.equal(readdirSync(dossier).length, 4, "la panne du dossier défait l'envoi");
});
