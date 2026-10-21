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

const MODERATION = {
  id: "moderation-brigade",
  titre: "Modération avec la Brigade",
  type: "benevolat",
  domaine: "moderation",
  resume: "Garder l'app accueillante, à ton rythme.",
  description: "Tu relis ce que signalent les Miamis.\nEt tu gardes le sourire.",
  missions: ["Relire les signalements", "Accueillir les nouveaux sur le Discord"],
  profil: ["Patient·e et bienveillant·e"],
  enEchange: ["Un badge « Brigade » dans l'app"],
  lieu: "À distance, partout en France",
  publieeLe: "2026-10-21T08:00:00.000Z",
};
const GRAPHISTE = { ...MODERATION, id: "graphiste-affiches", titre: "Graphiste pour nos affiches", type: "freelance", domaine: "graphisme", publieeLe: "2026-10-20T10:00:00.000Z" };
const BIZARRES = [{ ...MODERATION, id: "../piege" }, { ...MODERATION, id: "stage", type: "stage" }, null, { ...MODERATION, id: "sans-missions", missions: "aucune" }];

type Recue = { methode: string; chemin: string; ip: string | undefined; corps: Record<string, unknown> | null };
let etat: "normal" | "vide" | "panne" = "normal";
let reponseCandidature: { statut: number; corps: unknown } = { statut: 201, corps: { ok: true } };
const recues: Recue[] = [];

const serveur = createServer(async (requete, reponse) => {
  let texte = "";
  for await (const morceau of requete) texte += morceau;
  const chemin = requete.url ?? "";
  recues.push({ methode: requete.method ?? "", chemin, ip: requete.headers["x-ip-visiteur"] as string | undefined, corps: texte ? JSON.parse(texte) : null });
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (etat === "panne") return repondre(500, { ok: false, erreur: "erreur-serveur" });
  if (chemin === "/carriere/offres") return repondre(200, { ok: true, offres: etat === "vide" ? [] : [MODERATION, GRAPHISTE, ...BIZARRES] });
  const offre = /^\/carriere\/offres\/([^/]+)$/.exec(chemin)?.[1];
  if (offre !== undefined && requete.method === "GET") {
    const trouvee = [MODERATION, GRAPHISTE].find((une) => une.id === offre);
    return trouvee ? repondre(200, { ok: true, offre: trouvee }) : repondre(404, { ok: false, erreur: "offre-inconnue" });
  }
  if (/^\/carriere\/offres\/[^/]+\/candidatures$/.test(chemin)) return repondre(reponseCandidature.statut, reponseCandidature.corps);
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  etat = "normal";
  reponseCandidature = { statut: 201, corps: { ok: true } };
  recues.length = 0;
});

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useActionData, useLoaderData, useParams, useRouteError } = await import("react-router");
const service = await import("../src/services/carriere.server.ts");
const pageListe = await import("../src/routes/public/carriere.tsx");
const pageOffre = await import("../src/routes/public/offre-carriere.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");
const { loader: planDuSite } = await import("../src/routes/ressources/plan-du-site.ts");

type Module = { default: (props: never) => unknown; ErrorBoundary?: (props: never) => unknown };
const avecDonnees = (module: Module) => () => h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: useParams(), matches: [] } as never);
const avecErreur = (module: Module) => () => h(module.ErrorBoundary as never, { error: useRouteError(), params: useParams() } as never);

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: MiseEnPagePublique,
    children: [
      { id: "carriere", path: "carriere", loader: pageListe.loader as never, Component: avecDonnees(pageListe as Module) },
      {
        id: "offre", path: "carriere/:id", loader: pageOffre.loader as never, action: pageOffre.action as never,
        Component: avecDonnees(pageOffre as Module), ErrorBoundary: avecErreur(pageOffre as Module),
      },
    ],
  },
]);

