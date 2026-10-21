import "../socle/garde-fou.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { reprendreCompteNonConfirme, rattacherSub } = await import("../../src/services/comptes-externes.ts");
const { reinitialiserMotDePasse } = await import("../../src/services/comptes.ts");
const { calculerEmpreinteJeton } = await import("../../src/fonctions/securite/calculer-empreinte-jeton.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);

const T = new Date("2026-10-21T22:00:00Z");
const lire = (id: number) =>
  baseDeDonnees.compte.findUniqueOrThrow({ where: { id }, select: { motDePasse: true, appleSub: true, googleSub: true, emailVerifieLe: true, jetonReinitialisation: true } });

const pirate = await inserer("comptes", { email: "victime@exemple.fr", prenom: "Pirate", mot_de_passe: "scrypt$faux", apple_sub: "apple-pirate", jeton_reinitialisation: "empreinte", jeton_expire_le: new Date(T.getTime() + 3600_000) });
egal(await reprendreCompteNonConfirme(pirate, "google", "google-victime", T), "ok");
const repris = await lire(pirate);
egal([repris.appleSub, repris.googleSub, repris.jetonReinitialisation, repris.emailVerifieLe?.toISOString()], [null, "google-victime", null, T.toISOString()]);
vrai(repris.motDePasse.startsWith("aucun$"), "mot de passe retiré");
egal(await reprendreCompteNonConfirme(pirate, "apple", "apple-autre", T), "confirme", "une seule reprise : l'e-mail est confirmé ensuite");
egal(await rattacherSub(pirate, "apple", "apple-victime", T), "ok");

const confirme = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa", mot_de_passe: "scrypt$lea", email_verifie_le: T });
egal(await reprendreCompteNonConfirme(confirme, "google", "google-lea", T), "confirme");
egal((await lire(confirme)).motDePasse, "scrypt$lea", "un compte confirmé garde son mot de passe");
egal(await reprendreCompteNonConfirme(999_999, "google", "google-x", T), "introuvable");

const autre = await inserer("comptes", { email: "autre@exemple.fr", prenom: "Autre", mot_de_passe: "scrypt$autre" });
egal(await reprendreCompteNonConfirme(autre, "google", "google-victime", T), "sub-pris");
egal((await lire(autre)).motDePasse, "scrypt$autre", "rien n'est écrit si le sub est pris");

const jeton = "jeton-de-reinitialisation-0001";
const avecApple = await inserer("comptes", {
  email: "oubli@exemple.fr", prenom: "Oubli", mot_de_passe: "scrypt$ancien", apple_sub: "apple-oubli", google_sub: "google-oubli",
  jeton_reinitialisation: calculerEmpreinteJeton(jeton), jeton_expire_le: new Date(T.getTime() + 3600_000),
});
egal(await reinitialiserMotDePasse(avecApple, calculerEmpreinteJeton(jeton), "scrypt$nouveau", T), true);
const oubli = await lire(avecApple);
egal([oubli.motDePasse, oubli.appleSub, oubli.googleSub, oubli.emailVerifieLe?.toISOString()], ["scrypt$nouveau", null, null, T.toISOString()]);
egal(await reinitialiserMotDePasse(avecApple, calculerEmpreinteJeton(jeton), "scrypt$encore", T), false, "usage unique");

const jetonConfirme = "jeton-de-reinitialisation-0002";
const garde = await inserer("comptes", {
  email: "garde@exemple.fr", prenom: "Garde", mot_de_passe: "scrypt$ancien", apple_sub: "apple-garde", email_verifie_le: T,
  jeton_reinitialisation: calculerEmpreinteJeton(jetonConfirme), jeton_expire_le: new Date(T.getTime() + 3600_000),
});
egal(await reinitialiserMotDePasse(garde, calculerEmpreinteJeton(jetonConfirme), "scrypt$nouveau", T), true);
egal((await lire(garde)).appleSub, "apple-garde", "e-mail déjà confirmé : Apple reste relié");

await terminerEssai(import.meta.url, essai, verifications.nombre);
