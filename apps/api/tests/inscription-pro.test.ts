// Tests de l'inscription sur l'espace pro (POST /comptes avec espace « pro ») : le compte est créé SANS fiche
// d'ambassadeur (aucune demande à valider), la ville n'est pas exigée ; ce compte se connecte, lit et modifie son compte,
// confirme son e-mail, change son mot de passe et s'efface comme les autres. Et le ménage des rattachements clos
// (refusés ou retirés depuis plus d'un an). Tout en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { GARDE_RATTACHEMENT_CLOS, UN_JOUR_PRO } from "../src/services/pro-regles.ts";
import { creerBancPro } from "./outils/creer-banc-pro.ts";

const { banc, memoire, demander, creerCompte, ajouterLieu, creerGerant, fermer } = await creerBancPro();
after(fermer);

const MOT_DE_PASSE = "mon chat adore les croissants";
let numero = 0;
const inscription = (retouches: Record<string, unknown> = {}) => ({
  email: `pro${++numero}@exemple.fr`, motDePasse: MOT_DE_PASSE, prenom: "Léa", dateNaissance: "1990-05-12", cgu: true, espace: "pro", ...retouches,
});

test("espace « pro » : le compte seul, sans fiche d'ambassadeur, et sans ville exigée", async () => {
  const { statut, corps } = await demander("POST", "/comptes", { corps: inscription() });
  assert.equal(statut, 201);
  assert.equal(corps.compte.ambassadeur, null);
  assert.deepEqual(corps.compte.pro, { lieux: [] });
  const garde = [...memoire.comptes.values()].find((compte) => compte.email === corps.compte.email);
  assert.equal(garde?.statutAmbassadeur, null, "aucune demande d'ambassadeur à valider");
  assert.equal(garde?.ville, "");
  // Une ville envoyée quand même n'est pas gardée
  const avecVille = await demander("POST", "/comptes", { corps: inscription({ ville: "Sète", quartier: "Le Port" }) });
  assert.equal(avecVille.statut, 201);
  assert.equal(avecVille.corps.compte.ambassadeur, null);
});

test("sans espace, ou « ambassadeur » : rien ne change (ville exigée, fiche « en-attente ») ; autre valeur : 400", async () => {
  for (const espace of [undefined, "ambassadeur"]) {
    const sansVille = await demander("POST", "/comptes", { corps: inscription({ espace }) });
    assert.equal(sansVille.statut, 400);
    assert.equal(sansVille.corps.champ, "ville");
    const { statut, corps } = await demander("POST", "/comptes", { corps: inscription({ espace, ville: "Nantes" }) });
    assert.equal(statut, 201);
    assert.equal(corps.compte.ambassadeur.statut, "en-attente");
    assert.equal(corps.compte.ambassadeur.ville, "Nantes");
  }
  const autre = await demander("POST", "/comptes", { corps: inscription({ espace: "admin", ville: "Nantes" }) });
  assert.equal(autre.statut, 400);
  assert.equal(autre.corps.champ, "espace");
  // Les règles communes tiennent toujours : âge, CGU
  assert.equal((await demander("POST", "/comptes", { corps: inscription({ dateNaissance: "2015-01-01" }) })).statut, 403);
  assert.equal((await demander("POST", "/comptes", { corps: inscription({ cgu: false }) })).corps.champ, "cgu");
});

