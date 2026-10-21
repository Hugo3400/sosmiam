import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { registerHooks } from "node:module";
import type { AddressInfo } from "node:net";
import { after, beforeEach, test } from "node:test";
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

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const DESCRIPTION = "1. Connecte-toi avec le compte A.\n2. Appelle /comptes/2 : le profil du compte B s'affiche.";

type Recue = { methode: string; chemin: string; ip: string | undefined; corps: Record<string, unknown> | null };
let tableau: { statut: number; corps: unknown } = { statut: 200, corps: { ok: true, entrees: [] } };
let reponseSignalement: { statut: number; corps: unknown } = { statut: 201, corps: { ok: true } };
const recues: Recue[] = [];

const serveur = createServer(async (requete, reponse) => {
  let texte = "";
  for await (const morceau of requete) texte += morceau;
  const chemin = requete.url ?? "";
  recues.push({ methode: requete.method ?? "", chemin, ip: requete.headers["x-ip-visiteur"] as string | undefined, corps: texte ? JSON.parse(texte) : null });
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (chemin === "/securite/tableau-honneur" && requete.method === "GET") return repondre(tableau.statut, tableau.corps);
  if (chemin === "/securite/signalements" && requete.method === "POST") return repondre(reponseSignalement.statut, reponseSignalement.corps);
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  tableau = { statut: 200, corps: { ok: true, entrees: [] } };
  reponseSignalement = { statut: 201, corps: { ok: true } };
  recues.length = 0;
});

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useActionData, useLoaderData, useParams } = await import("react-router");
const service = await import("../src/services/securite.server.ts");
const page = await import("../src/routes/public/securite.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");
const { loader: planDuSite } = await import("../src/routes/ressources/plan-du-site.ts");
const { groupesPiedDePage } = await import("../src/contenus/liens-pied-de-page.ts");
const { PROMESSE_BONNE_FOI } = await import("../src/contenus/securite.ts");

const avecDonnees = () => h(page.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: useParams(), matches: [] } as never);

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: MiseEnPagePublique,
    children: [{ id: "securite", path: "securite", loader: page.loader as never, action: page.action as never, Component: avecDonnees }],
  },
]);

