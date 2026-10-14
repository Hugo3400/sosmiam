// Statistiques de visite : ce que le serveur du site envoie à l'API (services/mesure.server.ts). Le chemin, avec seulement
// « ref » et les « utm_… » (provenance et campagne, lus par apps/api/src/services/mesure.ts), et le site d'où l'on arrive,
// sans le reste de son adresse. Jamais un jeton, une recherche, un e-mail, un code de QR ni un pseudo.
// Fausse API locale, aucun réseau. Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { preparerAdresseMesure } from "../src/fonctions/mesure/preparer-adresse-mesure.ts";
// @ts-ignore : idem
import { reduireReferent } from "../src/fonctions/mesure/reduire-referent.ts";

const site = (chemin: string) => `https://sosmiam.fr${chemin}`;

test("le chemin seul, sans aucun paramètre personnel", () => {
  assert.equal(preparerAdresseMesure(site("/desinscription?jeton=bGVhQGV4ZW1wbGUuZnI.AAAA")), "/desinscription");
  assert.equal(preparerAdresseMesure(site("/communes?q=Montpellier")), "/communes");
  assert.equal(preparerAdresseMesure(site("/nouveau-mot-de-passe?jeton=abc&email=lea%40exemple.fr")), "/nouveau-mot-de-passe");
  assert.equal(preparerAdresseMesure(site("/faq")), "/faq");
  assert.equal(preparerAdresseMesure(site("/")), "/");
});

test("ref et utm_… restent, dans leur ordre, pour la provenance et les campagnes", () => {
  assert.equal(preparerAdresseMesure(site("/liens?ref=tiktok")), "/liens?ref=tiktok");
  assert.equal(
    preparerAdresseMesure(site("/?jeton=x&utm_source=instagram&q=lea&utm_campaign=Video-12&utm_medium=bio&email=a%40b.fr")),
    "/?utm_source=instagram&utm_campaign=Video-12&utm_medium=bio",
  );
  // Ce que l'API en lit (nettoyerProvenance, lireCampagne) est toujours là
  const adresse = new URL(preparerAdresseMesure(site("/?utm_campaign=rentree&utm_source=tiktok&ref=bio&page=2")), "https://sosmiam.fr");
  assert.deepEqual([adresse.searchParams.get("utm_campaign"), adresse.searchParams.get("utm_source"), adresse.searchParams.get("ref")], ["rentree", "tiktok", "bio"]);
  assert.equal(adresse.searchParams.get("page"), null);
});

test("navigation dans le site (.data) : la page, sans _routes", () => {
  assert.equal(preparerAdresseMesure(site("/_.data?_routes=root")), "/");
  assert.equal(preparerAdresseMesure(site("/faq.data?_routes=routes%2Fpublic%2Ffaq&utm_source=x")), "/faq?utm_source=x");
});

test("invitation et QR de connexion : ni pseudo, ni code, ni paramètre", () => {
  assert.equal(preparerAdresseMesure(site("/invitation/lea.miam?c=SECRET&utm_source=x")), "/invitation");
  assert.equal(preparerAdresseMesure(site("/q/Ab3dE5fG7h.data?utm_source=x")), "/q");
});

test("le référent réduit au site", () => {
  assert.equal(reduireReferent("https://www.google.com/search?q=sos+miam"), "https://www.google.com");
  assert.equal(reduireReferent("https://sosmiam.fr/desinscription?jeton=SECRET"), "https://sosmiam.fr");
  assert.equal(reduireReferent("android-app://com.google.android.gm/"), "android-app://com.google.android.gm");
  assert.equal(reduireReferent("pas une adresse"), null);
  assert.equal(reduireReferent(null), null);
});

// ─── signalerVue de bout en bout, avec une fausse API ───
const recus: { chemin: string; corps: Record<string, unknown> }[] = [];
const serveur = createServer((requete, reponse) => {
  let texte = "";
  requete.on("data", (morceau) => (texte += morceau));
  requete.on("end", () => {
    recus.push({ chemin: requete.url ?? "", corps: JSON.parse(texte) });
    reponse.writeHead(204).end();
  });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
// @ts-ignore : idem
const { signalerVue } = await import("../src/services/mesure.server.ts");

test("signalerVue envoie le chemin filtré et le site d'origine, rien de plus de l'adresse", async () => {
  recus.length = 0;
  const requete = new Request(site("/desinscription?jeton=SECRET.abc&utm_source=mail&utm_campaign=octobre"), {
    headers: {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      "x-real-ip": "203.0.113.7",
      referer: "https://mail.exemple.fr/boite?message=42",
    },
  });
  signalerVue(requete, new Response("<html></html>", { headers: { "content-type": "text/html" } }), 12.4);
  for (let essai = 0; essai < 50 && recus.length === 0; essai++) await new Promise((fini) => setTimeout(fini, 10));
  assert.equal(recus.length, 1);
  assert.equal(recus[0].chemin, "/mesure/vue");
  assert.equal(recus[0].corps.adressePage, "/desinscription?utm_source=mail&utm_campaign=octobre");
  assert.equal(recus[0].corps.referent, "https://mail.exemple.fr");
  const tout = JSON.stringify(recus[0].corps);
  for (const secret of ["SECRET", "jeton", "message=42", "/boite"]) assert.ok(!tout.includes(secret), `« ${secret} » ne doit pas partir`);
});
