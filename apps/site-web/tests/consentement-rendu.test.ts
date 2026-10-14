// Rendu serveur du consentement aux cookies (src/composants/cookies/) : pas de bandeau sans catégorie active, le bandeau
// d'aperçu (formulaire qui marche sans JavaScript, trois boutons, croix), le formulaire de /cookies#mes-choix, et
// ContenuExterne qui ne rend jamais d'iframe sans accord (ni dans le HTML du serveur).
// Les composants sont des .tsx, que Node ne lance pas : ce test les fait traduire par TypeScript (déjà dans le dépôt).
// Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
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

const { createElement: h } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { MemoryRouter } = await import("react-router");
const { GestionnaireConsentement } = await import("../src/composants/cookies/GestionnaireConsentement.tsx");
const { ContenuExterne } = await import("../src/composants/cookies/ContenuExterne.tsx");
const { ReglagesCookies } = await import("../src/composants/cookies/ReglagesCookies.tsx");
const { LienGererCookies } = await import("../src/composants/cookies/LienGererCookies.tsx");
const { ContexteConsentement } = await import("../src/hooks/utiliser-consentement.ts");
const { choisirCategoriesConsentement } = await import("../src/fonctions/consentement/choisir-categories-consentement.ts");
const { calculerVersionConsentement } = await import("../src/fonctions/consentement/calculer-version-consentement.ts");
const { listerCategoriesAChoisir } = await import("../src/fonctions/consentement/lister-categories-a-choisir.ts");
const { choisirAffichageContenuExterne } = await import("../src/fonctions/consentement/choisir-affichage-contenu-externe.ts");

type Etat = import("../src/types/consentement.ts").EtatConsentementServeur;
type Valeur = import("../src/hooks/utiliser-consentement.ts").ValeurConsentement;

const versionApercu = calculerVersionConsentement(choisirCategoriesConsentement(true));
const IFRAME = h("iframe", { src: "https://www.youtube-nocookie.com/embed/exemple", title: "La vidéo" });

/** La balise du bouton d'envoi « geste=valeur » (React range les attributs à sa façon) */
function boutonGeste(html: string, valeur: string): string {
  const balise = html.match(new RegExp(`<button[^>]*value="${valeur}"[^>]*>`))?.[0] ?? "";
  assert.match(balise, /type="submit"/, valeur);
  assert.match(balise, /name="geste"/, valeur);
  return balise;
}

/** Une page rendue par le serveur, à l'adresse donnée, avec le gestionnaire et son contenu */
function rendre(adresse: string, etat: Etat, ...contenu: ReturnType<typeof h>[]): string {
  return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [adresse] }, h(GestionnaireConsentement, { etat, children: h("main", { id: "contenu" }, ...contenu) })));
}

test("production : sans catégorie active, ni bandeau, ni formulaire, même sans aucun choix", () => {
  const html = rendre("/cookies", { apercu: false, choix: null }, h(ReglagesCookies));
  assert.doesNotMatch(html, /role="dialog"/);
  assert.doesNotMatch(html, /<form/);
  assert.doesNotMatch(html, /role="status"/);
  assert.equal(html, '<main id="contenu"></main>');
});

test("aperçu : le bandeau, non modal, est un vrai formulaire (POST /cookies/choix) avec trois boutons de même poids et une croix", () => {
  const html = rendre("/faq?apercu-cookies", { apercu: true, choix: null });
  assert.match(html, /^<div role="dialog" aria-modal="false" aria-labelledby="bandeau-cookies-titre" aria-describedby="bandeau-cookies-texte"/, "premier dans la page");
  assert.match(html, /<form [^>]*action="\/cookies\/choix\?apercu-cookies" method="post"/);
  assert.match(html, /<input type="hidden" name="retour" value="\/faq\?apercu-cookies"\/>/);
  assert.match(boutonGeste(html, "fermer"), /aria-label="Fermer et continuer sans accepter"/);
  assert.match(html, /Aperçu du bandeau/);
  assert.match(html, /Pour afficher de la pub qui nous aide à rester gratuits, un partenaire aimerait poser des cookies/);
  // Mêmes classes pour les trois ; sans JavaScript, « Choisir » mène à /cookies#mes-choix
  const boutons = [...html.matchAll(/<(?:button|a)[^>]*class="([^"]*)"[^>]*>(Tout accepter|Tout refuser|Choisir)</g)];
  assert.deepEqual(boutons.map((bouton) => bouton[2]), ["Tout accepter", "Tout refuser", "Choisir"]);
  assert.equal(new Set(boutons.map((bouton) => bouton[1])).size, 1, "même poids visuel");
  boutonGeste(html, "tout-accepter");
  boutonGeste(html, "tout-refuser");
  assert.match(html, /<a href="\/cookies\?apercu-cookies#mes-choix"[^>]*>Choisir<\/a>/);
  assert.doesNotMatch(html, /<iframe|<script/);
});

test("aperçu : un choix valable cache le bandeau ; une autre version le fait revenir", () => {
  const valable = { version: versionApercu, date: Date.now(), reponses: { publicite: false } };
  assert.doesNotMatch(rendre("/?apercu-cookies", { apercu: true, choix: valable }), /role="dialog"/);
  assert.match(rendre("/?apercu-cookies", { apercu: true, choix: null }), /role="dialog"/);
});

