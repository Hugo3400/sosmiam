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

const fiche = {
  id: 7, nom: "Chez Jo", adresse: "12 rue de la Paix", type: "resto", emoji: "🍝", info: "Trattoria", quartier: "", ville: "Montpellier",
  horaires: "Mar–sam", texte: "Des pâtes fraîches.", estVerifie: true, statut: "publie", telephone: null, siteWeb: null, instagram: null,
  animaux: "bienvenus", accessible: true, terrasse: null, wifi: null, enfants: null, parking: null, paiements: ["cb"], reservation: null,
};
const compte = {
  prenom: "Léa", email: "lea@exemple.fr", points: 0, palier: "curieux", badges: [], creeLe: "2026-10-01T10:00:00Z", emailVerifie: true, ambassadeur: null,
  pro: { lieux: [{ lieuId: 7, nom: "Chez Jo", ville: "Montpellier", role: "gerant", statut: "valide" }] },
};
const rattachement = (id: number, statut: string, role = "gerant") => ({
  id, lieuId: id + 6, nom: `Lieu ${id}`, ville: "Lyon", emoji: "🍽️", role, statut, reponse: null, creeLe: "2026-10-01T10:00:00Z", decideLe: null,
});

const reponses: Record<string, [number, unknown]> = {
  "GET /comptes/session": [200, { ok: true, compte }],
  "GET /comptes/moi/rattachements": [200, { ok: true, rattachements: [rattachement(1, "valide"), rattachement(2, "en-attente"), rattachement(3, "refuse"), rattachement(4, "en-attente", "equipe")] }],
  "POST /comptes/moi/rattachements/4/accepter": [200, { ok: true }],
  "GET /pro/lieux/7": [200, { ok: true, fiche, role: "gerant", peutModifier: true }],
  "PATCH /pro/lieux/7": [403, { ok: false, erreur: "compte-limite", details: { jusqua: "2026-11-01T09:30:00.000Z" } }],
  "GET /miam-safe/pro/lieux/7/charte": [200, { ok: true, charte: { signee: true, signeeLe: "2026-10-09T08:12:00Z", retireeParEquipe: false } }],
};
const serveur = createServer((requete, reponse) => {
  requete.resume();
  const [statut, corps] = reponses[`${requete.method} ${new URL(requete.url ?? "", "http://api").pathname}`] ?? [404, { ok: false, erreur: "introuvable" }];
  reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, Outlet, StaticRouterProvider, useActionData, useLoaderData } = await import("react-router");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const { cookieSession } = await import("../src/services/session-compte.server.ts");
const cadre = await import("../src/routes/pro/mise-en-page-pro.tsx");
const bienvenue = await import("../src/routes/pro/bienvenue.tsx");
const tableau = await import("../src/routes/pro/tableau.tsx");
const maFiche = await import("../src/routes/pro/ma-fiche.tsx");
const miamSafe = await import("../src/routes/pro/miam-safe.tsx");
const { convertirBrouillonEnCarte } = await import("../src/fonctions/carte/convertir-brouillon-en-carte.ts");
const { appliquerGesteCarte } = await import("../src/fonctions/carte/appliquer-geste-carte.ts");
const { choisirMessageImageLieu } = await import("../src/fonctions/pro/choisir-message-image-lieu.ts");
const { lireChampsFiche } = await import("../src/fonctions/pro/lire-champs-fiche.ts");
const { ecrireValeurChamp } = await import("../src/fonctions/pro/ecrire-valeur-champ.ts");

type Module = { default: unknown; loader?: unknown; action?: unknown; meta?: unknown };
const avecDonnees = (module: Module) => () => h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: {}, matches: [] } as never);
const cookie = (await cookieSession.serialize("j".repeat(43))).split(";")[0] ?? "";

function creerHandler(langue: "fr" | "en") {
  const page = (id: string, path: string, module: Module) => ({ id, path, loader: module.loader as never, action: module.action as never, Component: avecDonnees(module) });
  return createStaticHandler([
    {
      id: "root",
      path: "/",
      Component: () => h(ContexteLangue, { value: { langue, servies: ["fr", "en"] } }, h(Outlet)),
      children: [
        {
          id: "routes/pro/mise-en-page-pro",
          loader: cadre.loader as never,
          Component: avecDonnees(cadre as Module),
          children: [
            page("bienvenue", langue === "en" ? "en/bienvenue" : "bienvenue", bienvenue as Module),
            page("tableau", "tableau", tableau as Module),
            page("ma-fiche", "lieu/:id", maFiche as Module),
            page("miam-safe", "lieu/:id/miam-safe", miamSafe as Module),
          ],
        },
      ],
    },
  ]);
}

