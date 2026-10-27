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

const BANNIERE = "/app/lieux/images/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
const LOGO = "/app/lieux/images/7c9e6679-7425-40de-944b-e07fc1f90ae7.png";

const BASE = {
  adresse: "3 rue du Port", emoji: "🛟", quartier: "Le Port", ville: "Montpellier", horaires: null, texte: null, prix: "€€", couleurs: [], decouvertPar: null,
  telephone: null, siteWeb: null, instagram: null, animaux: null, accessible: null, terrasse: null, wifi: null, enfants: null, parking: null, paiements: [],
  reservation: null, carte: null, carteMajLe: null, source: null, position: null, sos: null, ouverture: [], etiquettes: [], autour: [],
};

const LIEUX: Record<number, object> = {
  18: { ...BASE, id: 18, nom: "Restaurant du Capitaine Bouiboui", type: "resto", info: "Bistrot de la mer", estVerifie: true, banniere: BANNIERE, logo: LOGO },
  30: { ...BASE, id: 30, nom: "La Pâtisserie du Phare", type: "patisserie", info: "Pâtisserie", estVerifie: true, banniere: null, logo: LOGO },
  19: { ...BASE, id: 19, nom: "Le Quai des Brumes", type: "resto", info: "Restaurant", estVerifie: false, banniere: BANNIERE, logo: LOGO },
  50: { ...BASE, id: 50, nom: "Le Vertigo", type: "bar", emoji: "🍷", info: "Bar à vin", estVerifie: true, banniere: null, logo: null },
};

type Recu = { corps: unknown; ip: string | undefined; type: string | undefined };
let apiEnPanne = false;
let reponseSignalement: { statut: number; corps: unknown } = { statut: 201, corps: { ok: true } };
const recus: Recu[] = [];
const serveur = createServer((requete, reponse) => {
  const chemin = requete.url ?? "";
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (requete.method === "POST" && chemin === "/signalements") {
    let texte = "";
    requete.on("data", (morceau: Buffer) => (texte += morceau.toString("utf8")));
    requete.on("end", () => {
      recus.push({ corps: JSON.parse(texte), ip: requete.headers["x-ip-visiteur"] as string | undefined, type: requete.headers["content-type"] });
      repondre(reponseSignalement.statut, reponseSignalement.corps);
    });
    return;
  }
  if (apiEnPanne) return repondre(500, { ok: false, erreur: "erreur-serveur" });
  const id = /^\/lieux\/(?:site|publics)\/(\d+)$/.exec(chemin)?.[1];
  const lieu = id === undefined ? undefined : LIEUX[Number(id)];
  if (lieu) return repondre(200, { ok: true, lieu });
  repondre(404, { ok: false, erreur: id === undefined ? "introuvable" : "lieu-inconnu" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  apiEnPanne = false;
  reponseSignalement = { statut: 201, corps: { ok: true } };
  recus.length = 0;
});

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useActionData, useLoaderData, useParams } = await import("react-router");
const pageFiche = await import("../src/routes/public/fiche-lieu.tsx");
const pageSignaler = await import("../src/routes/public/signaler-image.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");
const { default: routes } = await import("../src/routes.ts");
const { lireFormulaireSignalerImage } = await import("../src/fonctions/lieux/lire-formulaire-signaler-image.ts");
const { listerImagesSignalables } = await import("../src/fonctions/lieux/lister-images-signalables.ts");
const { RAISONS_SIGNALER_IMAGE, TEXTES_SIGNALER_IMAGE } = await import("../src/contenus/signaler-image.ts");
const { RAISONS_SIGNALEMENT } = await import("../../../packages/commun/src/types/signalement.ts");
const { MESSAGES_SERVICE } = await import("../../../packages/commun/src/contenus/messages-services.ts");

type Module = { default: (props: never) => unknown };
const avecDonnees = (module: Module) => () =>
  h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: useParams(), matches: [] } as never);

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: MiseEnPagePublique,
    children: [
      { id: "fiche", path: "lieux/:id", loader: pageFiche.loader as never, Component: avecDonnees(pageFiche as Module) },
      { id: "signaler", path: "lieux/:id/signaler-image", loader: pageSignaler.loader as never, action: pageSignaler.action as never, Component: avecDonnees(pageSignaler as Module) },
    ],
  },
]);

