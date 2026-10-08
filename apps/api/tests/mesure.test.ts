// Tests du compteur de visites et de ses fonctions, avec un faux stockage : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { calculerClesPeriodes } from "../src/fonctions/dates/calculer-cles-periodes.ts";
import { listerPeriodes } from "../src/fonctions/dates/lister-periodes.ts";
import { ajouterAEsquisse } from "../src/fonctions/mesure/ajouter-a-esquisse.ts";
import { decrireNavigateur } from "../src/fonctions/mesure/decrire-navigateur.ts";
import { estimerEsquisse } from "../src/fonctions/mesure/estimer-esquisse.ts";
import { nettoyerProvenance } from "../src/fonctions/mesure/nettoyer-provenance.ts";
import { creerCompteurVisites, type EtatPeriode, type LigneDetail, type StockageStats } from "../src/services/mesure.ts";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const WINDOWS_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

test("l'esquisse estime le nombre de visiteurs différents, sans compter deux fois le même", () => {
  for (const nombre of [1, 10, 300, 5000, 50000]) {
    const esquisse = new Uint8Array(4096);
    // Empreintes fixes (et non tirées au hasard) : le test donne toujours le même résultat
    const empreintes = Array.from({ length: nombre }, (_, i) => createHash("sha256").update(`visiteur-${nombre}-${i}`).digest());
    for (const empreinte of empreintes) ajouterAEsquisse(esquisse, empreinte);
    for (const empreinte of empreintes.slice(0, 50)) assert.equal(ajouterAEsquisse(esquisse, empreinte), false);
    const estimation = estimerEsquisse(esquisse);
    const ecart = Math.abs(estimation - nombre) / nombre;
    assert.ok(ecart < (nombre <= 300 ? 0.03 : 0.05), `${nombre} visiteurs estimés à ${estimation}`);
  }
  assert.equal(estimerEsquisse(new Uint8Array(4096)), 0);
});

test("les repères de période suivent l'heure de Paris et les semaines ISO", () => {
  assert.deepEqual(calculerClesPeriodes(new Date("2026-10-08T12:00:00Z")), { jour: "2026-10-08", semaine: "2026-S41", mois: "2026-10", annee: "2026" });
  // 23 h 30 à Paris le 31 décembre, déjà le 1er janvier ? Non : 22 h 30 UTC = 23 h 30 à Paris
  assert.equal(calculerClesPeriodes(new Date("2026-12-31T22:30:00Z")).jour, "2026-12-31");
  assert.equal(calculerClesPeriodes(new Date("2026-12-31T23:30:00Z")).jour, "2027-01-01");
  assert.equal(calculerClesPeriodes(new Date("2027-01-01T12:00:00Z")).semaine, "2026-S53");
  assert.equal(calculerClesPeriodes(new Date("2024-12-30T12:00:00Z")).semaine, "2025-S01");
});

test("la liste des périodes va de la plus ancienne à celle en cours", () => {
  const maintenant = new Date("2026-10-08T12:00:00Z");
  assert.deepEqual(listerPeriodes("jour", 3, maintenant).map((p) => p.cle), ["2026-10-06", "2026-10-07", "2026-10-08"]);
  assert.deepEqual(listerPeriodes("semaine", 2, maintenant), [
    { cle: "2026-S40", debut: "2026-09-28", fin: "2026-10-04" },
    { cle: "2026-S41", debut: "2026-10-05", fin: "2026-10-11" },
  ]);
  assert.deepEqual(listerPeriodes("mois", 2, maintenant), [
    { cle: "2026-09", debut: "2026-09-01", fin: "2026-09-30" },
    { cle: "2026-10", debut: "2026-10-01", fin: "2026-10-31" },
  ]);
  assert.deepEqual(listerPeriodes("annee", 1, maintenant), [{ cle: "2026", debut: "2026-01-01", fin: "2026-12-31" }]);
});

test("appareil, navigateur et système sont reconnus", () => {
  assert.deepEqual(decrireNavigateur(IPHONE), { appareil: "Mobile", navigateur: "Safari", systeme: "iOS" });
  assert.deepEqual(decrireNavigateur(WINDOWS_CHROME), { appareil: "Ordinateur", navigateur: "Chrome", systeme: "Windows" });
  assert.equal(decrireNavigateur(`${WINDOWS_CHROME} Edg/141.0`).navigateur, "Edge");
  assert.equal(decrireNavigateur(`${IPHONE} Instagram 300.0`).navigateur, "Instagram");
});

test("la provenance ne garde que le nom du site, ou la marque ?ref=", () => {
  assert.equal(nettoyerProvenance("/liens?ref=TikTok", "https://www.tiktok.com/@sos.miam", "sosmiam.fr"), "tiktok");
  assert.equal(nettoyerProvenance("/", "https://www.google.com/search?q=sos+miam", "sosmiam.fr"), "google.com");
  assert.equal(nettoyerProvenance("/faq", "https://sosmiam.fr/", "sosmiam.fr"), "Accès direct");
  assert.equal(nettoyerProvenance("/", null, "sosmiam.fr"), "Accès direct");
  assert.equal(nettoyerProvenance("/", "android-app://com.google.android.gm/", "sosmiam.fr"), "com.google.android.gm");
});

