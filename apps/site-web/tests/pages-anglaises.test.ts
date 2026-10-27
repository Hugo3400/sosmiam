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

const OFFRE = {
  id: "moderation-brigade",
  titre: "Modération avec la Brigade",
  type: "benevolat",
  domaine: "moderation",
  resume: "Garder l'app accueillante, à ton rythme.",
  description: "Tu relis ce que signalent les Miamis.",
  missions: ["Relire les signalements"],
  profil: ["Patient·e et bienveillant·e"],
  enEchange: ["Un badge « Brigade » dans l'app"],
  lieu: "À distance, partout en France",
  publieeLe: "2026-10-21T08:00:00.000Z",
};

const serveur = createServer((requete, reponse) => {
  const chemin = requete.url ?? "";
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (chemin === "/carriere/offres") return repondre(200, { ok: true, offres: [OFFRE] });
  if (chemin === `/carriere/offres/${OFFRE.id}`) return repondre(200, { ok: true, offre: OFFRE });
  if (chemin === "/securite/tableau-honneur") return repondre(200, { ok: true, entrees: [{ nom: "Léa", mois: "2026-10" }] });
  repondre(404, { ok: false, erreur: "introuvable" });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

const { createElement: h } = await import("react");
const { renderToString, renderToStaticMarkup } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, MemoryRouter, StaticRouterProvider, useActionData, useLoaderData, useParams } = await import("react-router");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const pageFaq = await import("../src/routes/public/faq.tsx");
const pageCarriere = await import("../src/routes/public/carriere.tsx");
const pageOffre = await import("../src/routes/public/offre-carriere.tsx");
const pageSecurite = await import("../src/routes/public/securite.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");
const { GestionnaireConsentement } = await import("../src/composants/cookies/GestionnaireConsentement.tsx");
const { lireFormulaireCandidature } = await import("../src/fonctions/carriere/lire-formulaire-candidature.ts");
const { lireFormulaireSignalement } = await import("../src/fonctions/securite/lire-formulaire-signalement.ts");
const { ecrireMessageService } = await import("../src/fonctions/texte/ecrire-message-service.ts");

type Module = { default: (props: never) => unknown };
const avecDonnees = (module: Module) => () => h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: useParams(), matches: [] } as never);

const pages = (prefixe: string) => ({
  id: `public${prefixe}`,
  path: `${prefixe}/`,
  Component: MiseEnPagePublique,
  children: [
    { id: `faq${prefixe}`, path: "faq", loader: pageFaq.loader as never, Component: avecDonnees(pageFaq as Module) },
    { id: `carriere${prefixe}`, path: "carriere", loader: pageCarriere.loader as never, Component: avecDonnees(pageCarriere as Module) },
    { id: `offre${prefixe}`, path: "carriere/:id", loader: pageOffre.loader as never, action: pageOffre.action as never, Component: avecDonnees(pageOffre as Module) },
    { id: `securite${prefixe}`, path: "securite", loader: pageSecurite.loader as never, action: pageSecurite.action as never, Component: avecDonnees(pageSecurite as Module) },
  ],
});

const handler = createStaticHandler([pages("/en"), pages("")]);

