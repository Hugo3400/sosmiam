import "../socle/garde-fou.ts";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const dossierTemporaire = fileURLToPath(new URL("../../../../temporaire/", import.meta.url));
mkdirSync(dossierTemporaire, { recursive: true });
const dossierDesinscrits = mkdtempSync(join(dossierTemporaire, "essai-desinscrits-"));
process.env.FICHIER_DESINSCRITS = join(dossierDesinscrits, "desinscrits.txt");

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { creerDepotConfirmationsNewsletter, effacerConfirmationsNewsletterExpirees } = await import("../../src/services/confirmations-newsletter.ts");
const { creerDemandesNewsletter } = await import("../../src/services/demandes-newsletter.ts");
const { exporterInscrits, inscrireComptesAppNewsletter, listerInscrits } = await import("../../src/services/gestion/newsletter.ts");
const { calculerEmpreinteJeton } = await import("../../src/fonctions/securite/calculer-empreinte-jeton.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);

const T = new Date("2026-10-22T10:00:00Z");
const HEURE = 3600_000;
const banc = { maintenant: T.getTime() };
const envois: { email: string; lien: string; source: string }[] = [];
const depot = creerDepotConfirmationsNewsletter();
const demandes = creerDemandesNewsletter({
  depot,
  horloge: () => banc.maintenant,
  estDesinscrit: async () => false,
  envoyerLien: async (email, lien, _expireLe, source) => {
    envois.push({ email, lien, source });
    return { ok: true };
  },
});
const attendreEnvois = () => new Promise<void>((fini) => setImmediate(() => setImmediate(fini)));
const empreinteDu = (lien: string) => calculerEmpreinteJeton(new URL(lien).searchParams.get("jeton") ?? "");
const site = (email: string, champs: Partial<{ ville: string; telephone: "iphone" | "android"; beta: boolean; ambassadeur: boolean }> = {}) =>
  ({ email, ville: champs.ville ?? null, telephone: champs.telephone ?? null, beta: champs.beta ?? false, ambassadeur: champs.ambassadeur ?? false, source: "site" });
const inscrits = async () => (await essai.sql("SELECT email FROM inscriptions_newsletter ORDER BY email")).map((ligne) => ligne.email);
const attentes = async () => (await essai.sql("SELECT email, envois, jeton_empreinte FROM confirmations_newsletter ORDER BY email"))
  .map((ligne) => [ligne.email, Number(ligne.envois), String(ligne.jeton_empreinte).length]);

await inserer("inscriptions_newsletter", { email: "ancien@exemple.fr", ville: "Lunel", source: "site", premiere_inscription: new Date("2026-10-01T08:00:00Z") });

await demandes.demander(site("Lea@Exemple.fr", { ville: "Sète", telephone: "iphone", beta: true, ambassadeur: true }));
await attendreEnvois();
egal(envois.map((envoi) => [envoi.email, envoi.source]), [["lea@exemple.fr", "site"]], "un mail, adresse en minuscules");
egal(await attentes(), [["lea@exemple.fr", 1, 64]], "l'attente garde une empreinte SHA-256 de 64 caractères");
const [ligne] = await essai.sql("SELECT jeton_empreinte, expire_le, envoye_le FROM confirmations_newsletter");
egal(ligne?.jeton_empreinte, empreinteDu(envois[0]!.lien), "l'empreinte du jeton du lien, jamais le jeton");
egal(new Date(String(ligne?.expire_le)).getTime() - new Date(String(ligne?.envoye_le)).getTime(), 7 * 24 * HEURE, "valable 7 jours");
egal(await inscrits(), ["ancien@exemple.fr"], "pas encore inscrite : la liste d'envoi ne lit que inscriptions_newsletter");
egal((await listerInscrits({ recherche: "", ville: "", ambassadeur: false, beta: false, telephone: "", aRelancer: false, page: 1 }, T)).total, 1, "le logiciel ne la voit pas");
vrai(!(await exporterInscrits(T)).includes("lea@exemple.fr"), "ni l'export");

await demandes.demander(site("lea@exemple.fr"));
await attendreEnvois();
egal(envois.length, 1, "une adresse en attente ne reçoit pas un nouveau mail tout de suite");
banc.maintenant += HEURE;
await demandes.demander(site("lea@exemple.fr", { ville: "Sète", telephone: "iphone", beta: true, ambassadeur: true }));
await attendreEnvois();
egal(envois.length, 2, "une heure plus tard, un nouveau lien");
egal(await attentes(), [["lea@exemple.fr", 2, 64]]);
egal(await depot.confirmer(empreinteDu(envois[0]!.lien), new Date(banc.maintenant)), false, "l'ancien lien est remplacé");
const [premier, second] = await Promise.all([1, 2].map(() => depot.confirmer(empreinteDu(envois[1]!.lien), new Date(banc.maintenant))));
egal([premier, second].sort(), [false, true], "deux clics en même temps : une seule confirmation");
egal(await attentes(), [], "l'attente part avec la confirmation");
const [lea] = await essai.sql("SELECT ville, telephone, beta, ambassadeur, source, derniere_inscription FROM inscriptions_newsletter WHERE email = 'lea@exemple.fr'");
egal([lea?.ville, lea?.telephone, lea?.beta, lea?.ambassadeur, lea?.source], ["Sète", "iphone", "t", "t", "site"], "inscrite avec ses choix");
egal(await depot.confirmer(empreinteDu(envois[1]!.lien), new Date(banc.maintenant)), false, "un lien ne sert qu'une fois");

await Promise.all([demandes.demander(site("duo@exemple.fr")), demandes.demander(site("duo@exemple.fr"))]);
await attendreEnvois();
egal(envois.filter((envoi) => envoi.email === "duo@exemple.fr").length, 1, "deux demandes en même temps : un seul mail");

await demandes.demander(site("ancien@exemple.fr", { telephone: "android" }));
await attendreEnvois();
egal((await essai.sql("SELECT telephone FROM inscriptions_newsletter WHERE email = 'ancien@exemple.fr'"))[0]?.telephone, null, "rien ne change avant le clic");
await depot.confirmer(empreinteDu(envois.at(-1)!.lien), new Date(banc.maintenant));
const [ancien] = await essai.sql("SELECT ville, telephone, premiere_inscription FROM inscriptions_newsletter WHERE email = 'ancien@exemple.fr'");
egal([ancien?.ville, ancien?.telephone, new Date(String(ancien?.premiere_inscription)).toISOString()], ["Lunel", "android", "2026-10-01T08:00:00.000Z"], "un inscrit existant reste inscrit, mis à jour après son clic");

banc.maintenant += 8 * 24 * HEURE;
egal(await depot.confirmer(empreinteDu(envois.find((envoi) => envoi.email === "duo@exemple.fr")!.lien), new Date(banc.maintenant)), false, "lien expiré");
egal(await effacerConfirmationsNewsletterExpirees(new Date(banc.maintenant)), 1, "le ménage de nuit efface l'attente expirée");
egal(await attentes(), []);
egal(await inscrits(), ["ancien@exemple.fr", "lea@exemple.fr"]);

const verifie = await inserer("comptes", { email: "verifie@exemple.fr", prenom: "Véri", email_verifie_le: T });
const pasVerifie = await inserer("comptes", { email: "pas-verifie@exemple.fr", prenom: "Pas" });
for (const compteId of [verifie, pasVerifie]) await inserer("sessions_comptes", { compte_id: compteId, empreinte: `session-${compteId}`, support: "app" });
egal(await inscrireComptesAppNewsletter(T), { comptes: 1, inscrits: 1, desinscrits: 0 }, "l'action du logiciel n'inscrit que les e-mails confirmés");
vrai(!(await inscrits()).includes("pas-verifie@exemple.fr"));

rmSync(dossierDesinscrits, { recursive: true, force: true });
await terminerEssai(import.meta.url, essai, verifications.nombre);