async function servir(langue: "fr" | "en", chemin: string, { connecte = true, corps }: { connecte?: boolean; corps?: Record<string, string> } = {}) {
  const handler = creerHandler(langue);
  const entetes = new Headers({ "Accept-Language": langue });
  if (connecte) entetes.set("Cookie", cookie);
  let body: FormData | undefined;
  if (corps) {
    body = new FormData();
    for (const [nom, valeur] of Object.entries(corps)) body.append(nom, valeur);
  }
  const contexte = await handler.query(new Request(`https://pro.localhost${chemin}`, { method: corps ? "POST" : "GET", body, headers: entetes }));
  assert.ok(!(contexte instanceof Response), chemin);
  assert.equal(contexte.statusCode, 200, chemin);
  const html = renderToString(h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false }));
  return html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

const metaDe = (module: Module, langue: string, loaderData: unknown = undefined) =>
  (module.meta as (a: unknown) => Record<string, string>[])({ loaderData, matches: [{ id: "root", loaderData: { langue } }], params: {} });

test("meta : /en/bienvenue en anglais, et les pages de l'espace dans la langue de la personne ; le français intact", () => {
  const anglais = metaDe(bienvenue, "en");
  assert.equal(anglais[0]?.title, "Pro area — SOS Miam");
  assert.match(anglais.find((balise) => balise.name === "description")?.content ?? "", /^SOS Miam pro: keep your listing up to date/);
  assert.equal(anglais.find((balise) => balise.property === "og:locale")?.content, "en_GB");
  assert.equal(metaDe(bienvenue, "fr")[0]?.title, "L'espace pro — SOS Miam");
  const lieu = { lieu: { nom: "Chez Jo" } };
  assert.equal(metaDe(maFiche, "en", lieu)[0]?.title, "My listing · Chez Jo — SOS Miam");
  assert.equal(metaDe(maFiche, "fr", lieu)[0]?.title, "Ma fiche · Chez Jo — SOS Miam");
  assert.equal(metaDe(tableau, "en")[0]?.title, "My pro dashboard — SOS Miam");
  assert.ok(metaDe(tableau, "en").some((balise) => balise.content === "noindex"));
});

