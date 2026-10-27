import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { registerHooks } from "node:module";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

import { listerThemesDuJour } from "../../../packages/commun/src/fonctions/themes-saison/lister-themes-du-jour.ts";
import { preparerThemeSaisonApi } from "../../../packages/commun/src/fonctions/themes-saison/preparer-theme-saison-api.ts";

const dossierSrc = `${import.meta.dirname}/../src/`;
const racine = pathToFileURL(dossierSrc).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (!specificateur.startsWith("~/")) return suivant(specificateur, contexte);
    const chemin = specificateur.slice(2);
    return suivant(`${racine}${chemin}${existsSync(`${dossierSrc}${chemin}.tsx`) ? ".tsx" : ".ts"}`, contexte);
  },
  load(adresse, contexte, suivant) {
    if (!adresse.endsWith(".tsx")) return suivant(adresse, contexte);
    const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(adresse), "utf8"), {
      fileName: fileURLToPath(adresse),
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  },
});

const lieu = (id: number) => ({
  id, nom: `Lieu ${id}`, type: "resto", emoji: "🍽️", info: "Bistrot", quartier: "", ville: "Lille", prix: "€",
  couleurs: [], decouvertPar: null, logo: null, verifie: false, sos: null,
});

let inscriptions = 0;
const languesThemes: (string | undefined)[] = [];
const themeAnglais = preparerThemeSaisonApi(listerThemesDuJour("2026-10-25")[0], "en");
const serveur = createServer((requete, reponse) => {
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  const chemin = new URL(requete.url ?? "", "http://api").pathname;
  if (chemin === "/lieux/villes") return repondre(200, { ok: true, villes: [{ ville: "Lille", nombre: 2791 }] });
  if (chemin === "/lieux/accueil") return repondre(200, { ok: true, lieux: [lieu(1), lieu(2)] });
  if (chemin === "/app/themes") {
    languesThemes.push(requete.headers["x-langue"] as string | undefined);
    return repondre(200, { ok: true, jour: "2026-10-25", themes: [themeAnglais] });
  }
  if (chemin === "/inscriptions") {
    inscriptions += 1;
    return repondre(200, { ok: true });
  }
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useLoaderData } = await import("react-router");
const accueil = await import("../src/routes/public/accueil.tsx");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const { ecrireMessageInscription } = await import("../src/fonctions/texte/ecrire-message-inscription.ts");
const { TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE } = await import("../src/contenus/inscription-newsletter.ts");
const { paliersAmbassadeurs } = await import("../src/contenus/ambassadeurs.ts");

const handler = createStaticHandler([
  {
    id: "en/accueil",
    path: "/en",
    loader: accueil.loader as never,
    Component: () =>
      h(ContexteLangue, { value: { langue: "en", servies: ["fr", "en"] } }, h(accueil.default as never, { loaderData: useLoaderData(), params: {}, matches: [] } as never)),
  },
]);

async function servirAccueilAnglais() {
  const contexte = await handler.query(new Request("https://apercu.sosmiam.fr/en"));
  assert.ok(!(contexte instanceof Response));
  assert.equal(contexte.statusCode, 200);
  const html = renderToString(h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false }));
  return html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

const metaDe = (langue: string) => accueil.meta({ matches: [{ id: "root", loaderData: { langue } }] } as never) as unknown as Record<string, string>[];

test("meta : titre et description en anglais sur /en, le français intact sinon", () => {
  const anglais = metaDe("en");
  assert.equal(anglais[0].title, "SOS Miam: restaurants, bars and patisseries near you");
  assert.ok(anglais[0].title.length <= 60);
  assert.match(anglais.find((balise) => balise.name === "description")?.content ?? "", /^Find independent restaurants, bars and patisseries near you/);
  assert.equal(anglais.find((balise) => balise.property === "og:locale")?.content, "en_GB");
  assert.equal(metaDe("fr")[0].title, "SOS Miam : restos, bars et pâtisseries de ton quartier");
});

