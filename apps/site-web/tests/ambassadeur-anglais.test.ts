import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { registerHooks } from "node:module";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

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

const ISO = "2026-10-01T10:00:00.000Z";
const zoneLyon = { code: "69123", type: "ville", nom: "Lyon", nomAvecDe: "de Lyon", places: 10, prises: 3, libres: 7 };
const lyon = { code: "69123", nom: "Lyon", nomDepartement: "Rhône", codeDepartement: "69", population: 520000 };
const compte = {
  prenom: "Léa", email: "lea@exemple.fr", points: 40, palier: "curieux", badges: [], creeLe: ISO, emailVerifie: true,
  ambassadeur: { statut: "actif", ville: "Lyon", quartier: null, decideLe: ISO, certifie: null },
};
const candidature = { statut: "acceptee", numero: 3, numeroLocal: 3, numeroNational: 147, commune: { code: "69123", nom: "Lyon", nomDepartement: "Rhône" }, zone: zoneLyon, creeLe: ISO, reponduLe: ISO };

const serveur = createServer((requete, reponse) => {
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  const adresse = new URL(requete.url ?? "", "http://api");
  if (adresse.pathname === "/comptes/session") return repondre(200, { ok: true, compte });
  if (adresse.pathname === "/comptes/moi/propositions") return repondre(200, { ok: true, propositions: [{ id: 1, nom: "Chez Nonna", ville: "Lyon", statut: "acceptee", creeLe: ISO }] });
  if (adresse.pathname === "/comptes/moi/candidature") return repondre(200, { ok: true, candidature, placesRestantes: 120 });
  if (adresse.pathname === "/comptes/moi/certification") return repondre(200, { ok: true, certifie: null, candidature: null });
  if (adresse.pathname === "/espace-ambassadeur/missions") return repondre(200, { ok: true, missions: [{ id: 1, titre: "Photos", detail: "", echeance: null, statut: "a-faire", compteRendu: null, creeLe: ISO, faiteLe: null, lieu: null }] });
  if (adresse.pathname === "/espace-ambassadeur/messages") return repondre(200, { ok: true, messages: [{ id: 1, titre: "Bienvenue", texte: "Salut !", creeLe: ISO, luLe: null }] });
  if (adresse.pathname === "/communes") return repondre(200, { ok: true, communes: adresse.searchParams.get("recherche") === "Lyon" ? [lyon] : [] });
  if (adresse.pathname === "/fondateurs/zone") return repondre(200, { ok: true, commune: lyon, zone: zoneLyon });
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
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useActionData, useLoaderData } = await import("react-router");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const { cookieSession } = await import("../src/services/session-compte.server.ts");
const programme = await import("../src/routes/ambassadeur/programme.tsx");
const espace = await import("../src/routes/ambassadeur/espace.tsx");
const missions = await import("../src/routes/ambassadeur/missions.tsx");

type Module = { default: (props: never) => unknown; loader?: unknown; action?: unknown };
const page = (id: string, path: string, module: Module) => ({
  id, path, loader: module.loader as never, action: module.action as never,
  Component: () => h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: {}, matches: [] } as never),
});
const handler = createStaticHandler([
  page("en/programme", "/en/programme", programme as Module),
  page("programme", "/programme", programme as Module),
  page("espace", "/espace", espace as Module),
  page("missions", "/espace/missions", missions as Module),
]);

const session = (await cookieSession.serialize("j".repeat(40))).split(";")[0];

async function servir(adresse: string, langue: "fr" | "en", init: RequestInit = {}) {
  const cookie = langue === "en" ? `${session}; sosmiam-langue=en` : session;
  const contexte = await handler.query(new Request(`https://apercu.sosmiam.fr${adresse}`, { ...init, headers: { cookie, "x-real-ip": "203.0.113.9" } }));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  const routeur = createStaticRouter(handler.dataRoutes, contexte);
  const html = renderToString(h(ContexteLangue, { value: { langue, servies: ["fr", "en"] } }, h(StaticRouterProvider, { router: routeur, context: contexte, hydrate: false })));
  return html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/[\u00a0\u202f]/g, " ");
}

const metaDe = (module: { meta: (args: never) => unknown }, langue: string) =>
  module.meta({ matches: [{ id: "root", loaderData: { langue } }] } as never) as Record<string, string>[];

test("/en/programme : meta, textes, paliers, barème, places de Lyon et FAQPage en anglais ; la recherche reste sous /en", async () => {
  assert.equal(metaDe(programme, "en")[0].title, "Ambassador programme — SOS Miam");
  assert.equal(metaDe(programme, "fr")[0].title, "Programme Ambassadeurs — SOS Miam");
  const html = await servir("/en/programme?ville=Lyon", "en");
  for (const texte of [
    "🎖️ Ambassador programme · 18+",
    "Become an <mark",
    "What's an ambassador?",
    "Taster</h3>",
    "City Ambassador</h3>",
    "What earns you points",
    "+15<span class=\"sr-only\"> points</span>",
    "Your city's founders",
    "Lyon: 7 spots free out of 10",
    "“Collaboration commerciale” (a paid or gifted partnership)",
    'action="/en/programme#ta-ville"',
    '"inLanguage":"en"',
    "Is it paid?",
    "I already have an account",
  ]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Deviens", "Curieux", "Ce qui rapporte", "Tes questions", "places libres", 'action="/programme#ta-ville"']) {
    assert.ok(!html.includes(francais), francais);
  }
});

test("/en/programme : un message de recherche en anglais, le français inchangé sur /programme", async () => {
  assert.ok((await servir("/en/programme?ville=zzz", "en")).includes("We can't find “zzz”. Check the spelling, or try your postcode."));
  const francais = await servir("/programme?ville=zzz", "fr");
  assert.ok(francais.includes("On ne trouve pas « zzz » : vérifie l'orthographe, ou essaie avec ton code postal."));
  assert.ok(francais.includes("Deviens <mark"));
});

test("/espace en anglais (langue négociée) : tuiles, palier, numéro de fondateur, date et propositions", async () => {
  assert.equal(metaDe(espace, "en")[0].title, "My ambassador area — SOS Miam");
  const html = await servir("/espace", "en");
  for (const texte of [
    "Hi, Léa!",
    "Your level",
    "60 more points and you're a Gem Hunter.",
    "Media kit",
    "Suggest a place",
    "You're one of the founders in Lyon! Your card's waiting for you.",
    "#3 in Lyon",
    "1 unread",
    "My suggestions",
    "Suggested on <time",
    ">1 October 2026</time>",
  ]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Salut", "Ton palier", "Proposé le", "octobre", "N° 3"]) assert.ok(!html.includes(francais), francais);
});

test("/espace/missions : l'erreur du formulaire suit la langue négociée", async () => {
  const formulaire = () => {
    const corps = new FormData();
    corps.append("missionId", "1");
    corps.append("compteRendu", "ok");
    return { method: "POST", body: corps };
  };
  assert.ok((await servir("/espace/missions", "en", formulaire())).includes("Write a few words about what you did (5 to 2,000 characters)."));
  assert.ok((await servir("/espace/missions", "fr", formulaire())).includes("Écris quelques mots sur ce que tu as fait (5 à 2000 caractères)."));
});
