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

const LOGO = "/app/lieux/images/7c9e6679-7425-40de-944b-e07fc1f90ae7.png";
const BANNIERE = "/app/lieux/images/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
const VILLES = [{ ville: "Paris", nombre: 939 }, { ville: "Montpellier", nombre: 135 }, { ville: "Lille", nombre: 193 }];
const lieuListe = (id: number, autres: Record<string, unknown> = {}) => ({
  id, nom: `Lieu ${id}`, type: "resto", emoji: "🍲", info: "Bistrot", quartier: "Écusson", ville: "Montpellier", prix: "€€",
  couleurs: ["#FFB36B", "#E8590C"], decouvertPar: null, logo: null, verifie: false, sos: null, ...autres,
});
const CARTE = {
  majLe: "2026-10-20",
  sections: [
    { titre: "Plats", elements: [{ nom: "Risotto aux cèpes", prix: 18.5, signature: true, etiquettes: ["vege"] }, { nom: "Carafe d'eau", prix: 0 }] },
    { titre: "Vins", elements: [{ nom: "Picpoul de Pinet", prix: 6, alcool: true }] },
  ],
};
const BASE = {
  adresse: "3 rue du Port", emoji: "🛟", quartier: "Le Port", ville: "Montpellier", horaires: "Mar–sam, 12h–14h et 19h–23h", texte: "Le Capitaine régale la Brigade.",
  prix: "€€", couleurs: ["#FFB36B", "#E8590C"], decouvertPar: "Zoé", telephone: "+33 4 00 00 00 00", siteWeb: "https://capitaine.example", instagram: null,
  animaux: "bienvenus", accessible: true, terrasse: null, wifi: false, enfants: null, parking: null, paiements: ["cb", "tickets-resto"], reservation: "conseillee",
  carteMajLe: null, source: null, banniere: null, logo: LOGO, position: { latitude: 43.61, longitude: 3.87 }, etiquettes: ["Produits de la mer"], autour: [],
};
const LIEUX: Record<number, object> = {
  18: {
    ...BASE, id: 18, nom: "Restaurant du Capitaine Bouiboui", type: "resto", info: "Bistrot de la mer", estVerifie: true, carte: CARTE, banniere: BANNIERE,
    sos: { places: 6, jusqua: "21:30", offre: "Le dessert du Capitaine offert" }, ouverture: [{ jours: [0, 1, 2, 3, 4, 5, 6], de: "00:00", a: "24:00" }],
  },
  50: { ...BASE, id: 50, nom: "Le Vertigo", type: "bar", emoji: "🍷", info: "Bar à vin", estVerifie: true, carte: CARTE, sos: null, ouverture: [], etiquettes: ["Entre potes"] },
};

const serveur = createServer((requete, reponse) => {
  const adresse = new URL(requete.url ?? "", "http://api");
  const repondre = (statut: number, corps: unknown) => void reponse.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  if (adresse.pathname === "/lieux/villes") return repondre(200, { ok: true, villes: VILLES });
  if (adresse.pathname === "/lieux/liste") {
    return repondre(200, { ok: true, total: 135, page: 2, pages: 6, lieux: [lieuListe(18, { verifie: true, sos: { places: 6 }, logo: LOGO }), lieuListe(19), lieuListe(20, { verifie: true, sos: { places: 1 } }), lieuListe(21, { verifie: true })] });
  }
  const id = /^\/lieux\/site\/(\d+)$/.exec(adresse.pathname)?.[1];
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

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, StaticRouterProvider, useActionData, useLoaderData, useParams } = await import("react-router");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const pageLieux = await import("../src/routes/public/lieux.tsx");
const pageFiche = await import("../src/routes/public/fiche-lieu.tsx");
const pageCarte = await import("../src/routes/public/carte-du-lieu.tsx");
const pageSignaler = await import("../src/routes/public/signaler-image.tsx");
const pageInvitation = await import("../src/routes/public/invitation.tsx");
const pageQr = await import("../src/routes/public/qr-connexion.tsx");
const { default: MiseEnPagePublique } = await import("../src/routes/public/mise-en-page-publique.tsx");
const { ecrireOuverture } = await import("../src/fonctions/lieux/ecrire-ouverture.ts");
const { lireFormulaireSignalerImage } = await import("../src/fonctions/lieux/lire-formulaire-signaler-image.ts");
const { ecrireErreursSignalerImage } = await import("../src/fonctions/lieux/ecrire-erreurs-signaler-image.ts");

type Module = { default: (props: never) => unknown };
const avecDonnees = (module: Module) => () =>
  h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: useParams(), matches: [] } as never);

