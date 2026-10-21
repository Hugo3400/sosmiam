import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { choisirEnvoiConfirmation } from "../fonctions/newsletter/choisir-envoi-confirmation.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import {
  DUREE_LIEN_CONFIRMATION_NEWSLETTER, PAGE_CONFIRMATION_NEWSLETTER, type DepotConfirmationsNewsletter, type NouvelleAttenteConfirmation,
} from "./confirmations-newsletter-regles.ts";
import type { NouvelleInscription } from "./inscriptions.ts";

type ResultatEnvoi = { ok: boolean; erreur?: string };

export type EnvoyerLienConfirmation = (email: string, lien: string, expireLe: Date, source: string) => Promise<ResultatEnvoi>;

export type DependancesDemandesNewsletter = {
  depot: DepotConfirmationsNewsletter;
  envoyerLien: EnvoyerLienConfirmation;
  estDesinscrit: (email: string) => Promise<boolean>;
  horloge?: () => number;
};

function noterEchec(erreur: unknown) {
  console.error("Newsletter : lien de confirmation non envoyé :", typeof erreur === "string" ? erreur : resumerErreur(erreur));
}

export function creerDemandesNewsletter({ depot, envoyerLien, estDesinscrit, horloge = Date.now }: DependancesDemandesNewsletter) {
  async function demander({ email: saisi, ville, ambassadeur, telephone, beta, source }: NouvelleInscription): Promise<void> {
    const email = saisi.trim().toLowerCase();
    if (source !== "site" && (await estDesinscrit(email))) return;
    const maintenant = new Date(horloge());
    const attente = await depot.lireAttente(email);
    const choix = choisirEnvoiConfirmation(attente, maintenant);
    if (choix === "attendre") return;
    const jeton = creerJeton();
    const nouvelle: NouvelleAttenteConfirmation = {
      email, ville, ambassadeur, telephone, beta, source,
      jetonEmpreinte: calculerEmpreinteJeton(jeton),
      envoyeLe: maintenant,
      expireLe: new Date(maintenant.getTime() + DUREE_LIEN_CONFIRMATION_NEWSLETTER),
      envois: choix === "renvoi" && attente ? attente.envois + 1 : 1,
    };
    const ecrite = attente ? await depot.remplacerAttente(attente.jetonEmpreinte, nouvelle) : await depot.creerAttente(nouvelle);
    if (!ecrite) return;
    void envoyerLien(email, `${PAGE_CONFIRMATION_NEWSLETTER}?jeton=${jeton}`, nouvelle.expireLe, source)
      .then((resultat) => {
        if (!resultat.ok) noterEchec(resultat.erreur ?? "refusé");
      })
      .catch(noterEchec);
  }

  return { demander };
}