test("formulaire de /cookies#mes-choix : POST qui marche sans JavaScript, interrupteurs décochés par défaut, puis le choix actuel", () => {
  const sansChoix = rendre("/cookies?apercu-cookies", { apercu: true, choix: null }, h(ReglagesCookies));
  const formulaire = sansChoix.slice(sansChoix.indexOf('<main id="contenu">'));
  assert.match(formulaire, /<form [^>]*action="\/cookies\/choix\?apercu-cookies" method="post"/);
  assert.match(formulaire, /name="retour" value="\/cookies\?apercu-cookies#mes-choix"/);
  assert.match(formulaire, /Tu n&#x27;as encore rien choisi/);
  const interrupteur = formulaire.match(/<input id="page-cookies-publicite"[^>]*>/)?.[0] ?? "";
  for (const attribut of ['type="checkbox"', 'role="switch"', 'name="accepter"', 'value="publicite"']) assert.ok(interrupteur.includes(attribut), attribut);
  assert.doesNotMatch(interrupteur, /checked/);
  for (const geste of ["enregistrer", "tout-refuser", "tout-accepter"]) boutonGeste(formulaire, geste);

  const date = Date.UTC(2026, 9, 14, 10);
  const accepte = rendre("/cookies?apercu-cookies", { apercu: true, choix: { version: versionApercu, date, reponses: { publicite: true } } }, h(ReglagesCookies));
  assert.match(accepte, /<input id="page-cookies-publicite"[^>]*checked=""/);
  assert.match(accepte, /Ton choix du 14 octobre 2026 vaut jusqu&#x27;au 14 avril 2027/);
});

test("« Gérer mes cookies » : un vrai lien vers /cookies#mes-choix (sans JavaScript, ou sans rien à choisir)", () => {
  const html = rendre("/", { apercu: false, choix: null }, h(LienGererCookies, { href: "https://sosmiam.fr/cookies#mes-choix", children: "Gérer mes cookies" }));
  assert.match(html, /<a href="https:\/\/sosmiam\.fr\/cookies#mes-choix">Gérer mes cookies<\/a>/);
});

test("ContenuExterne : sans accord, une vignette et aucune iframe ; même avec accord, jamais d'iframe dans le HTML du serveur", () => {
  const proprietes = { fournisseur: "YouTube", genre: "video" as const, titre: "Le BIG SOS de Chez Exemple", lienDirect: "https://www.youtube.com/watch?v=exemple" };
  const sansAccord = rendre("/", { apercu: false, choix: null }, h(ContenuExterne, { ...proprietes, children: IFRAME }));
  assert.doesNotMatch(sansAccord, /<iframe|<script|youtube-nocookie/);
  assert.match(sansAccord, /Cette vidéo vient de YouTube, qui pose des cookies\./);
  assert.match(sansAccord, /<a href="https:\/\/www\.youtube\.com\/watch\?v=exemple"[^>]*>Voir sur YouTube<\/a>/);
  assert.doesNotMatch(sansAccord, /Toujours afficher/, "catégorie inactive : pas de « Toujours afficher »");
  assert.doesNotMatch(sansAccord, /Afficher quand même/, "bouton qui demande JavaScript : seulement après l'hydratation");

  // Catégorie active (partenaire déclaré) mais pas encore acceptée : « Toujours afficher les vidéos » est un formulaire POST
  const categories = choisirCategoriesConsentement(false).map((categorie) => (categorie.id === "contenus-externes" ? { ...categorie, active: true } : categorie));
  const valeur = (accepte: boolean): Valeur => ({
    apercu: false,
    categories,
    aChoisir: listerCategoriesAChoisir(categories),
    choix: accepte ? { version: "x", date: Date.now(), reponses: { "contenus-externes": true } } : null,
    aConsenti: (categorie) => categorie === "necessaires" || accepte,
    ouvrirReglages: () => false,
    envoyerFormulaire: () => {},
    actionFormulaire: "/cookies/choix",
  });
  const rendreAvec = (accepte: boolean) =>
    renderToStaticMarkup(h(MemoryRouter, { initialEntries: ["/lieux/12"] }, h(ContexteConsentement, { value: valeur(accepte) }, h(ContenuExterne, { ...proprietes, children: IFRAME }))));
  const nonAccepte = rendreAvec(false);
  assert.doesNotMatch(nonAccepte, /<iframe/);
  assert.match(nonAccepte, /<form action="\/cookies\/choix" method="post">.*name="categorie" value="contenus-externes".*value="accepter-categorie"[^>]*>Toujours afficher les vidéos</);
  boutonGeste(nonAccepte, "accepter-categorie");
  const accepte = rendreAvec(true);
  assert.doesNotMatch(accepte, /<iframe/, "le serveur n'écrit jamais l'iframe : une page en cache ne la donne à personne");
  assert.match(accepte, />Le BIG SOS de Chez Exemple</);
});

test("ContenuExterne : le contenu seulement dans le navigateur, et seulement après accord ou « Afficher quand même »", () => {
  assert.equal(choisirAffichageContenuExterne({ consenti: false, afficheUneFois: false, navigateur: true }), "vignette");
  assert.equal(choisirAffichageContenuExterne({ consenti: false, afficheUneFois: false, navigateur: false }), "vignette");
  assert.equal(choisirAffichageContenuExterne({ consenti: true, afficheUneFois: false, navigateur: false }), "attente");
  assert.equal(choisirAffichageContenuExterne({ consenti: true, afficheUneFois: false, navigateur: true }), "contenu");
  assert.equal(choisirAffichageContenuExterne({ consenti: false, afficheUneFois: true, navigateur: true }), "contenu");
});
