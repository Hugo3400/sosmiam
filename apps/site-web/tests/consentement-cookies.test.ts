// Consentement aux cookies (src/contenus/cookies-consentement.ts, src/fonctions/consentement/, services/consentement.server.ts) :
// catégories et version, lecture et écriture du choix, 6 mois, changement de version, bandeau caché sans catégorie
// active, aConsenti, formulaire sans JavaScript (POST /cookies/choix) et liste de la page /cookies.
// Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

// Les fichiers importent « ~/… » (alias de src/) : on l'apprend à Node pour ce test
const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const contenus = await import("../src/contenus/cookies-consentement.ts");
const { choisirCategoriesConsentement } = await import("../src/fonctions/consentement/choisir-categories-consentement.ts");
const { listerCategoriesAChoisir } = await import("../src/fonctions/consentement/lister-categories-a-choisir.ts");
const { calculerVersionConsentement } = await import("../src/fonctions/consentement/calculer-version-consentement.ts");
const { calculerFinConsentement } = await import("../src/fonctions/consentement/calculer-fin-consentement.ts");
const { ecrireCookieConsentement } = await import("../src/fonctions/consentement/ecrire-cookie-consentement.ts");
const { lireChoixConsentement } = await import("../src/fonctions/consentement/lire-choix-consentement.ts");
const { choisirReglagesCookieConsentement } = await import("../src/fonctions/consentement/choisir-reglages-cookie-consentement.ts");
const { doitAfficherBandeau } = await import("../src/fonctions/consentement/doit-afficher-bandeau.ts");
const { doitAfficherInformation } = await import("../src/fonctions/consentement/doit-afficher-information.ts");
const { aConsenti } = await import("../src/fonctions/consentement/a-consenti.ts");
const { lireFormulaireConsentement } = await import("../src/fonctions/consentement/lire-formulaire-consentement.ts");
const { creerEffacementsTraceurs } = await import("../src/fonctions/consentement/creer-effacements-traceurs.ts");
const { lireRetourConsentement } = await import("../src/fonctions/consentement/lire-retour-consentement.ts");
const { ecrireRetourConsentement } = await import("../src/fonctions/consentement/ecrire-retour-consentement.ts");
const { estApercuCookies } = await import("../src/fonctions/consentement/est-apercu-cookies.ts");
const { chargerScriptSiConsentement } = await import("../src/fonctions/consentement/charger-script-si-consentement.ts");
const { enregistrerChoixConsentement, lireEtatConsentement } = await import("../src/services/consentement.server.ts");
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");
const { documentCookies } = await import("../src/contenus/legal/cookies.ts");

type Choix = import("../src/types/consentement.ts").ChoixConsentement;
type Categorie = import("../src/contenus/cookies-consentement.ts").CategorieConsentement;

const NOM = "sosmiam-consentement";
const reelles = choisirCategoriesConsentement(false);
const apercu = choisirCategoriesConsentement(true);
const versionApercu = calculerVersionConsentement(apercu);
const LE_14_OCTOBRE = Date.UTC(2026, 9, 14, 10, 30, 0);
const UN_JOUR = 24 * 3600 * 1000;

/** La valeur « nom=valeur » d'un cookie écrit (ce que le navigateur renverra dans l'en-tête Cookie) */
const valeurDe = (cookie: string) => cookie.split(";")[0];

test("catégories : quatre, déclarées une fois ; aujourd'hui, seules les « necessaires » sont actives, sans partenaire ailleurs", () => {
  assert.deepEqual(contenus.categoriesConsentement.map((categorie) => categorie.id), ["necessaires", "contenus-externes", "publicite", "mesure-audience"]);
  for (const categorie of contenus.categoriesConsentement) {
    assert.ok(categorie.nom && categorie.explication && categorie.pourBandeau, categorie.id);
    const traceurs = categorie.partenaires.flatMap((partenaire) => partenaire.traceurs).length;
    assert.equal(categorie.active, traceurs > 0, `${categorie.id} : active seulement si un traceur existe vraiment`);
  }
  assert.deepEqual(listerCategoriesAChoisir(reelles), [], "rien à choisir en production");
  // Aperçu : « publicite » devient active avec le partenaire imaginaire, qui ne charge rien
  const aChoisir = listerCategoriesAChoisir(apercu);
  assert.deepEqual(aChoisir.map((categorie) => categorie.id), ["publicite"]);
  assert.deepEqual(aChoisir[0].partenaires.map((partenaire) => [partenaire.nom, partenaire.domaines.length, partenaire.traceurs.length]), [["Exemple (aperçu)", 0, 0]]);
});