test("/en/bienvenue : la page, l'en-tête et l'accroche du pied de page en anglais, les liens vers le site anglais", async () => {
  const html = await servir("en", "/en/bienvenue", { connecte: false });
  assert.match(html, /<h1[^>]*>Your venue, your listing, your foodies\.<\/h1>/);
  assert.match(html, />It's free</);
  assert.match(html, /No subscription/);
  assert.match(html, /Create your SOS Miam account \(2 minutes\)\./);
  assert.match(html, />Coming soon</);
  assert.match(html, /href="https:\/\/sosmiam\.fr\/en\/inscrire-mon-lieu"[^>]*>My venue isn't on SOS Miam</);
  assert.match(html, /aria-label="SOS Miam pro, the area for venues"[^>]*href="\/en\/bienvenue"/);
  assert.match(html, />Log in</);
  assert.match(html, /SOS Miam pro: your listing, your staff, your foodies\. Free, for good\./);
  for (const francais of [/Ton lieu, ta fiche/, /C'est gratuit/, /Sans abonnement/, /Se connecter/, /Créer mon compte/, /Comment ça marche/, /tes gourmands/]) {
    assert.doesNotMatch(html, francais);
  }
});

test("/bienvenue en français : rien n'a bougé", async () => {
  const html = await servir("fr", "/bienvenue", { connecte: false });
  assert.match(html, /<h1[^>]*>Ton lieu, ta fiche, tes gourmands\.<\/h1>/);
  assert.match(html, /href="https:\/\/sosmiam\.fr\/inscrire-mon-lieu"[^>]*>Mon lieu n'est pas sur SOS Miam</);
  assert.match(html, /SOS Miam pro\s: ta fiche, ton équipe, tes gourmands\. Gratuit, pour toujours\./);
});

test("tableau en anglais : statuts, invitations, menu ; le geste répond dans la langue négociée", async () => {
  const html = await servir("en", "/tableau");
  assert.match(html, /Hi, Léa!/);
  assert.match(html, />My venues</);
  assert.match(html, />Verified ✓</);
  assert.match(html, />Pending</);
  assert.match(html, />Declined</);
  assert.match(html, />Accept<span class="sr-only">: the invitation from Lieu 4<\/span>/);
  assert.match(html, />Suggested edits</);
  assert.match(html, />My staff</);
  assert.doesNotMatch(html, /Mes lieux|En attente|Refusé|Accepter|Ma fiche/);
  const apres = await servir("en", "/tableau", { corps: { formulaire: "rattachement", id: "4", geste: "accepter" } });
  assert.match(apres, /You're on the staff now! The venue's listing is in your list\./);
});

test("ma fiche en anglais : les champs, et le message de compte limité avec la date à l'anglaise", async () => {
  const html = await servir("en", "/lieu/7");
  assert.match(html, /<legend[^>]*>Name and address<\/legend>/);
  assert.match(html, />Save my listing</);
  assert.match(html, />Don't specify</);
  assert.match(html, /placeholder="Tue–Sat, 12:00–14:30 and 19:00–23:00"/);
  const refus = await servir("en", "/lieu/7", { corps: { formulaire: "fiche", nom: "Chez Jojo" } });
  assert.match(refus, /Nothing was sent: your account is restricted until 1 November 2026 at 10:30\./);
  assert.match(refus, /“My account”/);
});

test("Miam Safe en anglais : le bandeau de traduction de courtoisie, la charte traduite, la phrase gardée en français", async () => {
  const html = await servir("en", "/lieu/7/miam-safe");
  assert.match(html, /This is a courtesy translation\. If it differs from the French version, the French version prevails\. Only the French version is legally binding\./);
  assert.match(html, /Your venue signed the Miam Safe charter on 9 October 2026\./);
  assert.match(html, /The whole team knows the phrase and the screen/);
  assert.match(html, /“Le Capitaine est là \?” \(Is the Captain here\?\)/);
  assert.match(html, />Leave the charter</);
  const francais = await servir("fr", "/lieu/7/miam-safe");
  assert.doesNotMatch(francais, /courtesy translation/);
  assert.match(francais, /Ton lieu a signé la charte Miam Safe le 9 octobre 2026\./);
  assert.match(francais, /Toute l'équipe connaît la phrase et l'écran/);
});

test("fonctions de l'espace pro : la langue en paramètre, le français par défaut", () => {
  const brouillon = { sections: [{ titre: "", elements: [{ nom: "Tarte", description: "", prix: "", unite: "", signature: false, alcool: false, etiquettes: [] }] }] };
  const anglaise = convertirBrouillonEnCarte(brouillon, "en");
  assert.ok(!anglaise.ok);
  assert.match(Object.values(anglaise.erreurs).join(" "), /Give this section a title.*Enter a price, like 12 or 4\.50/);
  const francaise = convertirBrouillonEnCarte(brouillon);
  assert.ok(!francaise.ok);
  assert.match(Object.values(francaise.erreurs).join(" "), /Donne un titre à cette section.*Indique un prix/);
  assert.equal(appliquerGesteCarte(brouillon, "ajouter-plat:0", "en").message, "New dish added.");
  assert.equal(appliquerGesteCarte(brouillon, "ajouter-plat:0").message, "Nouveau plat ajouté.");
  assert.equal(choisirMessageImageLieu("session-expiree", null, "en").titre, "Your session has ended");
  assert.match(choisirMessageImageLieu("compte-limite", null, "en").texte, /until further notice/);
  const formulaire = new FormData();
  formulaire.append("nom", "J");
  assert.equal(lireChampsFiche(formulaire, "en").erreurs.nom, "The name must be between 2 and 80 characters.");
  assert.equal(lireChampsFiche(formulaire).erreurs.nom, "Le nom fait entre 2 et 80 caractères.");
  assert.equal(ecrireValeurChamp("paiements", ["cb", "especes"], "en"), "card, cash");
  assert.equal(ecrireValeurChamp("wifi", null, "en"), "(nothing)");
  assert.equal(ecrireValeurChamp("wifi", true), "Oui");
});
