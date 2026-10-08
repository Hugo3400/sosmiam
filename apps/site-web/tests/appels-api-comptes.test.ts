// Contrat commun entre l'API et l'espace ambassadeur : les codes d'erreur que le site doit reconnaître (« occupe » quand
// trop de mots de passe sont vérifiés en même temps, « plus-de-place » quand les 10 fondateurs sont là), l'attente après
// des mots de passe faux (2 heures au plus) et le nouveau jeton donné après un changement de mot de passe.
// Une fausse API locale répond ; node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

/** Réponses de la fausse API, par « MÉTHODE chemin » : statut et corps JSON. */
const reponses: Record<string, { statut: number; corps: unknown }> = {
  "POST /comptes/session": { statut: 503, corps: { ok: false, erreur: "occupe" } },
  "POST /comptes/moi/candidature": { statut: 409, corps: { ok: false, erreur: "plus-de-place" } },
  "DELETE /comptes/moi": { statut: 429, corps: { ok: false, erreur: "trop-de-demandes", attente: 7200 } },
  "POST /comptes/moi/mot-de-passe": { statut: 200, corps: { ok: true, session: "nouveau-jeton-de-session-de-43-caracteres-x" } },
  "GET /comptes/moi/candidature": { statut: 200, corps: { ok: true, candidature: null, placesRestantes: 0 } },
  "GET /comptes/session": { statut: 418, corps: { ok: false, erreur: "code-inconnu" } },
};
const serveur = createServer((requete, reponse) => {
  const prevue = reponses[`${requete.method} ${requete.url}`] ?? { statut: 404, corps: { ok: false, erreur: "introuvable" } };
  reponse.writeHead(prevue.statut, { "Content-Type": "application/json" }).end(JSON.stringify(prevue.corps));
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());

// L'adresse de l'API est lue au chargement du service : on la donne avant de l'importer
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
const comptes = await import("../src/services/comptes.server.ts");

test("« occupe » (503) et « plus-de-place » (409) sont reconnus, pas changés en « erreur »", async () => {
  assert.deepEqual(await comptes.connecterCompte("sam@exemple.fr", "une petite phrase de passe", null), { ok: false, erreur: "occupe" });
  const envoi = comptes.envoyerCandidature("jeton", null, {
    pepites: "Trois pépites, et pourquoi.", envies: ["denicher"], motivation: "Parce que j'adore ça.", partantRencontre: true,
  });
  assert.deepEqual(await envoi, { ok: false, erreur: "plus-de-place" });
  assert.deepEqual(await comptes.lireSession("jeton", null), { ok: false, erreur: "erreur" });
});

test("l'attente après des mots de passe faux est gardée, et dite en mots jusqu'à 2 heures", async () => {
  assert.deepEqual(await comptes.supprimerCompte("jeton", null, "pas le bon"), { ok: false, erreur: "trop-de-demandes", attente: 7200 });
  const attendus: [number | undefined, string][] = [
    [undefined, "quelques minutes"], [0, "quelques minutes"], [1, "1 minute"], [120, "2 minutes"], [61, "2 minutes"],
    [3600, "1 heure"], [3840, "1 heure et 4 minutes"], [7143, "2 heures"], [7200, "2 heures"],
  ];
  for (const [secondes, texte] of attendus) assert.equal(comptes.decrireAttente(secondes), texte, String(secondes));
});

test("changer de mot de passe rend le nouveau jeton ; la candidature rend les places restantes", async () => {
  const change = await comptes.changerMotDePasse("ancien-jeton", null, "actuel", "un nouveau mot de passe");
  assert.equal(change.ok && change.session, "nouveau-jeton-de-session-de-43-caracteres-x");
  const lue = await comptes.lireCandidature("jeton", null);
  assert.equal(lue.ok && lue.placesRestantes, 0);
});
