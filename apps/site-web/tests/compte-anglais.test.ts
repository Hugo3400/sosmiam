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

const COMPTE = { prenom: "Zoé", email: "zoe@exemple.fr", points: 0, palier: "curieux", badges: [], creeLe: "2026-10-01T10:00:00.000Z", emailVerifie: true, ambassadeur: null };
const LIMITATION = {
  motif: "haine", motivation: "Des messages insultants.", debut: "2026-10-20T08:00:00.000Z", fin: "2026-10-22T10:00:00.000Z",
  contestation: null, contesteLe: null, reexamineLe: null, active: true, peutContester: true,
};
const reponses: Record<string, { statut: number; corps: unknown }> = {
  "GET /comptes/session": { statut: 200, corps: { ok: true, compte: COMPTE } },
  "GET /comptes/moi/connexions": { statut: 200, corps: { ok: true, connexions: { motDePasse: true, apple: false, google: true } } },
  "GET /comptes/moi/limitation": { statut: 200, corps: { ok: true, limitation: LIMITATION } },
  "POST /comptes/session": { statut: 429, corps: { ok: false, erreur: "trop-de-demandes", attente: 3725 } },
  "POST /comptes": { statut: 400, corps: { ok: false, erreur: "age-minimum" } },
};
const serveur = createServer((requete, reponse) => {
  requete.resume();
  requete.on("end", () => {
    const prevue = reponses[`${requete.method} ${requete.url}`] ?? { statut: 500, corps: { ok: false, erreur: "erreur" } };
    reponse.writeHead(prevue.statut, { "Content-Type": "application/json" }).end(JSON.stringify(prevue.corps));
  });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => {
  serveur.closeAllConnections();
  serveur.close();
});
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
process.env.SOS_MIAM_APPLE_SERVICES_ID = "fr.sosmiam.essai";
process.env.SOS_MIAM_GOOGLE_CLIENT_ID_WEB = "client-essai.apps.googleusercontent.com";

const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { createStaticHandler, createStaticRouter, Outlet, StaticRouterProvider, useActionData, useLoaderData } = await import("react-router");
const { ContexteLangue } = await import("../src/hooks/utiliser-langue.ts");
const { lireLangueRequete } = await import("../src/services/langue.server.ts");
const { cookieSession } = await import("../src/services/session-compte.server.ts");
const pageConnexion = await import("../src/routes/compte/connexion.tsx");
const pageInscription = await import("../src/routes/compte/inscription.tsx");
const pageMonCompte = await import("../src/routes/compte/mon-compte.tsx");

type Module = { default: (props: never) => unknown; loader?: unknown; action?: unknown };
const page = (id: string, chemin: string, module: Module) => ({
  id, path: chemin, loader: module.loader as never, action: module.action as never,
  Component: () => h(module.default as never, { loaderData: useLoaderData(), actionData: useActionData(), params: {}, matches: [] } as never),
});

const handler = createStaticHandler([
  {
    id: "root",
    path: "/",
    loader: ({ request }: { request: Request }) => lireLangueRequete(request),
    Component: () => {
      const { langue, servies } = useLoaderData() as ReturnType<typeof lireLangueRequete>;
      return h(ContexteLangue, { value: { langue, servies } }, h(Outlet));
    },
    children: [page("connexion", "connexion", pageConnexion as Module), page("inscription", "inscription", pageInscription as Module), page("mon-compte", "mon-compte", pageMonCompte as Module)],
  },
]);

const cookieConnecte = (await cookieSession.serialize("j".repeat(40))).split(";")[0];

async function servir(adresse: string, { cookie, formulaire }: { cookie?: string; formulaire?: Record<string, string> } = {}) {
  const entetes: Record<string, string> = { "Accept-Language": "en-GB,en;q=0.9", ...(cookie ? { Cookie: cookie } : {}) };
  const requete = formulaire
    ? new Request(`https://apercu.sosmiam.fr${adresse}`, { method: "POST", body: new URLSearchParams(formulaire), headers: entetes })
    : new Request(`https://apercu.sosmiam.fr${adresse}`, { headers: entetes });
  const contexte = await handler.query(requete);
  assert.ok(!(contexte instanceof Response), "pas de redirection attendue");
  const html = renderToString(h(StaticRouterProvider, { router: createStaticRouter(handler.dataRoutes, contexte), context: contexte, hydrate: false }));
  return html.replace(/<!-- -->/g, "").replace(/[\u00a0\u202f]/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

const racineEn = [{ id: "root", loaderData: { langue: "en" } }];
const titre = (balises: unknown) => (balises as { title?: string }[]).find((balise) => balise.title)?.title;

test("connexion en anglais : boutons imposés d'Apple et de Google, formulaire, QR et messages venus de l'adresse", async () => {
  const html = await servir("/connexion?au-revoir&externe=annule&qr=refuse");
  for (const texte of [
    ">Log in</h1>", "Good to see you again! Log in to get back to your ambassador area.",
    "Your account has been deleted. Thanks for spending some time with SOS Miam!",
    "No worries, nothing's changed. You can try again whenever you like, or use your email instead.",
    "<span>Continue with Apple</span>", "<span>Continue with Google</span>", 'aria-label="Log in with another account"', "or with your email",
    ">Your email</label>", ">Your password</label>", "Forgotten your password?",
    "Log in with the app", "Declined on the phone, so nothing was opened. You can get a new code.", "Get a new code",
    "No account yet?", ">Become an ambassador</a>",
  ]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Connexion", "Continuer avec", "Mot de passe oublié", "Ton e-mail", "Me connecter avec l'app", "Pas encore de compte"]) assert.ok(!html.includes(francais), francais);
  assert.equal(titre(pageConnexion.meta({ loaderData: { espace: "ambassadeur" }, matches: racineEn } as never)), "Log in — SOS Miam");
});

test("connexion en anglais : l'action répond dans la langue de la page", async () => {
  const html = await servir("/connexion?langue=en", { formulaire: { formulaire: "connexion", email: "zoe@exemple.fr", motDePasse: "x" } });
  assert.ok(html.includes("Too many tries – try again in 1 hour and 3 minutes."));
  const vide = await servir("/connexion?langue=en", { formulaire: { formulaire: "connexion", email: "", motDePasse: "" } });
  for (const texte of ["2 fields need fixing.", "Enter your email.", "Enter your password."]) assert.ok(vide.includes(texte), texte);
});

test("inscription en anglais : 18+ sans âge à côté de la date de naissance, et le refus d'âge sans « teen » ni « minor »", async () => {
  const html = await servir("/inscription?langue=en");
  for (const texte of [
    ">Become an ambassador</h1>", "It's free, for over-18s.", ">Your first name (or a nickname)</label>", 'placeholder="you@example.com"',
    "At least 12 characters (16 if it's only numbers).", ">Your date of birth</label>", "It's only used to check your age. We don't keep it.",
    ">Your neighbourhood<span", "(optional)", "I accept the ", 'href="https://sosmiam.fr/en/cgu#ambassadeurs"', "Terms of Use<span class=\"sr-only\">, opens in a new tab</span>",
    "Unsubscribe in one click, no hard feelings 🍟", ">Create my account<", "Already have an account?",
  ]) assert.ok(html.includes(texte), texte);
  assert.doesNotMatch(html, /\b(teens?|minors?|underage)\b|adults only/i);
  const refus = await servir("/inscription?langue=en", {
    formulaire: { formulaire: "inscription", prenom: "Zoé", email: "zoe@exemple.fr", motDePasse: "une petite phrase", dateNaissance: "2012-01-01", ville: "Lyon", cgu: "oui" },
  });
  for (const texte of ["Just a little longer!", "SOS Miam is for over-18s", "when you turn 18", ">Get the newsletter<", 'href="https://sosmiam.fr/en#inscription"']) {
    assert.ok(refus.includes(texte), texte);
  }
  assert.doesNotMatch(refus, /\b(teens?|minors?|underage)\b|patience|newsletter de SOS Miam/i);
});

test("Mon compte en anglais, sans connexion : RGPD, suppression par mail, et le délai d'un mois", async () => {
  const html = await servir("/mon-compte?langue=en&externe=deja-rattache");
  for (const texte of [
    ">My account</h1>", "Your SOS Miam account is already linked to a different Apple or Google account.",
    "Delete my account without logging in", "Subject: “Delete my SOS Miam account”.", "subject=Delete%20my%20SOS%20Miam%20account",
    "My data", "Right of access", "Right to rectification", "Right to erasure", "Right to object", "Right to complain",
    "the CNIL, the French data protection authority", 'href="/en/confidentialite#droits"', "within one month at most",
  ]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Mon compte", "Mes données", "Effacement", "dans un délai"]) assert.ok(!html.includes(francais), francais);
  assert.equal(titre(pageMonCompte.meta({ loaderData: { espace: "site" }, matches: racineEn } as never)), "My account — SOS Miam");
});

test("Mon compte en anglais, connecté : compte limité sobre, motif gardé en français, façons de se connecter et suppression", async () => {
  const html = await servir("/mon-compte?langue=en&connexions=relie&avec=google", { cookie: cookieConnecte });
  for (const texte of [
    "Your account is restricted", "The SOS Miam team has restricted your account until 22 October 2026 at 12:00.",
    '<strong lang="fr">Haine ou harcèlement</strong>', '<dd lang="fr"', "What has to wait until it ends", "Send my appeal", "0 / 1,000 characters",
    "My ways to log in", "Linked! You can now log in with Google, as well as your other ways.", "Unlink<span class=\"sr-only\"> my Google account</span>",
    "My details", "Save changes", "Change my password", ">Log out<", "Careful: this is permanent.", ">Delete my account<", "Back to the home page",
  ]) assert.ok(html.includes(texte), texte);
  for (const francais of ["Ton compte est limité", "Mes façons", "Supprimer mon compte", "C'est relié", "Retour à l'accueil"]) assert.ok(!html.includes(francais), francais);
});

test("le français ne bouge pas quand la personne n'a rien demandé d'autre", async () => {
  const html = await servir("/connexion?langue=fr");
  for (const texte of [">Connexion</h1>", "<span>Continuer avec Apple</span>", "Mot de passe oublié ?", "Me connecter avec l'app", ">Deviens ambassadeur</a>"]) {
    assert.ok(html.includes(texte), texte);
  }
  assert.ok(!html.includes("Log in"));
});
