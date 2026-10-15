import {
  effacerChoixOffresARenvoyer,
  enregistrerChoixOffresARenvoyer,
  lireChoixOffresARenvoyer,
  type ChoixTelephone,
} from "~/stockage/choix-offres-a-renvoyer";

export type IssueEnvoiOffres = "parti" | "a-renvoyer" | "sans-suite";
export type EnvoyerOffres = (choix: ChoixTelephone, valable: () => boolean) => Promise<IssueEnvoiOffres>;

const ATTENTES_MS = [30_000, 120_000, 600_000];
const ENVOI_MAX_MS = 60_000;

type Choix = { valeur: ChoixTelephone; numero: number };

function envoyerSansBloquer(envoyer: EnvoyerOffres, valeur: ChoixTelephone): Promise<IssueEnvoiOffres> {
  let abandonne = false;
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<IssueEnvoiOffres>((repondre) => {
    minuterie = setTimeout(() => {
      abandonne = true;
      repondre("a-renvoyer");
    }, ENVOI_MAX_MS);
  });
  const envoi = Promise.resolve()
    .then(() => envoyer(valeur, () => !abandonne))
    .catch((): IssueEnvoiOffres => "a-renvoyer");
  return Promise.race([envoi, limite]).finally(() => clearTimeout(minuterie));
}

export function creerRenvoiChoixOffres() {
  let choix: Choix | null | undefined;
  let chargement: Promise<void> | null = null;
  let numero = 0;
  let enAttente = false;
  let essais = 0;
  let minuterie: ReturnType<typeof setTimeout> | null = null;
  let envoyerCourant: EnvoyerOffres | null = null;
  let couloir: Promise<unknown> = Promise.resolve();
  let ecritures: Promise<unknown> = Promise.resolve();
  let tourPrevu: Promise<void> | null = null;
  let enVol: { choix: Choix; tour: Promise<void> } | null = null;
  const ecouteurs = new Set<() => void>();

  const montrer = (valeur: boolean) => {
    if (enAttente === valeur) return;
    enAttente = valeur;
    for (const ecouteur of [...ecouteurs]) ecouteur();
  };

  const persister = () => {
    ecritures = ecritures.then(() => (choix ? enregistrerChoixOffresARenvoyer(choix.valeur) : effacerChoixOffresARenvoyer()));
    return ecritures;
  };

  const charger = () => {
    chargement ??= lireChoixOffresARenvoyer().then((valeur) => {
      if (choix !== undefined) return;
      choix = valeur === null ? null : { valeur, numero: ++numero };
      if (choix) montrer(true);
    });
    return chargement;
  };

  const annulerMinuterie = () => {
    if (minuterie) clearTimeout(minuterie);
    minuterie = null;
  };

  const programmer = () => {
    annulerMinuterie();
    const attente = ATTENTES_MS[Math.min(essais, ATTENTES_MS.length - 1)];
    essais += 1;
    minuterie = setTimeout(() => {
      minuterie = null;
      void lancer();
    }, attente);
  };

  async function faireUnTour(tour: Promise<void>) {
    tourPrevu = null;
    await charger();
    const envoi = choix;
    const envoyer = envoyerCourant;
    if (!envoi || !envoyer) {
      if (!envoi) montrer(false);
      return;
    }
    enVol = { choix: envoi, tour };
    const issue = await envoyerSansBloquer(envoyer, envoi.valeur);
    enVol = null;
    if (issue === "a-renvoyer") {
      if (choix) montrer(true);
      if (!tourPrevu) programmer();
      return;
    }
    essais = 0;
    if (choix !== envoi) return;
    choix = null;
    montrer(false);
    await persister();
  }

  function lancer(envoyer?: EnvoyerOffres): Promise<void> {
    if (envoyer) envoyerCourant = envoyer;
    annulerMinuterie();
    if (tourPrevu) return tourPrevu;
    if (enVol && enVol.choix === choix) return enVol.tour;
    const tour: Promise<void> = couloir.then(() => faireUnTour(tour));
    tourPrevu = tour;
    couloir = tour.catch(() => undefined);
    return tour;
  }

  async function choisir(valeur: ChoixTelephone, envoyer: EnvoyerOffres): Promise<void> {
    choix = { valeur, numero: ++numero };
    await persister();
    await lancer(envoyer);
  }

  return {
    choisir,
    renvoyer: (envoyer: EnvoyerOffres) => lancer(envoyer),
    lireEnAttente: () => enAttente,
    abonner: (ecouteur: () => void) => {
      ecouteurs.add(ecouteur);
      return () => void ecouteurs.delete(ecouteur);
    },
  };
}

export const renvoiChoixOffres = creerRenvoiChoixOffres();