test("aperçu : « ?apercu-cookies » ou l'hôte apercu.sosmiam.fr, jamais ailleurs", () => {
  assert.equal(estApercuCookies("127.0.0.1:5190", new URLSearchParams("apercu-cookies")), true);
  assert.equal(estApercuCookies("sosmiam.fr", new URLSearchParams("x=1&apercu-cookies=")), true);
  assert.equal(estApercuCookies("apercu.sosmiam.fr", new URLSearchParams()), true);
  assert.equal(estApercuCookies("sosmiam.fr", new URLSearchParams()), false);
  assert.equal(estApercuCookies("ambassadeur.sosmiam.fr", new URLSearchParams("apercu=1")), false);
});

test("version : change avec une catégorie ou un partenaire de plus, pas avec une explication", () => {
  const reelle = calculerVersionConsentement(reelles);
  assert.match(reelle, /^[0-9a-z]{1,7}$/);
  assert.notEqual(versionApercu, reelle);
  const avecPartenaire = apercu.map((categorie) =>
    categorie.id === "publicite" ? { ...categorie, partenaires: [...categorie.partenaires, { nom: "Régie", role: "", domaines: [], traceurs: [] }] } : categorie,
  );
  assert.notEqual(calculerVersionConsentement(avecPartenaire), versionApercu);
  const avecCategorie = apercu.map((categorie) => (categorie.id === "contenus-externes" ? { ...categorie, active: true } : categorie));
  assert.notEqual(calculerVersionConsentement(avecCategorie), versionApercu);
  const autreTexte = apercu.map((categorie) => ({ ...categorie, explication: `${categorie.explication} !` }));
  assert.equal(calculerVersionConsentement(autreTexte), versionApercu);
});

