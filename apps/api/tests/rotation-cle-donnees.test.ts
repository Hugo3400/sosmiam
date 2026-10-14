// Changement de la clé des données des comptes (docs/procedure-changement-cle.md) : version de clé dans les chiffrés
// (« v1: » des anciens = la première clé), lecture avec l'ancienne clé, rechiffrement par paquets, liens de désinscription
// signés avec l'ancienne clé, lecture des fichiers au démarrage. Clés de TEST seulement : la vraie clé n'est jamais lue.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { creerControleursNewsletterPublic } from "../src/controleurs/newsletter-public.ts";
import { chiffrerDonnee } from "../src/fonctions/securite/chiffrer-donnee.ts";
import { lireVersionChiffre } from "../src/fonctions/securite/lire-version-chiffre.ts";
import { creerJetonDesinscription } from "../src/fonctions/newsletter/creer-jeton-desinscription.ts";
import { chargerChiffrementDonnees, creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { brancherCleDesinscription, CONTEXTE_DESINSCRIPTION, lireClesAnciennesDesinscription } from "../src/services/liens-desinscription.ts";
import { rechiffrerComptes } from "../src/services/rechiffrement-comptes.ts";

const ancienne = randomBytes(32);
const nouvelle = randomBytes(32);
const avant = creerChiffrementDonnees(ancienne);
const pendant = creerChiffrementDonnees(nouvelle, { version: 2, anciennes: [{ version: 1, cle: ancienne }] });
const apres = creerChiffrementDonnees(nouvelle, { version: 2 });
const dossier = mkdtempSync(join(tmpdir(), "sos-miam-rotation-test-"));
after(() => rmSync(dossier, { recursive: true, force: true }));

test("rétrocompatible : un ancien chiffré « v1: » (écrit avant les versions) se lit, comme version 1", () => {
  const ancien = chiffrerDonnee("Léa Martin", ancienne, "nom");
  assert.match(ancien, /^v1:/);
  assert.equal(lireVersionChiffre(ancien), 1);
  assert.equal(avant.dechiffrer(ancien, "nom"), "Léa Martin");
  assert.equal(pendant.dechiffrer(ancien, "nom"), "Léa Martin");
  assert.equal(avant.versionCle, 1);
  assert.match(avant.chiffrer("x", "nom"), /^v1:/, "sans changement de clé, le format écrit ne bouge pas");
});

test("écriture versionnée : la clé courante, avec sa version ; estAncien reconnaît le reste", () => {
  const chiffre = pendant.chiffrer("1990-05-04", "dateNaissance");
  assert.match(chiffre, /^v2:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$/);
  assert.equal(apres.dechiffrer(chiffre, "dateNaissance"), "1990-05-04", "lisible avec la nouvelle clé seule");
  assert.throws(() => avant.dechiffrer(chiffre, "dateNaissance"));
  assert.equal(pendant.estAncien(chiffre), false);
  assert.equal(pendant.estAncien(avant.chiffrer("x", "nom")), true);
  assert.deepEqual(pendant.versionsAnciennes, [1]);
  assert.deepEqual(apres.versionsAnciennes, []);
  assert.throws(() => creerChiffrementDonnees(nouvelle, { version: 1, anciennes: [{ version: 1, cle: ancienne }] }), /version/);
});

test("lecture avec l'ancienne clé : la version écrite d'abord, puis les autres ; sans l'ancienne clé, erreur sans la donnée", () => {
  const ancien = avant.chiffrer("Léa", "nom");
  assert.equal(pendant.dechiffrer(ancien, "nom"), "Léa");
  // Une étiquette fausse (« v2 » sur un chiffré de l'ancienne clé) se lit quand même : la version ne fait que l'ordre
  assert.equal(pendant.dechiffrer(ancien.replace(/^v1:/, "v2:"), "nom"), "Léa");
  assert.throws(() => apres.dechiffrer(ancien, "nom"), (erreur: Error) => !erreur.message.includes("Léa"));
  assert.throws(() => pendant.dechiffrer(ancien, "dateNaissance"), "le champ reste authentifié");
  // Sous-clés : la courante ne change pas de sens, les anciennes sont celles d'avant
  assert.deepEqual(pendant.deriverClesAnciennes("ctx"), [avant.deriverCle("ctx")]);
  assert.deepEqual(pendant.deriverCleVersion("ctx", 1), avant.deriverCle("ctx"));
  assert.deepEqual(pendant.deriverCleVersion("ctx", 2), apres.deriverCle("ctx"));
  assert.equal(apres.deriverCleVersion("ctx", 1), null);
});

type Ligne = { id: number; nomChiffre: string | null; dateNaissanceChiffree: string | null; modifieLe: Date };
/** Une fausse table « compte » : juste les filtres dont le rechiffrement se sert */
function creerFausseBase(lignes: Ligne[]) {
  const appels = { findMany: [] as number[], updateMany: 0 };
  const correspond = (ligne: Record<string, unknown>, filtre: Record<string, any>): boolean => Object.entries(filtre).every(([cle, valeur]) => {
    if (cle === "AND") return (valeur as object[]).every((f) => correspond(ligne, f));
    if (cle === "OR") return (valeur as object[]).some((f) => correspond(ligne, f));
    if (cle === "NOT") return !correspond(ligne, valeur);
    const v = ligne[cle];
    if (valeur === null || typeof valeur !== "object") return v === valeur;
    if ("not" in valeur) return v !== valeur.not;
    if ("startsWith" in valeur) return typeof v === "string" && v.startsWith(valeur.startsWith);
    if ("gt" in valeur) return (v as number) > valeur.gt;
    throw new Error(`filtre inconnu ${cle}`);
  });
  const compte = {
    async findMany({ where, take }: { where: object; take: number }) {
      appels.findMany.push(take);
      return lignes.filter((l) => correspond(l, where)).sort((a, b) => a.id - b.id).slice(0, take).map((l) => ({ ...l }));
    },
    async updateMany({ where, data }: { where: object; data: Partial<Ligne> }) {
      appels.updateMany += 1;
      const trouvees = lignes.filter((l) => correspond(l, where));
      for (const l of trouvees) Object.assign(l, data);
      return { count: trouvees.length };
    },
    async count({ where }: { where: object }) {
      return lignes.filter((l) => correspond(l, where)).length;
    },
  };
  return { base: { compte } as never, appels };
}

test("rechiffrement par paquets de 500 : les anciens chiffrés passent à la clé courante, des nombres en retour", async () => {
  const lignes: Ligne[] = [];
  const date = new Date("2026-01-02T03:04:05Z");
  for (let id = 1; id <= 1203; id += 1) {
    const nom = id % 3 === 0 ? null : id % 5 === 0 ? pendant.chiffrer(`Nom ${id}`, "nom") : avant.chiffrer(`Nom ${id}`, "nom");
    lignes.push({ id, nomChiffre: nom, dateNaissanceChiffree: avant.chiffrer("1990-01-01", "dateNaissance"), modifieLe: date });
  }
  // Déjà à jour (pas relu), et un compte qu'aucune clé ne lit (laissé tel quel, compté)
  lignes.push({ id: 1300, nomChiffre: pendant.chiffrer("A jour", "nom"), dateNaissanceChiffree: null, modifieLe: date });
  lignes.push({ id: 1301, nomChiffre: chiffrerDonnee("Perdu", randomBytes(32), "nom"), dateNaissanceChiffree: null, modifieLe: date });
  const { base, appels } = creerFausseBase(lignes);

  const bilan = await rechiffrerComptes(pendant, base);
  assert.deepEqual(bilan, { rechiffres: 1203, illisibles: 1, restants: 1 });
  assert.deepEqual(appels.findMany, [500, 500, 500], "trois paquets de 500 au plus");
  for (const ligne of lignes.filter((l) => l.id <= 1203)) {
    if (ligne.nomChiffre !== null) assert.equal(apres.dechiffrer(ligne.nomChiffre, "nom"), `Nom ${ligne.id}`);
    assert.equal(apres.dechiffrer(ligne.dateNaissanceChiffree!, "dateNaissance"), "1990-01-01");
    assert.equal(ligne.modifieLe, date, "« modifié le » garde sa date");
  }
  // Un deuxième passage : rien à faire, sauf le compte illisible
  const encore = await rechiffrerComptes(pendant, base);
  assert.deepEqual(encore, { rechiffres: 0, illisibles: 1, restants: 1 });
});

test("rechiffrement sans ancienne clé (ou sans clé) : ne lit rien, rend des zéros", async () => {
  const { base, appels } = creerFausseBase([{ id: 1, nomChiffre: avant.chiffrer("x", "nom"), dateNaissanceChiffree: null, modifieLe: new Date() }]);
  assert.deepEqual(await rechiffrerComptes(apres, base), { rechiffres: 0, illisibles: 0, restants: 0 });
  assert.deepEqual(await rechiffrerComptes(null, base), { rechiffres: 0, illisibles: 0, restants: 0 });
  assert.deepEqual(appels, { findMany: [], updateMany: 0 });
});

/** Appelle GET /newsletter/desinscription?jeton=… sur le contrôleur, sans serveur */
async function lireLien(cle: Uint8Array, clesAnciennes: Uint8Array[] | undefined, jeton: string) {
  const { lireDesinscription } = creerControleursNewsletterPublic({ cle, clesAnciennes, trouverInscrit: async () => null, desinscrire: async () => false });
  let statut = 200;
  let corps: unknown;
  const reponse = { status(code: number) { statut = code; return reponse; }, json(objet: unknown) { corps = objet; return reponse; } };
  await lireDesinscription({ query: { jeton }, body: undefined } as never, reponse as never, () => {});
  return { statut, corps };
}

test("désinscription : un lien signé avec l'ancienne clé reste bon tant qu'elle est là ; les nouveaux, avec la courante", async () => {
  const courante = brancherCleDesinscription(pendant)!;
  const anciennes = lireClesAnciennesDesinscription();
  assert.equal(anciennes.length, 1);
  assert.deepEqual(anciennes[0], avant.deriverCle(CONTEXTE_DESINSCRIPTION));
  const vieuxLien = creerJetonDesinscription("lea@exemple.fr", avant.deriverCle(CONTEXTE_DESINSCRIPTION));
  assert.deepEqual(await lireLien(courante, anciennes, vieuxLien), { statut: 200, corps: { ok: true, email: "l***@exemple.fr" } });
  assert.equal((await lireLien(courante, [], vieuxLien)).statut, 400, "ancienne clé retirée : le vieux lien ne marche plus");
  const nouveauLien = creerJetonDesinscription("lea@exemple.fr", courante);
  assert.equal((await lireLien(courante, anciennes, nouveauLien)).statut, 200);
  assert.equal((await lireLien(courante, undefined, "faux.jeton")).statut, 400);
  brancherCleDesinscription(apres);
  assert.deepEqual(lireClesAnciennesDesinscription(), []);
  brancherCleDesinscription(null);
});

/** Capture console.error et console.warn le temps d'un essai */
function capturer<T>(essai: () => T): { resultat: T; messages: string[] } {
  const messages: string[] = [];
  const [erreur, alerte] = [console.error, console.warn];
  console.error = console.warn = (...morceaux: unknown[]) => void messages.push(morceaux.map(String).join(" "));
  try {
    return { resultat: essai(), messages };
  } finally {
    [console.error, console.warn] = [erreur, alerte];
  }
}

const ecrireCle = (nom: string, contenu: string, mode = 0o600) => {
  const chemin = join(dossier, nom);
  writeFileSync(chemin, contenu, { mode });
  chmodSync(chemin, mode);
  return chemin;
};
const cheminNouvelle = ecrireCle("nouvelle", `${nouvelle.toString("base64")}\n`);
const cheminAncienne = ecrireCle("ancienne", `${ancienne.toString("base64")}\n`);
const sansCle = (messages: string[]) => messages.every((m) => ![ancienne, nouvelle].some((c) => m.includes(c.toString("base64")) || m.includes(c.toString("base64url"))));

test("démarrage sans ancienne clé : version 1, aucune ancienne ; fichier d'ancienne clé introuvable : un avertissement", () => {
  const { resultat, messages } = capturer(() => chargerChiffrementDonnees(cheminNouvelle, { cheminAncienne: null, version: "" }));
  assert.ok(resultat);
  assert.equal(resultat.versionCle, 1);
  assert.deepEqual(resultat.versionsAnciennes, []);
  assert.deepEqual(messages, []);
  const absente = capturer(() => chargerChiffrementDonnees(cheminNouvelle, { cheminAncienne: join(dossier, "absente"), version: "2" }));
  assert.ok(absente.resultat);
  assert.deepEqual(absente.resultat.versionsAnciennes, []);
  assert.equal(absente.messages.length, 1);
  assert.match(absente.messages[0]!, /introuvable/);
});

test("démarrage avec l'ancienne clé : version courante réglée, l'ancienne est la précédente", () => {
  const { resultat, messages } = capturer(() => chargerChiffrementDonnees(cheminNouvelle, { cheminAncienne, version: "2" }));
  assert.ok(resultat);
  assert.equal(resultat.versionCle, 2);
  assert.deepEqual(resultat.versionsAnciennes, [1]);
  assert.equal(resultat.dechiffrer(avant.chiffrer("Léa", "nom"), "nom"), "Léa");
  assert.deepEqual(messages, []);
});

test("mauvais fichier d'ancienne clé, ou version qui ne va pas : erreur claire au démarrage, jamais la clé", () => {
  const mauvais = [
    { cheminAncienne: ecrireCle("courte", randomBytes(16).toString("base64")), version: "2" },
    { cheminAncienne: ecrireCle("phrase", "pas une clé du tout"), version: "2" },
    { cheminAncienne: ecrireCle("ouverte", ancienne.toString("base64"), 0o644), version: "2" },
    { cheminAncienne, version: "" },
    { cheminAncienne, version: "1" },
    { cheminAncienne: null, version: "deux" },
  ];
  for (const options of mauvais) {
    const { resultat, messages } = capturer(() => chargerChiffrementDonnees(cheminNouvelle, options));
    assert.equal(resultat, null, JSON.stringify(options));
    assert.equal(messages.length, 1);
    assert.match(messages[0]!, /INDISPONIBLE/);
    assert.ok(sansCle(messages), "jamais la clé dans le journal");
  }
  // L'ancienne identique à la courante (nouvelle clé pas posée) : ignorée, avec un message
  const identique = capturer(() => chargerChiffrementDonnees(cheminNouvelle, { cheminAncienne: cheminNouvelle, version: "2" }));
  assert.ok(identique.resultat);
  assert.deepEqual(identique.resultat.versionsAnciennes, []);
  assert.match(identique.messages[0]!, /IDENTIQUE/);
  assert.ok(sansCle(identique.messages));
});
