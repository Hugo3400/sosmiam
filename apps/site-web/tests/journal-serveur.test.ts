// Journal du serveur de production (serveur/lancer-serveur.js, à la place de react-router-serve depuis l'audit du
// 14 octobre 2026) : méthode, chemin sans paramètres ni fragment, statut et durée. Jamais un lien de désinscription, une
// recherche, le code d'un QR de connexion ni le pseudo d'une invitation. Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";

// @ts-ignore : module JavaScript du serveur (lancé par Node tel quel, sans types)
import { masquerCheminJournal } from "../serveur/masquer-chemin-journal.js";
// @ts-ignore : idem
import { journaliserRequetes } from "../serveur/journaliser-requetes.js";

test("le chemin seul : ni paramètres ni fragment", () => {
  assert.equal(masquerCheminJournal("/desinscription?jeton=bGVhQGV4ZW1wbGUuZnI.AAAA"), "/desinscription");
  assert.equal(masquerCheminJournal("/communes?q=Montpellier"), "/communes");
  assert.equal(masquerCheminJournal("/faq#age"), "/faq");
  assert.equal(masquerCheminJournal("/?utm_source=tiktok"), "/");
  assert.equal(masquerCheminJournal("?x=1"), "/");
  assert.equal(masquerCheminJournal(undefined), "/");
  assert.equal(masquerCheminJournal("/lieux/12"), "/lieux/12");
});

test("le code d'un QR de connexion et le pseudo d'une invitation sont masqués, données de navigation comprises", () => {
  assert.equal(masquerCheminJournal("/q/Ab3dE5fG7h"), "/q/[code]");
  assert.equal(masquerCheminJournal("/q/Ab3dE5fG7h.data?_routes=routes%2Fpublic%2Fqr-connexion"), "/q/[code]");
  assert.equal(masquerCheminJournal("/invitation/lea.miam#c=SECRET"), "/invitation/[pseudo]");
  assert.equal(masquerCheminJournal("/INVITATION/Lea"), "/invitation/[pseudo]");
  // Les autres chemins qui commencent pareil ne bougent pas
  assert.equal(masquerCheminJournal("/quartiers"), "/quartiers");
  assert.equal(masquerCheminJournal("/q"), "/q");
});

test("une ligne par requête : méthode, chemin masqué, statut et durée, rien d'autre", async () => {
  const lignes: string[] = [];
  const journal = journaliserRequetes({ write: (ligne: string) => lignes.push(ligne) });
  const serveur = createServer((requete, reponse) => journal(requete, reponse, () => void reponse.writeHead(204).end()));
  await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
  try {
    const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
    for (const chemin of ["/desinscription?jeton=SECRET.abc", "/q/CodeSecret?x=1", "/communes?q=Montpellier"]) {
      await fetch(`${adresse}${chemin}`, { headers: { "User-Agent": "NavigateurTest/1.0", Referer: "https://exemple.fr/page?a=1" } });
    }
    await new Promise((fini) => setTimeout(fini, 20));
  } finally {
    await new Promise((fini) => serveur.close(fini));
  }
  assert.equal(lignes.length, 3);
  assert.match(lignes[0], /^GET \/desinscription 204 - \d+\.\d{3} ms\n$/);
  assert.match(lignes[1], /^GET \/q\/\[code\] 204 - /);
  assert.match(lignes[2], /^GET \/communes 204 - /);
  const tout = lignes.join("");
  for (const secret of ["SECRET", "CodeSecret", "Montpellier", "?", "127.0.0.1", "NavigateurTest", "exemple.fr"]) {
    assert.ok(!tout.includes(secret), `« ${secret} » ne doit pas être au journal`);
  }
});
