import { chromium } from "playwright-core";

const LOGICIEL = `http://127.0.0.1:${process.env.PORT_VITE ?? 5197}`;
const PILOTE = `http://127.0.0.1:${process.env.PORT_PILOTE ?? 5199}`;
const MOT_DE_PASSE = "essai-des-ecrans-2026";
const lireJson = async (chemin) => (await fetch(PILOTE + chemin)).json();

const navigateur = await chromium.launch();
const page = await (await navigateur.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
const erreursPage = [];
page.on("pageerror", (erreur) => erreursPage.push(erreur.message.slice(0, 200)));
page.on("dialog", (dialogue) => dialogue.dismiss());

await page.goto(LOGICIEL, { waitUntil: "networkidle" });
await page.getByLabel("Mot de passe", { exact: true }).fill(MOT_DE_PASSE);
await page.getByLabel("Le même, encore une fois").fill(MOT_DE_PASSE);
await page.getByRole("button", { name: /Créer la clé de ce PC/ }).click();
await page.getByRole("button", { name: /C'est fait, je me connecte/ }).waitFor({ timeout: 60_000 });
const cle = await page.evaluate(() => JSON.parse(localStorage.getItem("sosmiam-gestion:coffre")).clePublique);
await lireJson(`/autoriser?cle=${cle}`);
await page.getByRole("button", { name: /C'est fait, je me connecte/ }).click();
await page.getByLabel("Code à 6 chiffres").fill((await lireJson("/code")).code);
await page.getByRole("button", { name: /^Entrer/ }).click();

const menu = page.locator('nav[aria-label="Écrans"] button:not([aria-expanded])');
await menu.first().waitFor();
const total = await menu.count();
const plantes = [];
for (let rang = 0; rang < total; rang++) {
  const bouton = menu.nth(rang);
  const nom = (await bouton.innerText()).split("\n")[0].trim();
  const avant = erreursPage.length;
  await bouton.click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
  const plante = await page.getByText(/Cet écran a planté|Le logiciel a planté/).count();
  if (plante > 0 || erreursPage.length > avant) plantes.push(`${nom}${erreursPage.length > avant ? ` : ${erreursPage.slice(avant).join(" | ")}` : ""}`);
  else console.log(`✅ ${nom}`);
}
await navigateur.close();
if (plantes.length > 0) {
  console.error(`\n❌ ${plantes.length} écran(s) sur ${total} plantent quand le serveur répond en erreur :\n- ${plantes.join("\n- ")}`);
  process.exit(1);
}
console.log(`\n${total} écrans parcourus : aucun ne plante quand le serveur répond en erreur.`);