async function servir(adresse: string, init?: RequestInit) {
  const contexte = await handler.query(new Request(`https://sosmiam.fr${adresse}`, { ...init, headers: { "x-real-ip": "203.0.113.9", ...init?.headers } }));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  const routeur = createStaticRouter(handler.dataRoutes, contexte);
  const html = renderToString(h(StaticRouterProvider, { router: routeur, context: contexte, hydrate: false }));
  return { statut: contexte.statusCode, html: html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') };
}

function signalement(champs: Record<string, string | File> = {}): FormData {
  const formulaire = new FormData();
  const valeurs = {
    nom: "Léa", email: "lea@exemple.fr", cible: "api", titre: "IDOR sur les profils", description: DESCRIPTION,
    lien: "", nomTableauHonneur: "", majeur: "oui", reglesAcceptees: "oui", site_web: "", ...champs,
  };
  for (const [cle, valeur] of Object.entries(valeurs)) formulaire.append(cle, valeur);
  if (!("images" in champs)) formulaire.append("images", new File([], "", { type: "application/octet-stream" }));
  return formulaire;
}

const envoiAPI = () => recues.find((recue) => recue.methode === "POST");

test("service : tableau d'honneur lu à l'API avec l'IP du visiteur ; lignes bizarres écartées ; panne → null", async () => {
  tableau = { statut: 200, corps: { ok: true, entrees: [{ nom: "Léa", mois: "2026-10" }, { nom: "", mois: "2026-10" }, { nom: "Sam", mois: "octobre" }, null, { nom: " Zoé ", mois: "2026-09" }] } };
  assert.deepEqual(await service.listerTableauHonneur("203.0.113.7"), [{ nom: "Léa", mois: "2026-10" }, { nom: "Zoé", mois: "2026-09" }]);
  assert.equal(recues.at(-1)?.ip, "203.0.113.7");
  tableau = { statut: 500, corps: { ok: false, erreur: "erreur-serveur" } };
  assert.equal(await service.listerTableauHonneur(null), null);
});

test("service : chaque réponse de l'API à un signalement a son code", async () => {
  const envoi = {
    nom: "Léa", email: "lea@exemple.fr", cible: "site" as const, titre: "XSS stockée", description: DESCRIPTION, lien: null,
    majeur: true as const, reglesAcceptees: true as const, nomTableauHonneur: null, images: [],
  };
  const attendus: [number, unknown, unknown][] = [
    [201, { ok: true }, { ok: true }],
    [400, { ok: false, erreur: "champ-invalide", champ: "titre" }, { ok: false, erreur: "champ-invalide", champ: "titre" }],
    [400, { ok: false, erreur: "trop-d-images" }, { ok: false, erreur: "trop-d-images" }],
    [413, { ok: false, erreur: "image-trop-lourde" }, { ok: false, erreur: "image-trop-lourde" }],
    [413, null, { ok: false, erreur: "image-trop-lourde" }],
    [415, { ok: false, erreur: "image-format" }, { ok: false, erreur: "image-format" }],
    [429, { ok: false, erreur: "trop-de-demandes" }, { ok: false, erreur: "trop-de-demandes" }],
    [503, { ok: false, erreur: "chiffrement-indisponible" }, { ok: false, erreur: "chiffrement-indisponible" }],
    [503, { ok: false, erreur: "stockage-plein" }, { ok: false, erreur: "stockage-plein" }],
    [404, { ok: false, erreur: "introuvable" }, { ok: false, erreur: "erreur-serveur" }],
    [500, { ok: false }, { ok: false, erreur: "erreur-serveur" }],
  ];
  for (const [statut, corps, resultat] of attendus) {
    reponseSignalement = { statut, corps };
    assert.deepEqual(await service.envoyerSignalementSecurite(envoi, "", "203.0.113.7"), resultat, `${statut} ${JSON.stringify(corps)}`);
  }
  assert.deepEqual(recues.at(-1)?.corps, { ...envoi, site_web: "" });
  assert.equal(recues.at(-1)?.chemin, "/securite/signalements");
  assert.equal(recues.at(-1)?.ip, "203.0.113.7");
});

test("/securite : titre, périmètre, règles, engagements, récompenses, lien canonique et rien en noindex", async () => {
  const { statut, html } = await servir("/securite");
  assert.equal(statut, 200);
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam.fr\/securite"\/>/);
  assert.doesNotMatch(html, /noindex/);
  assert.match(html, /<h1[^>]*>Chasse aux bugs<span aria-hidden="true"> 🐞<\/span><\/h1>/);
  assert.match(html, /Dis-le-nous avant les petits malins : on la corrige, et on te remercie\./);
  for (const domaine of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr", "api.sosmiam.fr"]) assert.match(html, new RegExp(`<strong[^>]*>${domaine}</strong>`));
  assert.match(html, /Le logiciel de gestion de l'équipe\./);
  assert.match(html, /Tout autre site ou service présent sur la même machine/);
  assert.match(html, /Pas de déni de service/);
  assert.match(html, /self-XSS/);
  assert.match(html, /On te répond sous 7 jours/);
  assert.match(html, /90 jours après ton signalement si rien n'a été fait, en nous prévenant avant/);
  assert.ok(html.includes(PROMESSE_BONNE_FOI));
  assert.equal(PROMESSE_BONNE_FOI, "Si tu respectes ces règles et agis de bonne foi, on considère ta recherche comme autorisée et on ne portera pas plainte contre toi.");
  assert.match(html, /Chasseur de bugs/);
  assert.match(html, /pas de montant affiché, et rien de garanti/);
  assert.match(html, /c'est le premier signalement qui compte/);
  assert.doesNotMatch(html, /\d+ ?(€|euros)/);
  const meta = page.meta({} as never);
  assert.equal(meta[0]?.title, "Chasse aux bugs : signale une faille de sécurité — SOS Miam");
  assert.ok(!meta.some((balise) => "name" in balise && balise.name === "robots"));
});

test("/securite : tableau d'honneur vide (place qui t'attend), rempli (mois en lettres), ou API en panne (la page s'affiche quand même)", async () => {
  let rendu = await servir("/securite");
  assert.match(rendu.html, /id="tableau-d-honneur"/);
  assert.match(rendu.html, /La première place t'attend !/);
  tableau = { statut: 200, corps: { ok: true, entrees: [{ nom: "Léa <b>", mois: "2026-10" }] } };
  rendu = await servir("/securite");
  assert.match(rendu.html, /Léa &lt;b&gt;<\/strong><span[^>]*>octobre 2026<\/span>/);
  tableau = { statut: 500, corps: { ok: false } };
  rendu = await servir("/securite");
  assert.equal(rendu.statut, 200);
  assert.match(rendu.html, /Le tableau d'honneur fait une petite sieste/);
  assert.match(rendu.html, /id="signaler"/);
});

test("/securite : le formulaire marche sans JavaScript, champs reliés à leurs libellés, captures PNG ou JPEG", async () => {
  const { html } = await servir("/securite");
  const formulaire = html.match(/<form [^>]*>/)?.[0] ?? "";
  assert.match(formulaire, /\baction="\/securite#signaler"/);
  assert.match(formulaire, /\bmethod="post"/);
  assert.match(formulaire, /\benctype="multipart\/form-data"/i);
  const champ = (nom: string) => html.match(new RegExp(`<(input|select|textarea) [^>]*name="${nom}"[^>]*>`))?.[0] ?? "";
  for (const nom of ["nom", "email", "cible", "titre", "description", "lien", "images", "nomTableauHonneur"]) {
    assert.match(html, new RegExp(`<label for="signalement-${nom}"`), nom);
    assert.match(champ(nom), new RegExp(`id="signalement-${nom}"`), nom);
  }
  assert.match(champ("images"), /type="file"/);
  assert.match(champ("images"), /multiple=""/);
  assert.match(champ("images"), /accept="image\/png,image\/jpeg"/);
  for (const nom of ["majeur", "reglesAcceptees", "tableauHonneur"]) assert.match(champ(nom), /type="checkbox"/, nom);
  assert.match(champ("majeur"), /required=""/);
  assert.match(champ("reglesAcceptees"), /required=""/);
  assert.match(champ("site_web"), /tabindex="-1"/i);
  for (const cible of ["site", "espaces", "api", "app-ios", "app-android"]) assert.match(html, new RegExp(`<option value="${cible}"`));
  assert.match(html, /href="\/confidentialite#chasse-aux-bugs"/);
  assert.match(html, /effacé 2 ans après sa clôture/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>[^<]/);
  assert.doesNotMatch(html, / style="/);
});

test("envoi sans JavaScript : captures en base64, tableau d'honneur, piège et IP partent à l'API, puis l'écran merci", async () => {
  const corps = signalement({ lien: "exemple.fr/poc", tableauHonneur: "oui", nomTableauHonneur: "Léa", site_web: "robot", images: new File([PNG], "poc.png", { type: "image/png" }) });
  const { statut, html } = await servir("/securite", { method: "POST", body: corps });
  assert.equal(statut, 200);
  assert.match(html, /Merci, c'est bien arrivé !/);
  assert.match(html, /On te répond sous 7 jours/);
  assert.match(html, /garde la faille pour toi 🤫/);
  const envoi = envoiAPI();
  assert.equal(envoi?.chemin, "/securite/signalements");
  assert.equal(envoi?.ip, "203.0.113.9");
  assert.deepEqual(envoi?.corps, {
    nom: "Léa", email: "lea@exemple.fr", cible: "api", titre: "IDOR sur les profils", description: DESCRIPTION, lien: "https://exemple.fr/poc",
    majeur: true, reglesAcceptees: true, nomTableauHonneur: "Léa", images: [{ nomFichier: "poc.png", base64: Buffer.from(PNG).toString("base64") }], site_web: "robot",
  });
});

test("envoi refusé par le site : rien ne part, erreurs reliées aux champs, valeurs remises, captures à rajouter", async () => {
  const corps = signalement({ email: "lea@", majeur: "", reglesAcceptees: "", images: new File(["GIF89a"], "anim.gif", { type: "image/gif" }) });
  const { html } = await servir("/securite", { method: "POST", body: corps });
  assert.ok(!envoiAPI(), "aucun envoi à l'API");
  assert.match(html, /4 champs sont à corriger\./);
  assert.match(html, /<input [^>]*id="signalement-email"[^>]*aria-invalid="true"[^>]*aria-describedby="signalement-email-aide signalement-email-erreur"/);
  assert.match(html, /id="signalement-images-erreur"[^>]*>Seulement des images PNG ou JPEG\./);
  assert.match(html, /<input [^>]*id="signalement-majeur"[^>]*aria-invalid="true"[^>]*aria-describedby="signalement-majeur-erreur"/);
  assert.match(html, /id="signalement-reglesAcceptees-erreur"[^>]*>Coche la case/);
  assert.match(html, /<input [^>]*name="titre"[^>]*value="IDOR sur les profils"/);
  assert.match(html, /<option value="api" selected="">/);
  assert.match(html, /ton navigateur a oublié les captures choisies/);
});

test("envoi refusé par l'API : champ invalide sur son champ, captures, trop d'envois et coffre fermé avec MESSAGES_SERVICE", async () => {
  reponseSignalement = { statut: 400, corps: { ok: false, erreur: "champ-invalide", champ: "nomTableauHonneur" } };
  let rendu = await servir("/securite", { method: "POST", body: signalement({ tableauHonneur: "oui", nomTableauHonneur: "Léa" }) });
  assert.match(rendu.html, /id="signalement-nomTableauHonneur-erreur"[^>]*>Donne le nom à afficher/);
  assert.match(rendu.html, /Une info ne va pas\. Jette un œil au champ indiqué/);
  reponseSignalement = { statut: 413, corps: { ok: false, erreur: "image-trop-lourde" } };
  rendu = await servir("/securite", { method: "POST", body: signalement() });
  assert.match(rendu.html, /id="signalement-images-erreur"[^>]*>Une capture est un peu lourde\./);
  reponseSignalement = { statut: 429, corps: { ok: false, erreur: "trop-de-demandes" } };
  rendu = await servir("/securite", { method: "POST", body: signalement() });
  assert.match(rendu.html, /Doucement ! Beaucoup d'essais d'un coup/);
  reponseSignalement = { statut: 503, corps: { ok: false, erreur: "chiffrement-indisponible" } };
  rendu = await servir("/securite", { method: "POST", body: signalement() });
  assert.match(rendu.html, /Coffre-fort fermé\./);
  assert.match(rendu.html, /<textarea [^>]*name="description"[^>]*>1\. Connecte-toi/);
});

test("envoi trop lourd annoncé (Content-Length) : refusé avant d'être lu", async () => {
  const requete = new Request("https://sosmiam.fr/securite", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=xyz", "content-length": String(20 * 1024 * 1024) },
    body: "--xyz--",
  });
  const reponse = await page.action({ request: requete, params: {} } as never);
  assert.equal(reponse.ok, false);
  assert.ok(!reponse.ok && reponse.erreurs?.images?.startsWith("Une capture est un peu lourde"));
  assert.ok(!envoiAPI());
});

test("branchements : pied de page, plan du site, route de la page", async () => {
  const liens = groupesPiedDePage.flatMap((groupe) => groupe.liens);
  assert.ok(liens.some((lien) => lien.texte === "Chasse aux bugs" && lien.adresse === "/securite" && lien.site === "principal"));
  const xml = await (await planDuSite({ request: new Request("https://sosmiam.fr/sitemap.xml") } as never)).text();
  assert.match(xml, /<loc>https:\/\/sosmiam.fr\/securite<\/loc>/);
  assert.match(readFileSync(`${dossierSrc}routes.ts`, "utf8"), /route\("securite", "routes\/public\/securite\.tsx"\)/);
});