async function servir(adresse: string, init?: RequestInit) {
  const contexte = await handler.query(new Request(`https://apercu.sosmiam.fr${adresse}`, { ...init, headers: { "x-real-ip": "203.0.113.9", ...init?.headers } }));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  const langue = adresse.startsWith("/en/") ? "en" : "fr";
  const routeur = createStaticRouter(handler.dataRoutes, contexte);
  const html = renderToString(h(ContexteLangue, { value: { langue, servies: ["fr", "en"] } }, h(StaticRouterProvider, { router: routeur, context: contexte, hydrate: false })));
  return { statut: contexte.statusCode, html: html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') };
}

const racineEn = [{ id: "root", loaderData: { langue: "en" } }];

test("/en/faq : questions, onglets, recherche et données structurées en anglais, liens internes sous /en", async () => {
  const { statut, html } = await servir("/en/faq");
  assert.equal(statut, 200);
  for (const texte of [
    "Frequently asked questions",
    "What is SOS Miam?",
    "What's a BIG SOS?",
    "The essentials",
    "For venues",
    "Search: price, reviews, BIG SOS…",
    'aria-label="Question topics"',
    "Can't find your answer?",
    "Drop us a line",
    "“Collaboration commerciale” (a paid or gifted partnership)",
    'href="/en/faq#faq-big-sos"',
    'href="/en#inscription"',
    "https://ambassadeur.sosmiam.fr/en/programme",
    '"inLanguage":"en"',
  ]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Questions fréquentes", "C'est quoi, SOS Miam", "Thèmes des questions", "Écris-nous", 'href="/faq#faq-big-sos"']) assert.ok(!html.includes(francais), francais);
  const meta = pageFaq.meta({ matches: racineEn } as never);
  assert.ok(meta.some((balise) => "title" in balise && balise.title === "Frequently asked questions — SOS Miam"));
});

test("/faq : le français ne bouge pas, liens internes sans /en", async () => {
  const { statut, html } = await servir("/faq");
  assert.equal(statut, 200);
  for (const texte of ["Questions fréquentes", "C'est quoi, SOS Miam ?", "Cherche : prix, avis, BIG SOS…", 'href="/faq#faq-big-sos"', '"inLanguage":"fr"', "Écris-nous"]) {
    assert.ok(html.includes(texte), texte);
  }
  assert.ok(!html.includes("What is SOS Miam?"));
});

test("/en/carriere et une offre : en-tête, filtre, date et formulaire en anglais ; l'offre elle-même reste en français", async () => {
  const liste = await servir("/en/carriere");
  assert.equal(liste.statut, 200);
  for (const texte of ["Get involved!", "Join us", "Open roles", "21 October 2026", `href="/en/carriere/${OFFRE.id}"`, OFFRE.titre]) assert.ok(liste.html.includes(texte), texte);
  for (const francais of ["On recrute", "Les offres ouvertes", "Voir l'offre"]) assert.ok(!liste.html.includes(francais), francais);

  const offre = await servir(`/en/carriere/${OFFRE.id}`);
  assert.equal(offre.statut, 200);
  for (const texte of ["Apply", "Your first name and surname", 'href="/en/carriere"']) assert.ok(offre.html.includes(texte), texte);

  const formulaire = new FormData();
  for (const [cle, valeur] of Object.entries({ nom: "L", email: "pas-un-mail", message: "Court", lien: "", site_web: "" })) formulaire.append(cle, valeur);
  const refus = await servir(`/en/carriere/${OFFRE.id}`, { method: "POST", body: formulaire });
  for (const texte of ["Tell us your name (2 to 80 characters).", "That email address doesn't look right."]) assert.ok(refus.html.includes(texte), texte);
  assert.ok(!refus.html.includes("Cette adresse e-mail ne semble pas valide."));
});

test("/en/securite : titres, règles, tableau d'honneur (mois en anglais) et formulaire en anglais", async () => {
  const { statut, html } = await servir("/en/securite");
  assert.equal(statut, 200);
  for (const texte of ["Bug hunt", "What's in scope", "The rules", "Mum's the word", "October 2026", "Report a flaw", 'href="/en/confidentialite#chasse-aux-bugs"']) {
    assert.ok(html.includes(texte), texte);
  }
  for (const francais of ["Chasse aux bugs", "Les règles", "octobre 2026"]) assert.ok(!html.includes(francais), francais);
});

test("formulaires en anglais : erreurs de la candidature, du signalement et messages de service", async () => {
  const candidature = new FormData();
  candidature.append("nom", "Sam");
  const lueCandidature = await lireFormulaireCandidature(candidature, "en");
  assert.ok(!lueCandidature.ok);
  assert.equal(lueCandidature.erreurs.message, "Write us a message of 20 to 3,000 characters.");

  const signalement = new FormData();
  const lueSignalement = await lireFormulaireSignalement(signalement, "en");
  assert.ok(!lueSignalement.ok);
  assert.ok(Object.values(lueSignalement.erreurs).every((erreur) => !/[àéèêç]/.test(erreur ?? "")), "aucune erreur en français");

  assert.notEqual(ecrireMessageService("trop-d-images", "en"), ecrireMessageService("trop-d-images"));
});

test("bandeau des cookies en anglais (aperçu) : les trois boutons et la phrase des partenaires", () => {
  const html = renderToStaticMarkup(
    h(ContexteLangue, { value: { langue: "en", servies: ["fr", "en"] } },
      h(MemoryRouter, { initialEntries: ["/en?apercu-cookies"] }, h(GestionnaireConsentement, { etat: { apercu: true, choix: null }, children: h("main") }))),
  );
  for (const texte of ["Accept all", "Reject all", "Choose", "Cookies? Only if you want 🍪"]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Tout accepter", "Tout refuser", "Des cookies ?"]) assert.ok(!html.includes(francais), francais);
});