function creerFauxStockage() {
  const periodes = new Map<string, EtatPeriode>();
  const details = new Map<string, number>();
  const fermetures: string[] = [];
  const effacements: string[] = [];
  const stockage: StockageStats = {
    lirePeriode: async (source, type, cle) => periodes.get(`${source}|${type}|${cle}`) ?? null,
    ecrirePeriode: async (source, type, cle, etat) => {
      periodes.set(`${source}|${type}|${cle}`, { ...etat, esquisse: new Uint8Array(etat.esquisse), secret: new Uint8Array(etat.secret) });
    },
    ajouterDetails: async (lignes: LigneDetail[]) => {
      for (const l of lignes) details.set(`${l.jour}|${l.dimension}|${l.valeur}`, (details.get(`${l.jour}|${l.dimension}|${l.valeur}`) ?? 0) + l.nombre);
    },
    fermerPeriodesPassees: async (source, enCours) => {
      for (const [repere, etat] of periodes) {
        const [s, type, cle] = repere.split("|") as ["site", keyof typeof enCours, string];
        if (s === source && enCours[type] !== cle) periodes.set(repere, { ...etat, secret: new Uint8Array(), esquisse: new Uint8Array() });
      }
      fermetures.push(`${source}|${enCours.jour}`);
    },
    effacerDetailsAvant: async (source, jour) => {
      effacements.push(`${source}|${jour}`);
    },
  };
  return { stockage, periodes, details, fermetures, effacements };
}

test("le compteur compte vues, visites et visiteurs, et ignore les robots", async () => {
  const { stockage, periodes, details } = creerFauxStockage();
  const compteur = creerCompteurVisites(stockage);
  const midi = new Date("2026-10-08T10:00:00Z");
  const vue = (ip: string, signature: string, minutes: number, adressePage = "/", referent: string | null = null) =>
    compteur.enregistrerVue({ source: "site", adressePage, referent, signature, ip, pays: "FR", moment: new Date(midi.getTime() + minutes * 60_000) });

  await vue("203.0.113.1", IPHONE, 0, "/?ref=tiktok");
  await vue("203.0.113.1", IPHONE, 5, "/faq");
  await vue("203.0.113.1", IPHONE, 50, "/liens"); // plus de 30 minutes après : nouvelle visite
  await vue("203.0.113.2", WINDOWS_CHROME, 10, "/", "https://www.google.com/");
  await vue("203.0.113.3", "Googlebot/2.1 (+http://www.google.com/bot.html)", 12);
  await compteur.vider(new Date(midi.getTime() + 51 * 60_000));

  const jour = periodes.get("site|jour|2026-10-08");
  assert.ok(jour);
  assert.deepEqual([jour.vues, jour.visites, jour.visiteurs], [4, 3, 2]);
  assert.equal(periodes.get("site|annee|2026")?.visiteurs, 2);
  assert.equal(details.get("2026-10-08|page|/"), 2);
  assert.equal(details.get("2026-10-08|page|/faq"), 1);
  assert.equal(details.get("2026-10-08|provenance|tiktok"), 1);
  assert.equal(details.get("2026-10-08|provenance|google.com"), 1);
  assert.equal(details.get("2026-10-08|appareil|Mobile"), 2);
  assert.equal(details.get("2026-10-08|pays|FR"), 3);
  // Aucune trace de l'IP ni du navigateur dans ce qui est gardé
  const garde = JSON.stringify([...details.keys()]);
  assert.ok(!garde.includes("203.0.113") && !garde.includes("Mozilla"));
});

test("le lendemain, le même visiteur compte à nouveau, et la veille est fermée", async () => {
  const { stockage, periodes, fermetures, effacements } = creerFauxStockage();
  const compteur = creerCompteurVisites(stockage);
  const jour1 = new Date("2026-10-08T10:00:00Z");
  const jour2 = new Date("2026-10-09T10:00:00Z");
  await compteur.enregistrerVue({ source: "site", adressePage: "/", referent: null, signature: IPHONE, ip: "203.0.113.9", pays: null, moment: jour1 });
  await compteur.vider(jour1);
  await compteur.enregistrerVue({ source: "site", adressePage: "/", referent: null, signature: IPHONE, ip: "203.0.113.9", pays: null, moment: jour2 });
  await compteur.vider(jour2);
  assert.equal(periodes.get("site|jour|2026-10-09")?.visiteurs, 1);
  // Même semaine et même mois : toujours un seul visiteur
  assert.equal(periodes.get("site|semaine|2026-S41")?.visiteurs, 1);
  assert.equal(periodes.get("site|mois|2026-10")?.vues, 2);
  // La veille a perdu son secret et son esquisse
  assert.equal(periodes.get("site|jour|2026-10-08")?.secret.length, 0);
  assert.deepEqual(fermetures.filter((f) => f === "site|2026-10-09").length, 1);
  // Le détail de plus de 25 mois est effacé
  assert.ok(effacements.includes("site|2024-09-09"));
});