async function servir(adresse: string, init?: RequestInit) {
  const contexte = await handler.query(new Request(`https://sosmiam.fr${adresse}`, { ...init, headers: { "x-real-ip": "203.0.113.9", ...init?.headers } }));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  const routeur = createStaticRouter(handler.dataRoutes, contexte);
  const html = renderToString(h(StaticRouterProvider, { router: routeur, context: contexte, hydrate: false }));
  return { statut: contexte.statusCode, html: html.replace(/ /g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') };
}

function candidature(champs: Record<string, string | File> = {}): FormData {
  const formulaire = new FormData();
  const valeurs = { nom: "Léa Martin", email: "lea@exemple.fr", message: "Je modère déjà un serveur Discord de 2 000 gourmands.", lien: "", majeur: "oui", site_web: "", ...champs };
  for (const [cle, valeur] of Object.entries(valeurs)) formulaire.append(cle, valeur);
  if (!("cv" in champs)) formulaire.append("cv", new File([], "", { type: "application/octet-stream" }));
  return formulaire;
}

test("service : seules les offres de forme attendue sont gardées ; l'IP du visiteur part dans X-IP-Visiteur ; panne → null", async () => {
  const offres = await service.listerOffresCarriere("203.0.113.7");
  assert.deepEqual(offres?.map((offre) => offre.id), ["moderation-brigade", "graphiste-affiches"]);
  assert.equal(recues.at(-1)?.ip, "203.0.113.7");
  etat = "panne";
  assert.equal(await service.listerOffresCarriere(null), null);
});

test("service : offre inconnue → offre-inconnue ; route absente de l'API (404 « introuvable ») ou panne → indisponible ; id douteux sans appel", async () => {
  assert.equal((await service.lireOffreCarriere("moderation-brigade", null)).ok, true);
  assert.deepEqual(await service.lireOffreCarriere("fermee", null), { ok: false, erreur: "offre-inconnue" });
  assert.deepEqual(await service.lireOffreCarriere("graphiste-affiches/candidatures", null), { ok: false, erreur: "offre-inconnue" });
  const avant = recues.length;
  assert.deepEqual(await service.lireOffreCarriere("../../comptes", null), { ok: false, erreur: "offre-inconnue" });
  assert.equal(recues.length, avant, "aucun appel pour un id douteux");
  etat = "panne";
  assert.deepEqual(await service.lireOffreCarriere("moderation-brigade", null), { ok: false, erreur: "indisponible" });
});

test("service : chaque réponse de l'API à une candidature a son code", async () => {
  const envoi = { nom: "Léa", email: "lea@exemple.fr", message: "x".repeat(20), lien: null, majeur: true as const, cv: null };
  const attendus: [number, unknown, unknown][] = [
    [201, { ok: true }, { ok: true }],
    [400, { ok: false, erreur: "champ-invalide", champ: "email" }, { ok: false, erreur: "champ-invalide", champ: "email" }],
    [404, { ok: false, erreur: "offre-inconnue" }, { ok: false, erreur: "offre-inconnue" }],
    [404, { ok: false, erreur: "introuvable" }, { ok: false, erreur: "erreur" }],
    [409, { ok: false, erreur: "offre-fermee" }, { ok: false, erreur: "offre-fermee" }],
    [413, { ok: false, erreur: "cv-trop-lourd" }, { ok: false, erreur: "cv-trop-lourd" }],
    [415, { ok: false, erreur: "cv-format" }, { ok: false, erreur: "cv-format" }],
    [429, { ok: false, erreur: "trop-de-demandes" }, { ok: false, erreur: "trop-de-demandes" }],
    [500, { ok: false }, { ok: false, erreur: "erreur" }],
  ];
  for (const [statut, corps, resultat] of attendus) {
    reponseCandidature = { statut, corps };
    assert.deepEqual(await service.envoyerCandidature("moderation-brigade", envoi, "", "203.0.113.7"), resultat, `${statut} ${JSON.stringify(corps)}`);
  }
  assert.deepEqual(recues.at(-1)?.corps, { ...envoi, site_web: "" });
  assert.equal(recues.at(-1)?.chemin, "/carriere/offres/moderation-brigade/candidatures");
});

test("/carriere : les offres, le filtre, la franchise, le lien canonique, et rien en noindex", async () => {
  const { statut, html } = await servir("/carriere");
  assert.equal(statut, 200);
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam.fr\/carriere"\/>/);
  assert.doesNotMatch(html, /noindex/);
  assert.match(html, /<h1[^>]*>On recrute !<\/h1>/);
  assert.match(html, /On est une petite équipe, pas encore une entreprise : on cherche des bénévoles et des freelances\./);
  assert.match(html, /href="\/carriere\/moderation-brigade"/);
  assert.match(html, /href="\/carriere\/graphiste-affiches"/);
  assert.match(html, /href="\/carriere\?type=benevolat#offres"/);
  assert.match(html, /Ton nom au générique/);
  assert.match(html, /Dès 18 ans/);
  assert.doesNotMatch(html, /JobPosting/);
  const meta = pageListe.meta({} as never);
  assert.ok(!meta.some((balise) => "name" in balise && balise.name === "robots"));
  assert.equal(meta[0]?.title, "On recrute : bénévoles et freelances — SOS Miam");
});

test("/carriere?type=freelance : seulement les missions freelance, le filtre actif est annoncé", async () => {
  const { html } = await servir("/carriere?type=freelance");
  assert.match(html, /href="\/carriere\/graphiste-affiches"/);
  assert.doesNotMatch(html, /href="\/carriere\/moderation-brigade"/);
  assert.match(html, /aria-current="true"[^>]*>(<span[^>]*>✓<\/span>)?Freelance ou mission/);
});

test("/carriere : aucune offre → état vide aimable ; API en panne → 503 et message « indisponible »", async () => {
  etat = "vide";
  const vide = await servir("/carriere");
  assert.equal(vide.statut, 200);
  assert.match(vide.html, /Pas d'offre en ce moment/);
  assert.match(vide.html, /Repasse bientôt, ou écris-nous/);
  etat = "panne";
  const panne = await servir("/carriere");
  assert.equal(panne.statut, 503);
  assert.match(panne.html, /Les offres font une petite sieste/);
});

test("/carriere/:id : l'offre en détail et le formulaire qui marche sans JavaScript", async () => {
  const { statut, html } = await servir("/carriere/moderation-brigade");
  assert.equal(statut, 200);
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam.fr\/carriere\/moderation-brigade"\/>/);
  assert.doesNotMatch(html, /noindex/);
  assert.match(html, /<h1[^>]*>Modération avec la Brigade<\/h1>/);
  for (const titre of ["Tes missions", "Ton profil", "En échange", "Je candidate"]) assert.match(html, new RegExp(titre));
  const formulaire = html.match(/<form [^>]*>/)?.[0] ?? "";
  assert.match(formulaire, /\baction="\/carriere\/moderation-brigade#candidater"/);
  assert.match(formulaire, /\bmethod="post"/);
  assert.match(formulaire, /\benctype="multipart\/form-data"/i);
  const champ = (nom: string) => html.match(new RegExp(`<input [^>]*name="${nom}"[^>]*>`))?.[0] ?? "";
  assert.match(champ("cv"), /type="file"/);
  assert.match(champ("cv"), /accept="application\/pdf,.pdf"/);
  assert.match(champ("majeur"), /type="checkbox"/);
  assert.match(champ("majeur"), /required=""/);
  assert.match(champ("site_web"), /tabindex="-1"/i);
  assert.match(html, /Ta candidature est gardée 6 mois puis effacée ; seule l'équipe la lit\./);
  assert.match(html, /href="\/confidentialite#candidatures"/);
  assert.doesNotMatch(html, /JobPosting/);
  const meta = pageOffre.meta({ loaderData: { offre: MODERATION } } as never);
  assert.ok(!meta.some((balise) => "name" in balise && balise.name === "robots"));
  assert.equal(meta[0]?.title, "Modération avec la Brigade (bénévolat) — SOS Miam");
  assert.deepEqual(pageOffre.meta({ loaderData: undefined } as never).at(-1), { name: "robots", content: "noindex" });
});

test("/carriere/:id : offre fermée ou inconnue → 404 aimable ; API indisponible → 503", async () => {
  for (const adresse of ["/carriere/fermee", "/carriere/pas%20bon"]) {
    const { statut, html } = await servir(adresse);
    assert.equal(statut, 404, adresse);
    assert.match(html, /Cette offre a pris le large/);
  }
  etat = "panne";
  const panne = await servir("/carriere/moderation-brigade");
  assert.equal(panne.statut, 503);
  assert.match(panne.html, /Les offres font une petite sieste/);
});

test("envoi sans JavaScript : l'action lit le CV, l'envoie en base64 à l'API avec le piège et l'IP, puis remercie", async () => {
  const pdf = "%PDF-1.4\n%%EOF\n";
  const corps = candidature({ cv: new File([pdf], "cv-lea.pdf", { type: "application/pdf" }), lien: "lea.fr", site_web: "rempli par un robot" });
  const { statut, html } = await servir("/carriere/moderation-brigade", { method: "POST", body: corps });
  assert.equal(statut, 200);
  assert.match(html, /Merci, c'est envoyé !/);
  assert.match(html, /gardée 6 mois, puis effacée/);
  const envoi = recues.find((recue) => recue.methode === "POST");
  assert.equal(envoi?.chemin, "/carriere/offres/moderation-brigade/candidatures");
  assert.equal(envoi?.ip, "203.0.113.9");
  assert.deepEqual(envoi?.corps, {
    nom: "Léa Martin", email: "lea@exemple.fr", message: "Je modère déjà un serveur Discord de 2 000 gourmands.",
    lien: "https://lea.fr", majeur: true, cv: { nomFichier: "cv-lea.pdf", base64: Buffer.from(pdf).toString("base64") }, site_web: "rempli par un robot",
  });
});

test("envoi refusé par le site : rien ne part, les messages restent sur les champs et le formulaire est rempli de nouveau", async () => {
  const corps = candidature({ email: "lea@", majeur: "", cv: new File(["pas un pdf"], "cv.pdf", { type: "application/pdf" }) });
  const { statut, html } = await servir("/carriere/moderation-brigade", { method: "POST", body: corps });
  assert.equal(statut, 200);
  assert.ok(!recues.some((recue) => recue.methode === "POST"), "aucun envoi à l'API");
  assert.match(html, /3 champs sont à corriger\./);
  assert.match(html, /<input [^>]*id="candidature-email"[^>]*aria-invalid="true"[^>]*aria-describedby="candidature-email-erreur"/);
  assert.match(html, /id="candidature-email-erreur"[^>]*>Cette adresse e-mail ne semble pas valide\./);
  assert.match(html, /id="candidature-cv-erreur"[^>]*>Ton CV doit être un fichier PDF\./);
  assert.match(html, /id="candidature-majeur-erreur"[^>]*>Il faut avoir 18 ans ou plus/);
  assert.match(html, /<input [^>]*name="nom"[^>]*value="Léa Martin"/);
  assert.match(html, /ton navigateur a oublié le fichier choisi/);
});

test("envoi refusé par l'API : champ invalide sur son champ, CV trop lourd, trop d'envois ; offre fermée entre-temps → 404 aimable", async () => {
  reponseCandidature = { statut: 400, corps: { ok: false, erreur: "champ-invalide", champ: "message" } };
  let page = await servir("/carriere/moderation-brigade", { method: "POST", body: candidature() });
  assert.match(page.html, /id="candidature-message-erreur"[^>]*>Écris-nous un message de 20 à 3 000 caractères/);
  reponseCandidature = { statut: 413, corps: { ok: false, erreur: "cv-trop-lourd" } };
  page = await servir("/carriere/moderation-brigade", { method: "POST", body: candidature() });
  assert.match(page.html, /id="candidature-cv-erreur"[^>]*>Ton CV dépasse 5 Mo/);
  reponseCandidature = { statut: 429, corps: { ok: false, erreur: "trop-de-demandes" } };
  page = await servir("/carriere/moderation-brigade", { method: "POST", body: candidature() });
  assert.match(page.html, /Doucement ! Trop d'envois d'affilée/);
  reponseCandidature = { statut: 409, corps: { ok: false, erreur: "offre-fermee" } };
  page = await servir("/carriere/moderation-brigade", { method: "POST", body: candidature() });
  assert.equal(page.statut, 404);
  assert.match(page.html, /Cette offre a pris le large/);
  assert.match(page.html, /rien n'est parti/);
});

test("envoi trop lourd annoncé (Content-Length) : refusé avant d'être lu", async () => {
  const requete = new Request("https://sosmiam.fr/carriere/moderation-brigade", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=xyz", "content-length": String(8 * 1024 * 1024) },
    body: "--xyz--",
  });
  const reponse = await pageOffre.action({ request: requete, params: { id: "moderation-brigade" } } as never);
  assert.equal(reponse.ok, false);
  assert.ok(!reponse.ok && reponse.erreurs?.cv?.startsWith("Ton CV dépasse 5 Mo"));
  assert.ok(!recues.some((recue) => recue.methode === "POST"));
});

test("plan du site : /carriere et chaque offre publiée, avec sa date", async () => {
  const xml = await (await planDuSite({ request: new Request("https://sosmiam.fr/sitemap.xml") } as never)).text();
  assert.match(xml, /<loc>https:\/\/sosmiam.fr\/carriere<\/loc>/);
  assert.match(xml, /<loc>https:\/\/sosmiam.fr\/carriere\/moderation-brigade<\/loc><lastmod>2026-10-21T08:00:00Z<\/lastmod>/);
  assert.match(xml, /<loc>https:\/\/sosmiam.fr\/carriere\/graphiste-affiches<\/loc>/);
  assert.doesNotMatch(xml, /piege|stage/);
});
