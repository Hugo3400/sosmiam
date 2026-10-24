import "../socle/garde-fou.ts";
import type { Request, Response } from "express";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { creerCompte, lireCompte, changerLangueCompte, modifierCompte } = await import("../../src/services/comptes.ts");
const { creerDepotConfirmationsNewsletter } = await import("../../src/services/confirmations-newsletter.ts");
const { creerDemandesNewsletter } = await import("../../src/services/demandes-newsletter.ts");
const { calculerEmpreinteJeton } = await import("../../src/fonctions/securite/calculer-empreinte-jeton.ts");
const { poserLangue } = await import("../../src/middlewares/poser-langue.ts");
const verifications = creerVerifications();
const { egal } = verifications;

function dansLaLangue<T>(langue: string | undefined, faire: () => Promise<T>): Promise<T> {
  const requete = { get: (nom: string) => (nom === "X-Langue" ? langue : undefined) } as unknown as Request;
  return new Promise<T>((fini, rate) => poserLangue(requete, {} as Response, () => void faire().then(fini, rate)));
}
const nouveau = (email: string) => ({ email, motDePasse: "empreinte", prenom: "Camille", ville: "Lyon", quartier: null, cguVersion: "2026-10-15" });

const anglais = await dansLaLangue("en-GB", () => creerCompte(nouveau("en@exemple.fr")));
const francais = await dansLaLangue(undefined, () => creerCompte(nouveau("fr@exemple.fr")));
const explicite = await dansLaLangue("fr", () => creerCompte({ ...nouveau("explicite@exemple.fr"), langue: "en" }));
egal([(await lireCompte(anglais!))?.langue, (await lireCompte(francais!))?.langue, (await lireCompte(explicite!))?.langue], ["en", "fr", "en"], "création : la langue de la demande, ou celle donnée");
await dansLaLangue("en", () => modifierCompte(francais!, { prenom: "Camille" }));
egal((await lireCompte(francais!))?.langue, "fr", "une modification du compte ne change pas sa langue");
await changerLangueCompte(francais!, "en");
egal((await lireCompte(francais!))?.langue, "en", "changerLangueCompte : seul geste qui la change");
await changerLangueCompte(999_999, "en");
egal(await baseDeDonnees.compte.count({ where: { langue: "en" } }), 3, "un compte inconnu : rien ne bouge");

const envois: string[] = [];
const depot = creerDepotConfirmationsNewsletter();
const demandes = creerDemandesNewsletter({
  depot,
  envoyerLien: async (_email, lien) => (envois.push(lien), { ok: true }),
  estDesinscrit: async () => false,
  horloge: () => Date.parse("2026-10-24T10:00:00Z"),
});
await dansLaLangue("en", () => demandes.demander({ email: "sam@exemple.fr", ville: "Nice", ambassadeur: false, telephone: null, beta: false, source: "site" }));
await new Promise((fini) => setTimeout(fini, 20));
egal((await baseDeDonnees.confirmationNewsletter.findUnique({ where: { email: "sam@exemple.fr" }, select: { langue: true } }))?.langue, "en", "l'attente garde la langue de la demande");
const jeton = new URL(envois[0]!).searchParams.get("jeton") ?? "";
egal(await dansLaLangue("fr", () => depot.confirmer(calculerEmpreinteJeton(jeton), new Date("2026-10-24T11:00:00Z"))), true, "confirmation");
egal((await baseDeDonnees.inscriptionNewsletter.findUnique({ where: { email: "sam@exemple.fr" }, select: { langue: true } }))?.langue, "en", "l'inscription reprend la langue de l'attente, pas celle du clic");

await terminerEssai(import.meta.url, essai, verifications.nombre);