const IP = "203.0.113.9";
const T = TEXTES_SIGNALER_IMAGE;
const nettoyer = (html: string) => html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const sansEspaces = (texte: string | undefined) => texte?.replace(/[  ]/g, " ");

async function interroger(adresse: string, champs?: Record<string, string>) {
  const reglages: RequestInit = champs ? { method: "POST", body: new URLSearchParams(champs), headers: { "x-real-ip": IP } } : { headers: { "x-real-ip": IP } };
  const contexte = await handler.query(new Request(`https://sosmiam.fr${adresse}`, reglages));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  return contexte;
}

async function servir(adresse: string, champs?: Record<string, string>) {
  const contexte = await interroger(adresse, champs);
  assert.equal(contexte.statusCode, 200, adresse);
  const routeur = createStaticRouter(handler.dataRoutes, contexte);
  return nettoyer(renderToString(h(StaticRouterProvider, { router: routeur, context: contexte, hydrate: false })));
}

function trouverBalise(html: string, nom: string, attributs: Record<string, string>): string | undefined {
  return html.match(new RegExp(`<${nom}\\b[^>]*>`, "g"))?.find((balise) => Object.entries(attributs).every(([cle, valeur]) => balise.includes(` ${cle}="${valeur}"`)));
}

function remplir(champs: Record<string, string>): FormData {
  const formulaire = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) formulaire.append(cle, valeur);
  return formulaire;
}

test("contenus : les mêmes raisons que packages/commun, chaque précision de 80 caractères au plus", () => {
  assert.deepEqual(RAISONS_SIGNALER_IMAGE.map((raison) => raison.cle), [...RAISONS_SIGNALEMENT]);
  for (const raison of RAISONS_SIGNALER_IMAGE) {
    for (const precision of raison.precisions) assert.ok(precision.length <= 80, precision);
    assert.equal(new Set(raison.precisions).size, raison.precisions.length, raison.cle);
  }
  assert.deepEqual(RAISONS_SIGNALER_IMAGE.find((raison) => raison.cle === "autre")?.precisions, []);
});

test("listerImagesSignalables : seulement un lieu vérifié, et seulement les images qu'il a", () => {
  assert.deepEqual(listerImagesSignalables({ estVerifie: true, banniere: BANNIERE, logo: LOGO }), ["banniere", "logo"]);
  assert.deepEqual(listerImagesSignalables({ estVerifie: true, banniere: null, logo: LOGO }), ["logo"]);
  assert.deepEqual(listerImagesSignalables({ estVerifie: true, banniere: BANNIERE }), ["banniere"]);
  assert.deepEqual(listerImagesSignalables({ estVerifie: true, banniere: null, logo: null }), []);
  assert.deepEqual(listerImagesSignalables({ estVerifie: false, banniere: BANNIERE, logo: LOGO }), []);
});

test("lireFormulaireSignalerImage : un signalement valable, texte nettoyé, précision de la raison choisie", () => {
  const lecture = lireFormulaireSignalerImage(remplir({
    quelle: "logo", raison: "danger", "precision-danger": "Arme", "precision-haine": "Menaces",
    explication: "  Une arme en photo\r\nsur le logo  ", site_web: "",
  }), 18);
  assert.ok(lecture.ok);
  assert.deepEqual(lecture.signalement, { cible: "image-lieu", lieuId: 18, quelle: "logo", raison: "danger", precision: "Arme", explication: "Une arme en photo\nsur le logo" });
  assert.equal(lecture.piege, "");
});