const handler = createStaticHandler([
  {
    id: "public",
    path: "/",
    Component: MiseEnPagePublique,
    children: [
      { id: "lieux", path: "en/lieux", loader: pageLieux.loader as never, Component: avecDonnees(pageLieux as Module) },
      { id: "fiche", path: "lieux/:id", loader: pageFiche.loader as never, Component: avecDonnees(pageFiche as Module) },
      { id: "carte", path: "lieux/:id/carte", loader: pageCarte.loader as never, Component: avecDonnees(pageCarte as Module) },
      { id: "signaler", path: "lieux/:id/signaler-image", loader: pageSignaler.loader as never, action: pageSignaler.action as never, Component: avecDonnees(pageSignaler as Module) },
      { id: "invitation", path: "invitation/:pseudo", loader: pageInvitation.loader as never, Component: avecDonnees(pageInvitation as Module) },
      { id: "q", path: "q/:code", loader: pageQr.loader as never, Component: avecDonnees(pageQr as Module) },
    ],
  },
]);

const RACINE_ANGLAISE = [{ id: "root", loaderData: { langue: "en" } }];
const nettoyer = (html: string) => html.replace(/[  ]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

async function servir(adresse: string, id: string, reglages: RequestInit = {}) {
  const contexte = await handler.query(new Request(`https://apercu.sosmiam.fr${adresse}`, { ...reglages, headers: { "x-real-ip": "203.0.113.9" } }));
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  assert.equal(contexte.statusCode, 200, adresse);
  const page = h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false });
  const html = renderToString(h(ContexteLangue, { value: { langue: "en", servies: ["fr", "en"] } }, page));
  return { html: nettoyer(html), donnees: (contexte.loaderData as Record<string, unknown>)[id], entetes: contexte.loaderHeaders[id] };
}

const titre = (balises: unknown) => (balises as { title?: string }[]).find((balise) => balise.title)?.title;

test("/en/lieux : titre, filtres, compte, pastilles, pagination et liens restent sous /en ; le texte des lieux est balisé en français", async () => {
  const { html, donnees } = await servir("/en/lieux?ville=montpellier&type=resto&page=2", "lieux");
  assert.match(html, /<h1[^>]*>Places<\/h1>/);
  assert.match(html, /Restaurants, patisseries and bars in Montpellier – take your pick, as a list or on the map\./);
  assert.match(html, /<form role="search"[^>]*action="\/en\/lieux" method="get">/);
  assert.match(html, /aria-label="Search"/);
  assert.match(html, /placeholder="A name, a neighbourhood, a dish…"/);
  assert.match(html, /href="\/en\/lieux\?type=resto"[^>]*>Everywhere<\/a>/);
  assert.match(html, /In the mood for/);
  assert.match(html, /href="\/en\/lieux\?ville=montpellier&type=patisserie"[^>]*>Patisseries<\/a>/);
  assert.match(html, />Things to do<\/a>/);
  assert.match(html, /135 places · the ones with an SOS tonight first/);
  assert.match(html, /SOS tonight · 6 seats/);
  assert.match(html, /SOS tonight · 1 seat</);
  assert.match(html, /✓ Verified/);
  assert.match(html, /Not verified/);
  assert.match(html, /<p lang="fr" class="text-sm text-gris">Bistrot · €€<\/p>/);
  assert.match(html, /<a[^>]*rel="next"[^>]*href="\/en\/lieux\?ville=montpellier&type=resto&page=3"[^>]*>Next/);
  assert.match(html, /Previous/);
  assert.match(html, /<nav aria-label="View"[^>]*>.*href="\/en\/lieux\?ville=montpellier&type=resto&vue=carte"[^>]*>Map<\/a>/s);
  assert.match(html, /href="\/lieux\/18"/, "les fiches gardent leur adresse unique");
  assert.match(html, /<link rel="canonical" href="https:\/\/sosmiam\.fr\/en\/lieux\?ville=montpellier&type=resto&page=2"\/>/);
  assert.doesNotMatch(html, /Les lieux|Partout|Envie de|Restos|Suivants|ceux en SOS/);
  assert.equal(titre(pageLieux.meta({ loaderData: donnees, matches: RACINE_ANGLAISE } as never)), "Restaurants in Montpellier (page 2) — SOS Miam");
  assert.equal(titre(pageLieux.meta({ loaderData: donnees } as never)), "Montpellier : les restos (page 2) — SOS Miam");
});