test("accueil en anglais : le thème de saison demandé en anglais, le h1, les sections et la glose de Miam", async () => {
  const html = await servirAccueilAnglais();
  assert.equal(languesThemes.at(-1), "en");
  assert.match(html, /Halloween · 31 October/);
  assert.match(html, /Sweets or a burger\?/);
  assert.match(html, /<h1[^>]*>Rescue a table,<br\/><mark[^>]*>treat yourself\.<\/mark><\/h1>/);
  assert.match(html, /Miam \(say “mee\u2011yam”\) is French for yum!/);
  assert.match(html, /They'd love to see you/);
  assert.match(html, /See all 2,791 places on the map/);
  assert.match(html, /Going through a tough time\? The whole neighbourhood to the rescue\./);
  assert.match(html, /Is your dining room too quiet\?<br\/>Send out an SOS\./);
  assert.match(html, /€0<small[^>]*> for your venue<\/small>/);
  assert.match(html, /🎖️ Ambassador programme/);
  assert.match(html, /Taster<\/h3><p[^>]*>0 points<\/p>/);
  assert.match(html, /City Ambassador<\/h3><p[^>]*>Chosen by the team<\/p>/);
  assert.match(html, /Ready to rescue your first table\?/);
  assert.match(html, /placeholder="Your city or region"/);
  assert.match(html, />Keep me posted</);
  for (const francais of [/Sauve une table/, /Ils ont besoin de toi/, /Préviens-moi/, /Je m'inscris/, /Deviens la voix/, /Tout est gratuit/, /Ta ville ou ta région/]) {
    assert.doesNotMatch(html, francais);
  }
});

test("accueil en anglais : les liens internes passent par /en, l'espace ambassadeur aussi", async () => {
  const html = await servirAccueilAnglais();
  assert.match(html, /href="\/en\/lieux"/);
  assert.match(html, /href="\/en\/inscrire-mon-lieu"/);
  assert.match(html, /href="\/en\/confidentialite"[^>]*>privacy<span class="sr-only">, opens in a new tab<\/span>/);
  assert.match(html, /action="\/en\?index#inscription"/);
  assert.match(html, /href="https:\/\/ambassadeur\.sosmiam\.fr\/en"[^>]*>Become an ambassador</);
});

test("action : des codes, que le formulaire écrit dans la langue de la page", async () => {
  const envoyer = async (champs: Record<string, string>) => {
    const formulaire = new FormData();
    for (const [nom, valeur] of Object.entries(champs)) formulaire.append(nom, valeur);
    return accueil.action({ request: new Request("https://apercu.sosmiam.fr/en?index", { method: "POST", body: formulaire }) } as never);
  };
  const refus = await envoyer({ email: "pas-un-mail" });
  assert.deepEqual(refus, { ok: false, erreur: "email-invalide", champ: "email", valeurs: { email: "pas-un-mail", ville: "", telephone: "", beta: false, ambassadeur: false } });
  assert.equal(ecrireMessageInscription(refus, TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE.en), "Oops, that email address doesn't look right.");
  assert.equal(ecrireMessageInscription(refus, TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE.fr), "Oups, cette adresse e-mail ne semble pas valide.");
  assert.deepEqual(await envoyer({ email: "a@b.fr", beta: "oui" }), {
    ok: false, erreur: "telephone-requis", champ: "telephone", valeurs: { email: "a@b.fr", ville: "", telephone: "", beta: true, ambassadeur: false },
  });
  assert.equal(inscriptions, 0);

  const reussite = await envoyer({ email: "a@b.fr", ville: "le havre", ambassadeur: "oui" });
  assert.deepEqual(reussite, { ok: true, lieu: { nom: "Le Havre", ou: "au Havre" }, beta: false, ambassadeur: true });
  assert.equal(inscriptions, 1);
  assert.equal(
    ecrireMessageInscription(reussite, TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE.en),
    "Nearly there! A confirmation link is waiting in your inbox (have a look in your spam too): one click, and we'll let you know as soon as SOS Miam arrives in Le Havre. 🛟 We'll also email you an invitation to the ambassador area (18+). 🎖️",
  );
  assert.match(ecrireMessageInscription(reussite, TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE.fr), /arrive au Havre\. 🛟 On t'écrira aussi/);
  assert.match(ecrireMessageInscription({ ok: true, lieu: null, beta: false, ambassadeur: false }, TEXTES_INSCRIPTION_NEWSLETTER_PAR_LANGUE.en), /arrives near you\./);
});

test("paliers : les autres pages lisent toujours le français, seuils compris", () => {
  assert.deepEqual(
    paliersAmbassadeurs.map(({ titre, seuil, sombre }) => [titre, seuil, sombre]),
    [
      ["Curieux", "0 point", false],
      ["Dénicheur", "100 points", false],
      ["Ambassadeur de quartier", "300 points", false],
      ["Ambassadeur de ville", "Nommé par l'équipe", true],
    ],
  );
});