test("lireFormulaireSignalerImage : précision d'une autre raison ou inventée oubliée, explication facultative", () => {
  const autreRaison = lireFormulaireSignalerImage(remplir({ quelle: "banniere", raison: "haine", "precision-danger": "Arme" }), 7);
  assert.ok(autreRaison.ok);
  assert.equal(autreRaison.signalement.precision, null);
  assert.equal(autreRaison.signalement.explication, "");
  const inventee = lireFormulaireSignalerImage(remplir({ quelle: "banniere", raison: "haine", "precision-haine": "x".repeat(81) }), 7);
  assert.ok(inventee.ok);
  assert.equal(inventee.signalement.precision, null);
});

test("lireFormulaireSignalerImage : « Autre chose » demande 10 caractères ; 500 au plus partout", () => {
  const court = lireFormulaireSignalerImage(remplir({ quelle: "logo", raison: "autre", explication: " 123456789 " }), 18);
  assert.ok(!court.ok);
  assert.deepEqual(Object.keys(court.erreurs), ["explication"]);
  assert.equal(sansEspaces(court.erreurs.explication), T.erreurs.explicationCourte);
  assert.ok(lireFormulaireSignalerImage(remplir({ quelle: "logo", raison: "autre", explication: "1234567890" }), 18).ok);
  assert.ok(lireFormulaireSignalerImage(remplir({ quelle: "logo", raison: "choquant", explication: "é".repeat(500) }), 18).ok);
  const long = lireFormulaireSignalerImage(remplir({ quelle: "logo", raison: "choquant", explication: "é".repeat(501) }), 18);
  assert.ok(!long.ok);
  assert.equal(sansEspaces(long.erreurs.explication), T.erreurs.explicationLongue);
});

test("lireFormulaireSignalerImage : image et raison manquantes ou inconnues, valeurs gardées, piège rendu", () => {
  const vide = lireFormulaireSignalerImage(remplir({ quelle: "photo", raison: "pas-une-raison", explication: "Bonjour" }), 18);
  assert.ok(!vide.ok);
  assert.deepEqual(Object.keys(vide.erreurs).sort(), ["quelle", "raison"]);
  assert.deepEqual(vide.valeurs, { quelle: "photo", raison: "", precision: "", explication: "Bonjour" });
  const robot = lireFormulaireSignalerImage(remplir({ quelle: "logo", raison: "arnaque", site_web: "https://robot.example" }), 18);
  assert.ok(robot.ok);
  assert.equal(robot.piege, "https://robot.example");
});