test("fiche en anglais : badges, actions, SOS en 24 h, infos pratiques ; ce qu'écrit le lieu reste en français avec lang=\"fr\"", async () => {
  const { html, donnees, entetes } = await servir("/lieux/18?langue=en", "fiche");
  assert.match(html, /<h1[^>]*>Restaurant du Capitaine Bouiboui<\/h1>/);
  assert.match(html, /✓ Verified/);
  assert.match(html, /<span lang="fr">Bistrot de la mer<\/span> · Restaurants · €€ · Le Port, Montpellier/);
  assert.match(html, /Open 24 hours/);
  assert.match(html, /Spotted by Zoé/);
  for (const action of ["Directions", "Call", "Website"]) assert.match(html, new RegExp(`</svg>${action}`), action);
  assert.match(html, /6 free seats until 21:30/);
  assert.match(html, /<p lang="fr"[^>]*>Le dessert du Capitaine offert<\/p>/);
  assert.match(html, /Open the app to head there/);
  assert.match(html, /<p lang="fr"[^>]*>Le Capitaine régale la Brigade\.<\/p>/);
  assert.match(html, /<strong>The speciality:\s?<\/strong><span lang="fr">Risotto aux cèpes<\/span>/);
  assert.match(html, /<ul aria-label="What the Miamis say" lang="fr"[^>]*><li[^>]*>Produits de la mer<\/li>/);
  assert.match(html, /<p lang="fr"[^>]*>Mar–sam, 12h–14h et 19h–23h<\/p>/);
  assert.match(html, /Updated by the venue on 20 October 2026/);
  assert.match(html, /€18\.50/);
  assert.match(html, /House speciality/);
  assert.match(html, /Payment: card, meal vouchers \(titres-restaurant\)/);
  assert.match(html, /Booking recommended/);
  assert.match(html, /Pets welcome/);
  assert.match(html, /Wheelchair accessible/);
  assert.match(html, /No Wi-Fi/);
  assert.match(html, /href="\/en\/lieux\?lieu=18&vue=carte"[^>]*>.*Expand the map/);
  assert.match(html, /Is this your restaurant\?/);
  assert.match(html, /Claim my listing|Join the pro area/);
  assert.match(html, /<a [^>]*href="\/en"[^>]*>Home<\/a>/);
  assert.doesNotMatch(html, /Vérifié|Itinéraire|places libres|Bon à savoir|Mise à jour par le lieu/);
  assert.equal(entetes?.get("Cache-Control"), "private, max-age=60", "langue choisie par la personne : jamais en cache public");
  assert.equal(titre(pageFiche.meta({ loaderData: donnees, matches: RACINE_ANGLAISE } as never)), "Restaurant du Capitaine Bouiboui in Montpellier — SOS Miam");
});

test("fiche d'un bar en anglais : la formule Évin mot pour mot, en français, et sa traduction dessous", async () => {
  const { html } = await servir("/lieux/50?langue=en", "fiche");
  assert.match(html, /<p lang="fr"[^>]*>L'abus d'alcool est dangereux pour la santé, à consommer avec modération\.<\/p><p[^>]*>Alcohol abuse is dangerous to health\. Consume in moderation\.<\/p>/);
  assert.match(html, /Alcool Info Service \(French-language helpline\): /);
  assert.match(html, /href="\/en\/prevention"[^>]*>Health and wellbeing<\/a>/);
  assert.match(html, /The atmosphere/);
  assert.match(html, /Is this your bar\?/);
});