test("6 mois : même jour du mois, ou le dernier jour quand il n'existe pas", () => {
  assert.equal(new Date(calculerFinConsentement(LE_14_OCTOBRE)).toISOString(), "2027-04-14T10:30:00.000Z");
  assert.equal(new Date(calculerFinConsentement(Date.UTC(2026, 7, 31))).toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(new Date(calculerFinConsentement(Date.UTC(2027, 7, 31))).toISOString(), "2028-02-29T00:00:00.000Z");
});

test("écriture puis lecture : JSON compact, 6 mois, Domain=sosmiam.fr sur les trois hôtes seulement", () => {
  const choix: Choix = { version: versionApercu, date: LE_14_OCTOBRE, reponses: { publicite: true } };
  const cookie = ecrireCookieConsentement(choix, choisirReglagesCookieConsentement("sosmiam.fr", false), LE_14_OCTOBRE);
  assert.equal(decodeURIComponent(valeurDe(cookie)), `${NOM}={"v":"${versionApercu}","d":${LE_14_OCTOBRE / 1000},"c":{"publicite":1}}`);
  // 182 jours, du 14 octobre au 14 avril
  assert.match(cookie, /; Max-Age=15724800; Path=\/; Domain=sosmiam\.fr; SameSite=Lax; Secure$/);
  assert.doesNotMatch(cookie, /HttpOnly/, "le navigateur doit pouvoir le lire");
  assert.deepEqual(lireChoixConsentement(`autre=1; ${valeurDe(cookie)}`, versionApercu, LE_14_OCTOBRE + UN_JOUR), choix);

  assert.deepEqual(choisirReglagesCookieConsentement("ambassadeur.sosmiam.fr", false), { domaine: "sosmiam.fr", securise: true });
  assert.deepEqual(choisirReglagesCookieConsentement("PRO.sosmiam.fr.", false), { domaine: "sosmiam.fr", securise: true });
  assert.deepEqual(choisirReglagesCookieConsentement("sosmiam.fr", true), { domaine: undefined, securise: true }, "aperçu : l'hôte seul");
  assert.deepEqual(choisirReglagesCookieConsentement("apercu.sosmiam.fr", true), { domaine: undefined, securise: true });
  assert.deepEqual(choisirReglagesCookieConsentement("127.0.0.1:5190", true), { domaine: undefined, securise: false });
  assert.doesNotMatch(ecrireCookieConsentement(choix, { securise: false }, LE_14_OCTOBRE), /Domain|Secure/);
});

test("lecture : expiré après 6 mois, autre version, cookie abîmé → plus de choix ; le plus récent l'emporte", () => {
  const ecrire = (choix: Choix) => valeurDe(ecrireCookieConsentement(choix, { securise: true }, choix.date));
  const choix: Choix = { version: versionApercu, date: LE_14_OCTOBRE, reponses: { publicite: false } };
  const fin = calculerFinConsentement(LE_14_OCTOBRE);
  assert.deepEqual(lireChoixConsentement(ecrire(choix), versionApercu, fin - 1000), choix);
  assert.equal(lireChoixConsentement(ecrire(choix), versionApercu, fin), null, "6 mois pile : le bandeau revient");
  assert.equal(lireChoixConsentement(ecrire(choix), "autre", LE_14_OCTOBRE), null, "nouvelle liste de partenaires : le bandeau revient");
  for (const abime of [`${NOM}=pas-du-json`, `${NOM}=%7B%7D`, `${NOM}=${encodeURIComponent('{"v":"x","d":-1,"c":{}}')}`, `${NOM}=${encodeURIComponent('{"v":"x","d":1,"c":[]}')}`, ""]) {
    assert.equal(lireChoixConsentement(abime, "x", LE_14_OCTOBRE), null, abime);
  }
  // Valeurs inconnues ignorées ; deux cookies du même nom (sosmiam.fr et aperçu) : le plus récent des choix valables
  const bricole = `${NOM}=${encodeURIComponent(`{"v":"${versionApercu}","d":${LE_14_OCTOBRE / 1000},"c":{"publicite":"oui","inconnue":1}}`)}`;
  assert.deepEqual(lireChoixConsentement(bricole, versionApercu, LE_14_OCTOBRE)?.reponses, {});
  const recent = { ...choix, date: LE_14_OCTOBRE + UN_JOUR, reponses: { publicite: true } };
  const autreVersion = { ...choix, version: "zzz", date: LE_14_OCTOBRE + 2 * UN_JOUR };
  assert.deepEqual(lireChoixConsentement(`${ecrire(choix)}; ${ecrire(autreVersion)}; ${ecrire(recent)}`, versionApercu, LE_14_OCTOBRE + 3 * UN_JOUR), recent);
});

test("bandeau caché sans catégorie active, même sans aucun choix ; affiché en aperçu tant qu'une réponse manque", () => {
  assert.equal(doitAfficherBandeau(listerCategoriesAChoisir(reelles), null), false);
  const aChoisir = listerCategoriesAChoisir(apercu);
  assert.equal(doitAfficherBandeau(aChoisir, null), true);
  assert.equal(doitAfficherBandeau(aChoisir, { version: versionApercu, date: LE_14_OCTOBRE, reponses: {} }), true);
  assert.equal(doitAfficherBandeau(aChoisir, { version: versionApercu, date: LE_14_OCTOBRE, reponses: { publicite: false } }), false);
  assert.equal(doitAfficherBandeau(aChoisir, { version: versionApercu, date: LE_14_OCTOBRE, reponses: { publicite: true } }), false);
});

test("bandeau d'information : sans catégorie active et sans « OK » valable seulement, jamais à la place du bandeau des choix", () => {
  const sansChoix = listerCategoriesAChoisir(reelles);
  const versionReelle = calculerVersionConsentement(reelles);
  assert.equal(doitAfficherInformation(sansChoix, null), true);
  assert.equal(doitAfficherInformation(sansChoix, { version: versionReelle, date: LE_14_OCTOBRE, reponses: {} }), false);
  assert.equal(doitAfficherInformation(listerCategoriesAChoisir(apercu), null), false);
});

test("aConsenti : les nécessaires toujours ; le reste seulement accepté, jamais par défaut", () => {
  const choix = (reponses: Choix["reponses"]): Choix => ({ version: versionApercu, date: LE_14_OCTOBRE, reponses });
  assert.equal(aConsenti("necessaires", null), true);
  assert.equal(aConsenti("publicite", null), false);
  assert.equal(aConsenti("publicite", choix({})), false);
  assert.equal(aConsenti("publicite", choix({ publicite: false })), false);
  assert.equal(aConsenti("publicite", choix({ publicite: true })), true);
  assert.equal(aConsenti("contenus-externes", choix({ publicite: true })), false);
});

test("formulaire : tout accepter, tout refuser, la croix (refus de ce qui manque), les interrupteurs, « Toujours afficher »", () => {
  const deux = choisirCategoriesConsentement(true).map((categorie) =>
    categorie.id === "contenus-externes" ? { ...categorie, active: true } : categorie,
  );
  const aChoisir = listerCategoriesAChoisir(deux);
  const envoi = (champs: [string, string][]) => {
    const formulaire = new FormData();
    for (const [nom, valeur] of champs) formulaire.append(nom, valeur);
    return formulaire;
  };
  const actuel: Choix = { version: "x", date: LE_14_OCTOBRE, reponses: { "contenus-externes": true } };
  assert.deepEqual(lireFormulaireConsentement(envoi([["geste", "tout-accepter"]]), aChoisir, null), { "contenus-externes": true, publicite: true });
  assert.deepEqual(lireFormulaireConsentement(envoi([["geste", "tout-refuser"]]), aChoisir, actuel), { "contenus-externes": false, publicite: false });
  assert.deepEqual(lireFormulaireConsentement(envoi([["geste", "fermer"]]), aChoisir, null), { "contenus-externes": false, publicite: false });
  assert.deepEqual(lireFormulaireConsentement(envoi([["geste", "fermer"]]), aChoisir, actuel), { "contenus-externes": true, publicite: false });
  assert.deepEqual(
    lireFormulaireConsentement(envoi([["geste", "enregistrer"], ["accepter", "publicite"], ["accepter", "mesure-audience"]]), aChoisir, actuel),
    { "contenus-externes": false, publicite: true },
    "décoché = refusé ; une catégorie inactive est ignorée",
  );
  assert.deepEqual(
    lireFormulaireConsentement(envoi([["geste", "accepter-categorie"], ["categorie", "contenus-externes"]]), aChoisir, null),
    { "contenus-externes": true },
    "« Toujours afficher les vidéos » : la pub reste sans réponse, le bandeau reste",
  );
});

test("retrait : les cookies connus de la catégorie sont effacés sur l'hôte et sur sosmiam.fr", () => {
  const pub: Categorie = {
    id: "publicite", nom: "", explication: "", pourBandeau: "", active: true,
    partenaires: [{ nom: "Régie", role: "", domaines: ["regie.example"], traceurs: [{ nom: "regie_id", finalite: "", duree: "" }, { nom: "_regie_*", finalite: "", duree: "" }] }],
  };
  const effacements = creerEffacementsTraceurs([pub], "_regie_a=1; autre=2; _regie_b=3", "pro.sosmiam.fr");
  assert.equal(effacements.length, 9);
  assert.ok(effacements.includes("regie_id=; Max-Age=0; Path=/; Secure"));
  assert.ok(effacements.includes("_regie_a=; Max-Age=0; Path=/; Domain=sosmiam.fr; Secure"));
  assert.ok(effacements.includes("_regie_b=; Max-Age=0; Path=/; Domain=pro.sosmiam.fr; Secure"));
  assert.ok(!effacements.some((effacement) => effacement.startsWith("autre=")));
  assert.deepEqual(creerEffacementsTraceurs([pub], "", "127.0.0.1:5190"), ["regie_id=; Max-Age=0; Path=/"]);
});

test("retour après un envoi sans JavaScript : un chemin du site seulement", () => {
  assert.equal(ecrireRetourConsentement("/faq", "?apercu-cookies="), "/faq?apercu-cookies");
  assert.equal(ecrireRetourConsentement("/cookies", "?apercu-cookies=&q=prix", "#mes-choix"), "/cookies?apercu-cookies&q=prix#mes-choix");
  assert.equal(ecrireRetourConsentement("/", ""), "/");
  for (const bon of ["/", "/faq", "/cookies?apercu-cookies#mes-choix", "/lieux/12?apercu-cookies"]) assert.equal(lireRetourConsentement(bon), bon);
  for (const mauvais of ["//exemple.fr", "/\\exemple.fr", "https://exemple.fr", "javascript:alert(1)", "faq", "/a b", null, 12]) {
    assert.equal(lireRetourConsentement(mauvais), null, String(mauvais));
  }
});

test("formulaire sans JavaScript : POST /cookies/choix enregistre le choix (303), le retire, et ne pose rien sans catégorie active", async () => {
  const poster = (adresse: string, champs: Record<string, string>, cookie = "") =>
    enregistrerChoixConsentement(new Request(adresse, { method: "POST", body: new URLSearchParams(champs), headers: cookie ? { Cookie: cookie } : {} }));

  const accepte = await poster("https://sosmiam.fr/cookies/choix?apercu-cookies", { geste: "tout-accepter", retour: "/faq?apercu-cookies" });
  assert.equal(accepte.status, 303);
  assert.equal(accepte.headers.get("Location"), "/faq?apercu-cookies");
  const [cookie] = accepte.headers.getSetCookie();
  assert.doesNotMatch(cookie, /Domain=/, "aperçu : jamais sur tout sosmiam.fr");
  const lu = lireChoixConsentement(valeurDe(cookie), versionApercu, Date.now());
  assert.deepEqual(lu?.reponses, { publicite: true });

  const refuse = await poster("https://sosmiam.fr/cookies/choix?apercu-cookies", { geste: "enregistrer", retour: "/cookies#mes-choix" }, valeurDe(cookie));
  assert.equal(refuse.headers.get("Location"), "/cookies#mes-choix");
  assert.deepEqual(lireChoixConsentement(valeurDe(refuse.headers.getSetCookie()[0]), versionApercu, Date.now())?.reponses, { publicite: false });

  // Retour piégé : l'accueil ; production sans catégorie active : aucun cookie
  const piege = await poster("https://sosmiam.fr/cookies/choix", { geste: "tout-accepter", retour: "//exemple.fr" });
  assert.equal(piege.headers.get("Location"), "/");
  assert.deepEqual(piege.headers.getSetCookie(), []);

  // « OK, compris » du bandeau d'information : un choix sans réponse, 6 mois, pour les trois hôtes
  const vu = await poster("https://sosmiam.fr/cookies/choix", { geste: contenus.GESTE_INFORMATION_COOKIES, retour: "/en/faq" });
  assert.equal(vu.headers.get("Location"), "/en/faq");
  const [cookieVu] = vu.headers.getSetCookie();
  assert.match(cookieVu, /Domain=sosmiam\.fr/);
  assert.deepEqual(lireChoixConsentement(valeurDe(cookieVu), calculerVersionConsentement(reelles), Date.now())?.reponses, {});
  assert.deepEqual(lireEtatConsentement(new Request("https://sosmiam.fr/", { headers: { Cookie: valeurDe(cookieVu) } })).choix?.reponses, {});

  // Le loader de root.tsx relit le choix de la requête
  assert.deepEqual(lireEtatConsentement(new Request("https://sosmiam.fr/?apercu-cookies", { headers: { Cookie: valeurDe(cookie) } })).choix?.reponses, { publicite: true });
  assert.deepEqual(lireEtatConsentement(new Request("https://sosmiam.fr/", { headers: { Cookie: valeurDe(cookie) } })), { apercu: false, choix: null });
});

test("POST /cookies/choix est servi sur les trois hôtes (une 301 perdrait le choix)", () => {
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) assert.equal(choisirRedirectionHote(hote, "/cookies/choix"), null, hote);
  assert.equal(choisirRedirectionHote("ambassadeur.sosmiam.fr", "/cookies")?.adresse, "https://sosmiam.fr/cookies");
});

test("chargerScriptSiConsentement : rien sur le serveur, sans erreur", () => {
  const arreter = chargerScriptSiConsentement("publicite", "https://regie.example/pub.js");
  assert.equal(typeof arreter, "function");
  arreter();
});

test("page /cookies : chaque traceur « nécessaire » déclaré est dans la liste, et inversement", () => {
  const tableau = documentCookies.sections
    .find((section) => section.id === "liste-des-cookies")
    ?.blocs.find((bloc) => typeof bloc === "object" && "tableau" in bloc);
  assert.ok(tableau && typeof tableau === "object" && "tableau" in tableau);
  const noms = tableau.tableau.lignes.map((ligne) => ligne[0].replace(/ \(stockage de session\)$/, ""));
  const declares = contenus.categoriesConsentement[0].partenaires.flatMap((partenaire) => partenaire.traceurs.map((traceur) => traceur.nom));
  assert.deepEqual([...noms].sort(), [...declares].sort());
  assert.ok(noms.includes(NOM));
});