test("page : les deux images au choix avec leur vignette, les raisons, l'explication, le champ piège caché, noindex", async () => {
  const html = await servir("/lieux/18/signaler-image");
  assert.match(html, /<h1[^>]*>Signaler une image<\/h1>/);
  assert.match(html, /<form[^>]*method="post"/);
  assert.match(html, /href="\/lieux\/18"[^>]*>.*Retour à la fiche de Restaurant du Capitaine Bouiboui/);
  assert.match(html, /Quelle image tu signales \?/);
  for (const quelle of ["banniere", "logo"]) assert.ok(trouverBalise(html, "input", { type: "radio", name: "quelle", value: quelle }), quelle);
  assert.equal(trouverBalise(html, "input", { name: "quelle", checked: "" }), undefined, "aucune image choisie d'avance");
  assert.match(html, new RegExp(`<img src="${BANNIERE}" alt=""`));
  assert.match(html, new RegExp(`<img src="${LOGO}" alt=""`));
  for (const raison of RAISONS_SIGNALER_IMAGE) {
    assert.ok(trouverBalise(html, "input", { type: "radio", name: "raison", value: raison.cle }), raison.cle);
    for (const precision of raison.precisions) assert.ok(html.includes(`name="precision-${raison.cle}" value="${precision}"`), precision);
  }
  assert.ok(trouverBalise(html, "textarea", { name: "explication", maxLength: "500" }));
  assert.match(html, /<div aria-hidden="true" class="absolute -left-\[9999px\][^"]*"><label[^>]*>Ne remplis pas ce champ<\/label><input[^>]*>/);
  assert.ok(trouverBalise(html, "input", { type: "text", name: "site_web", tabindex: "-1", autoComplete: "off" }));
  assert.doesNotMatch(html, /🍷/);
  const robots = (balises: { name?: string; content?: string }[]) => balises.find((balise) => balise.name === "robots")?.content;
  const contexte = await interroger("/lieux/18/signaler-image");
  const donnees = (contexte.loaderData as Record<string, unknown>).signaler;
  assert.equal(robots(pageSignaler.meta({ loaderData: donnees } as never) as never), "noindex");
  assert.equal(robots(pageSignaler.meta({ loaderData: undefined } as never) as never), "noindex");
  assert.deepEqual(pageSignaler.headers(), { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" });
});

test("page : une seule image (le logo) : pas de choix, l'image est envoyée d'office", async () => {
  const html = await servir("/lieux/30/signaler-image");
  assert.ok(trouverBalise(html, "input", { type: "hidden", name: "quelle", value: "logo" }));
  assert.doesNotMatch(html, /name="quelle" value="banniere"|type="radio" name="quelle"/);
  assert.match(html, /Tu signales le logo/);
});

test("page : 404 pour un lieu non vérifié, sans image, inconnu ou une adresse mal écrite ; 503 si l'API ne répond pas", async () => {
  for (const adresse of ["/lieux/19/signaler-image", "/lieux/50/signaler-image", "/lieux/777/signaler-image", "/lieux/abc/signaler-image"]) {
    assert.equal((await interroger(adresse)).statusCode, 404, adresse);
  }
  apiEnPanne = true;
  assert.equal((await interroger("/lieux/18/signaler-image")).statusCode, 503);
});

test("envoi : le corps exact à l'API (POST /signalements, X-IP-Visiteur), puis « Merci » et le retour à la fiche", async () => {
  const html = await servir("/lieux/18/signaler-image", {
    quelle: "banniere", raison: "vie-privee", "precision-vie-privee": "J'apparais sans mon accord",
    explication: "C'est moi au premier plan, je n'ai jamais dit oui.", site_web: "",
  });
  assert.equal(recus.length, 1);
  assert.deepEqual(recus[0]?.corps, {
    cible: "image-lieu", lieuId: 18, quelle: "banniere", raison: "vie-privee", precision: "J'apparais sans mon accord",
    explication: "C'est moi au premier plan, je n'ai jamais dit oui.", source: "site",
  });
  assert.deepEqual(Object.keys(recus[0]?.corps as object), ["cible", "lieuId", "quelle", "raison", "precision", "explication", "source"]);
  assert.equal(recus[0]?.ip, IP);
  assert.match(recus[0]?.type ?? "", /^application\/json/);
  assert.match(html, /<h1[^>]*>Merci, l'équipe va regarder<\/h1>/);
  assert.match(html, /href="\/lieux\/18"[^>]*>Retour à la fiche<span class="sr-only"> de Restaurant du Capitaine Bouiboui<\/span>/);
  assert.doesNotMatch(html, /<form/);
});

test("envoi : champ piège rempli, rien ne part à l'API mais le robot voit « Merci »", async () => {
  const html = await servir("/lieux/18/signaler-image", { quelle: "logo", raison: "arnaque", explication: "", site_web: "https://robot.example" });
  assert.equal(recus.length, 0);
  assert.match(html, /Merci, l'équipe va regarder/);
});

test("envoi refusé par le site : rien ne part, les erreurs sous leur champ et les choix gardés", async () => {
  const html = await servir("/lieux/18/signaler-image", { quelle: "logo", raison: "autre", explication: "Bof", site_web: "" });
  assert.equal(recus.length, 0);
  assert.match(html, /Un point à revoir avant d'envoyer\./);
  assert.match(html, /id="signaler-explication-erreur"[^>]*>Pour « Autre chose », dis-nous en quelques mots/);
  assert.match(html, /<textarea[^>]*aria-invalid="true"[^>]*>Bof<\/textarea>/);
  assert.ok(trouverBalise(html, "input", { name: "quelle", value: "logo", checked: "" }));
  assert.ok(trouverBalise(html, "input", { name: "raison", value: "autre", checked: "" }));
  const deux = await servir("/lieux/18/signaler-image", { explication: "", site_web: "" });
  assert.match(deux, /2 points à revoir avant d'envoyer\./);
  assert.match(deux, /Choisis l'image que tu signales\./);
  assert.match(deux, /Choisis ce qui ne va pas\./);
});

test("envoi refusé par l'API : 400 « signalement-invalide », 429 et panne, chacun son message, les choix gardés", async () => {
  const champs = { quelle: "banniere", raison: "faux-lieu", "precision-faux-lieu": "L'image ne montre pas ce lieu", explication: "", site_web: "" };
  const cas: [number, unknown, string][] = [
    [400, { ok: false, erreur: "signalement-invalide" }, T.erreurs.refuse],
    [429, { ok: false, erreur: "trop-de-demandes" }, `${MESSAGES_SERVICE["trop-de-demandes"].titre} ${MESSAGES_SERVICE["trop-de-demandes"].texte}`],
    [500, { ok: false, erreur: "erreur-serveur" }, `${MESSAGES_SERVICE["erreur-serveur"].titre}. ${MESSAGES_SERVICE["erreur-serveur"].texte}`],
    [400, { ok: false, erreur: "autre-chose" }, `${MESSAGES_SERVICE["erreur-serveur"].titre}. ${MESSAGES_SERVICE["erreur-serveur"].texte}`],
  ];
  for (const [statut, corps, message] of cas) {
    reponseSignalement = { statut, corps };
    const html = await servir("/lieux/18/signaler-image", champs);
    assert.ok(html.includes(message), `${statut} : ${message}`);
    assert.doesNotMatch(html, /Merci, l'équipe va regarder/);
    assert.ok(trouverBalise(html, "input", { name: "raison", value: "faux-lieu", checked: "" }));
    assert.ok(trouverBalise(html, "input", { name: "precision-faux-lieu", value: "L'image ne montre pas ce lieu", checked: "" }));
  }
  assert.equal(recus.length, cas.length);
});

test("fiche : « Signaler une image » à côté de « Une info fausse ? », seulement pour un lieu vérifié qui a une bannière ou un logo", async () => {
  const avec = await servir("/lieux/18");
  assert.ok(trouverBalise(avec, "a", { href: "/lieux/18/signaler-image", rel: "nofollow" }));
  assert.match(avec, />Signaler une image<\/a>/);
  assert.ok(avec.indexOf("Une info fausse ? Signale-la") > 0 && avec.indexOf("Une info fausse ? Signale-la") < avec.indexOf("Signaler une image"));
  assert.ok(trouverBalise(await servir("/lieux/30"), "a", { href: "/lieux/30/signaler-image", rel: "nofollow" }));
  for (const adresse of ["/lieux/19", "/lieux/50"]) {
    const sans = await servir(adresse);
    assert.match(sans, /Une info fausse \? Signale-la/, adresse);
    assert.doesNotMatch(sans, /signaler-image|Signaler une image/, adresse);
  }
});

test("routes.ts : /lieux/:id/signaler-image dans le cadre public, avant la page introuvable, et la page se met en noindex", () => {
  const source = readFileSync(`${dossierSrc}routes.ts`, "utf8");
  assert.match(source, /route\("lieux\/:id\/signaler-image", "routes\/public\/signaler-image\.tsx"\),/);
  const publiques = (routes as { children?: { path?: string }[] }[])[0]?.children ?? [];
  assert.ok(publiques.some((route) => route.path === "lieux/:id/signaler-image"));
  assert.ok(source.indexOf("lieux/:id/signaler-image") < source.indexOf('route("*"'));
  assert.match(readFileSync(`${dossierSrc}routes/public/signaler-image.tsx`, "utf8"), /"X-Robots-Tag": "noindex"/);
});