test("carte en grand en anglais : titre, date, plats en français, gratuit, formule Évin et sa traduction", async () => {
  const { html } = await servir("/lieux/18/carte?langue=en", "carte");
  assert.match(html, /<h1[^>]*>The menu<\/h1>/);
  assert.match(html, /Restaurant du Capitaine Bouiboui · updated by the venue on 20 October 2026/);
  assert.match(html, /<ul lang="fr">.*Carafe d'eau.*<span lang="en"[^>]*>Free<\/span>/s);
  assert.match(html, /L'abus d'alcool est dangereux pour la santé, à consommer avec modération\..*Alcohol abuse is dangerous to health\. Consume in moderation\./s);
  assert.match(html, /Close<span class="sr-only"> the menu and go back to the page for Restaurant du Capitaine Bouiboui<\/span>/);
  assert.match(html, /Prices, dishes and drinks are the ones the venue has put on SOS Miam\. Allergens: ask the staff\./);
});

test("signaler une image en anglais : le formulaire, et des erreurs dans la langue de la page", async () => {
  const { html } = await servir("/lieux/18/signaler-image?langue=en", "signaler");
  assert.match(html, /<h1[^>]*>Report an image<\/h1>/);
  assert.match(html, /Which image are you reporting\?/);
  assert.match(html, />The banner<\/strong>/);
  assert.match(html, /Hidden ad or spam/);
  assert.match(html, /name="precision-danger" value="Arme"[^>]*\/>Weapon/, "la valeur envoyée reste le mot français, seul le libellé change");
  assert.match(html, /href="\/en\/confidentialite#signaler-image"/);
  const refus = await servir("/lieux/18/signaler-image?langue=en", "signaler", { method: "POST", body: new URLSearchParams({ quelle: "photo", raison: "autre", explication: "court" }) });
  assert.match(refus.html, /2 things to fix before sending\./);
  assert.match(refus.html, /Choose the image you're reporting\./);
  assert.match(refus.html, /For “Something else”, tell us in a few words what's wrong \(at least 10 characters\)\./);
});

test("ecrireOuverture et erreurs du signalement : le français ne bouge pas, l'anglais en 24 h", () => {
  assert.equal(ecrireOuverture({ ouvert: true, heure: "22:30" }, "fr"), "Ouvert · ferme à 22h30");
  assert.equal(ecrireOuverture({ ouvert: true, heure: "22:30" }, "en"), "Open · closes at 22:30");
  assert.equal(ecrireOuverture({ ouvert: true, heure: "00:00" }, "en"), "Open · closes at midnight");
  assert.equal(ecrireOuverture({ ouvert: false, heure: "09:00", quand: "aujourdhui", jourSemaine: 2 }, "en"), "Closed · opens at 09:00");
  assert.equal(ecrireOuverture({ ouvert: false, heure: "09:00", quand: "demain", jourSemaine: 2 }, "fr"), "Fermé · ouvre demain à 9h");
  assert.equal(ecrireOuverture({ ouvert: false, heure: "19:00", quand: "plus-tard", jourSemaine: 1 }, "fr"), "Fermé · ouvre lundi à 19h");
  assert.equal(ecrireOuverture({ ouvert: false, heure: "19:00", quand: "plus-tard", jourSemaine: 1 }, "en"), "Closed · opens on Monday at 19:00");
  const lecture = lireFormulaireSignalerImage(new URLSearchParams({ quelle: "logo", raison: "autre" }) as unknown as FormData, 18);
  assert.ok(!lecture.ok);
  assert.deepEqual(lecture.codes, { explication: "explicationCourte" });
  assert.equal(ecrireErreursSignalerImage(lecture.codes, "fr").explication, lecture.erreurs.explication);
  assert.equal(ecrireErreursSignalerImage(lecture.codes, "en").explication, "For “Something else”, tell us in a few words what's wrong (at least 10 characters).");
});

test("invitation et QR de connexion en anglais", async () => {
  const invitation = await servir("/invitation/lea.croque", "invitation");
  assert.match(invitation.html, /Open SOS Miam to join @lea\.croque's crew/);
  assert.match(invitation.html, /App Store \(iPhone\): coming soon/);
  assert.equal(titre(pageInvitation.meta({ loaderData: { pseudo: "lea.croque" }, matches: RACINE_ANGLAISE } as never)), "Join @lea.croque's crew — SOS Miam");
  const qr = await servir("/q/k7mq2x9pa4vtk7mq2x9pa4vtk7mq2x9p", "q");
  assert.match(qr.html, /Open the SOS Miam app to log in/);
  assert.equal(titre(pageQr.meta({ matches: RACINE_ANGLAISE } as never)), "Log in with the app — SOS Miam");
  assert.equal(titre(pageQr.meta({} as never)), "Connexion avec l'app — SOS Miam");
});