test("un compte pro : connexion, session, Mon compte (ville sans effet), e-mail confirmé, mot de passe, suppression", async () => {
  const email = `pro${++numero}@exemple.fr`;
  const inscrit = await demander("POST", "/comptes", { corps: inscription({ email }) });
  const id = [...memoire.comptes.values()].find((compte) => compte.email === email)?.id as number;
  const connexion = await demander("POST", "/comptes/session", { corps: { email, motDePasse: MOT_DE_PASSE } });
  assert.equal(connexion.statut, 201);
  assert.deepEqual(connexion.corps.compte, inscrit.corps.compte);
  const jeton = connexion.corps.session as string;
  assert.equal((await demander("GET", "/comptes/session", { jeton })).corps.compte.ambassadeur, null);

  const modifie = await demander("PATCH", "/comptes/moi", { jeton, corps: { prenom: "Léa B.", ville: "Agde" } });
  assert.equal(modifie.statut, 200);
  assert.equal(modifie.corps.compte.prenom, "Léa B.");
  assert.equal(modifie.corps.compte.ambassadeur, null, "pas de fiche d'ambassadeur créée en passant");

  // Les adresses « ambassadeur actif » lui sont fermées
  assert.equal((await demander("GET", "/comptes/moi/candidature", { jeton })).corps.erreur, "ambassadeur-non-actif");

  // Le lien de confirmation est parti à l'inscription, et il marche
  const envoi = memoire.envois.find((e) => e.compteId === id && e.type === "verification-email");
  const jetonEmail = envoi?.lien.split("#jeton=")[1];
  assert.ok(jetonEmail);
  assert.equal((await demander("POST", "/comptes/verifier-email", { corps: { jeton: jetonEmail } })).statut, 200);
  assert.equal((await demander("GET", "/comptes/session", { jeton })).corps.compte.emailVerifie, true);

  const nouveau = await demander("POST", "/comptes/moi/mot-de-passe", { jeton, corps: { actuel: MOT_DE_PASSE, nouveau: "une toute autre phrase" } });
  assert.equal(nouveau.statut, 200);
  const efface = await demander("DELETE", "/comptes/moi", { jeton: nouveau.corps.session, corps: { motDePasse: "une toute autre phrase" } });
  assert.equal(efface.statut, 200);
  assert.equal(memoire.comptes.has(id), false);
});

test("un compte pro demande à gérer un lieu comme les autres", async () => {
  const connexion = await demander("POST", "/comptes", { corps: inscription() });
  const lieuId = ajouterLieu();
  const demande = await demander("POST", "/comptes/moi/rattachements", {
    jeton: connexion.corps.session, corps: { lieuId, role: "gerant", preuve: "Je suis la gérante." },
  });
  assert.equal(demande.statut, 201);
  const session = await demander("GET", "/comptes/session", { jeton: connexion.corps.session });
  assert.equal(session.corps.compte.pro.lieux[0].statut, "en-attente");
});

test("ménage de nuit : refusés ou retirés effacés 1 an après la décision ; en attente et validés gardés", async () => {
  const depart = banc.horloge;
  memoire.rattachements.splice(0);
  const valide = await creerGerant();
  const refuse = await creerCompte();
  const lieuRefuse = ajouterLieu();
  const demandeRefusee = await demander("POST", "/comptes/moi/rattachements", { jeton: refuse.jeton, corps: { lieuId: lieuRefuse, role: "gerant", preuve: "Moi." } });
  assert.ok(memoire.deciderRattachement(demandeRefusee.corps.id, "refuse", "Pas de preuve."));
  const quitte = await creerGerant();
  assert.equal((await demander("DELETE", `/comptes/moi/rattachements/${memoire.rattachements.find((r) => r.compteId === quitte.id)?.id}`, { jeton: quitte.jeton })).statut, 200);
  const attente = await creerCompte();
  await demander("POST", "/comptes/moi/rattachements", { jeton: attente.jeton, corps: { lieuId: ajouterLieu(), role: "gerant", preuve: "Moi." } });
  assert.equal(memoire.rattachements.length, 4);

  // Pile un an après : rien ne part encore
  assert.equal(memoire.effacerRattachementsClos(depart + GARDE_RATTACHEMENT_CLOS), 0);
  assert.equal(GARDE_RATTACHEMENT_CLOS, 365 * UN_JOUR_PRO);
  // Un an et une seconde : le refusé et le retiré partent, le validé et celui en attente restent (même très vieux)
  assert.equal(memoire.effacerRattachementsClos(depart + GARDE_RATTACHEMENT_CLOS + 1000), 2);
  assert.deepEqual(memoire.rattachements.map((r) => r.statut).sort(), ["en-attente", "valide"]);
  assert.equal(memoire.rattachements.find((r) => r.statut === "valide")?.compteId, valide.id);
  assert.equal(memoire.effacerRattachementsClos(depart + 10 * GARDE_RATTACHEMENT_CLOS), 0);
});
