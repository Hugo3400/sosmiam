import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import type { ServiceActivite } from "@sos-miam/commun/client-api/contrat-activite";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { ajouterGesteEnAttente } from "@sos-miam/commun/fonctions/activite/ajouter-geste-en-attente";
import { appliquerGesteActivite } from "@sos-miam/commun/fonctions/activite/appliquer-geste-activite";
import { creerActiviteApiVide } from "@sos-miam/commun/fonctions/activite/creer-activite-api-vide";
import { calculerProchainLundiParis } from "@sos-miam/commun/fonctions/temps/calculer-prochain-lundi-paris";
import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import type { ActiviteApi } from "@sos-miam/commun/types/activite";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { GesteActiviteEnAttente } from "@sos-miam/commun/types/geste-activite";
import type { FinRescousse } from "~/hooks/utiliser-activite";
import { effacerActiviteCompte, enregistrerActiviteCompte, lireActiviteApi, lireActiviteCompte } from "~/stockage/activite-compte";
import { effacerActiviteLocale } from "~/stockage/activite-locale";

/** Nouveaux essais des gestes qui attendent le réseau : 30 s, puis 2 min, puis toutes les 10 min (ou ce que dit Retry-After) */
const ATTENTES_MS = [30_000, 120_000, 600_000];
/** Au retour dans l'app, l'activité est relue si la dernière lecture date de plus d'une minute */
const RELECTURE_MS = 60_000;
/** Pas de réponse, ou le serveur trébuche : le geste attend un nouvel essai (les autres refus sont définitifs) */
const PASSAGERES = new Set<ErreurService>(["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]);

type Memoire = {
  /** La copie du téléphone est relue : rien ne part avant (ses gestes en attente passent d'abord) */
  pret: boolean;
  serveur: ActiviteApi | null;
  luLe: number;
  /** Le geste parti vers l'API, dont on attend la réponse (une demande à la fois, relectures comprises) */
  enVol: GesteActiviteEnAttente | null;
  /** Les gestes pas encore partis, dans l'ordre */
  file: GesteActiviteEnAttente[];
  relire: boolean;
  occupe: boolean;
  essais: number;
};

/** Ce que l'écran affiche : copie de la mémoire, prise à chaque changement */
type Vue = { actif: boolean; activite: ActiviteApi; serveur: ActiviteApi | null; chargee: boolean; horsLigne: boolean };

/** Avant toute réponse : 3 rescousses, aucune liste (la date de recharge n'est pas affichée) */
const ACTIVITE_VIDE = creerActiviteApiVide();
const vueVide = (actif: boolean): Vue => ({ actif, activite: ACTIVITE_VIDE, serveur: null, chargee: false, horsLigne: false });

const memoireVide = (): Memoire => ({ pret: false, serveur: null, luLe: 0, enVol: null, file: [], relire: false, occupe: false, essais: 0 });

/** La dernière réponse de l'API, sans les rescousses de la semaine passée si le lundi est arrivé depuis */
function mettreAJourSemaine(serveur: ActiviteApi | null, maintenant: number): ActiviteApi {
  const a = serveur ?? creerActiviteApiVide(maintenant);
  if (maintenant < Date.parse(a.rechargeLe)) return a;
  return { ...a, restantes: RESCOUSSES_PAR_SEMAINE, rescoussesSemaine: [], rechargeLe: new Date(calculerProchainLundiParis(maintenant)).toISOString() };
}

/** Ce qu'aura l'API une fois le geste en route arrivé : la base des gestes en attente */
function calculerBase(m: Memoire, maintenant: number): ActiviteApi {
  const a = mettreAJourSemaine(m.serveur, maintenant);
  return m.enVol ? appliquerGesteActivite(a, m.enVol) : a;
}

/** Les rescousses passent devant les autres gestes (on attend leur confirmation), dans leur ordre */
const rescoussesDabord = (file: GesteActiviteEnAttente[]) => [...file.filter((g) => g.quoi === "rescousse"), ...file.filter((g) => g.quoi !== "rescousse")];

function envoyer(service: ServiceActivite, g: GesteActiviteEnAttente): Promise<ReponseApi<{ activite: ActiviteApi; premierSauveteur?: boolean }>> {
  if (g.quoi === "rescousse") return g.oui ? service.donnerRescousse(g.lieuId) : service.reprendreRescousse(g.lieuId);
  if (g.quoi === "garde") return service.garder(g.lieuId, g.oui);
  if (g.quoi === "jaime") return service.aimer(g.publicationId, g.oui);
  if (g.quoi === "masque") return service.masquer(g.publicationId, g.oui);
  return service.suivre(g.cle, g.oui);
}

type Options = {
  /** Vrai quand un compte est connecté : sinon, rien n'est lu, envoyé ni gardé */
  actif: boolean;
  service: ServiceActivite;
  /** Une rescousse confirmée (donnée ou reprise) : les points et les badges du compte ont changé */
  surRescousseConfirmee: () => unknown;
};

/**
 * L'activité du compte connecté, servie par l'API (/app/activite) : affichée tout de suite (dernière réponse, plus les
 * gestes pas encore confirmés), envoyée une demande après l'autre, relectures comprises, pour qu'aucune vieille réponse
 * n'écrase un geste plus récent. Gardes, J'aime, masques et suivis attendent le réseau sur le téléphone ; une rescousse
 * n'attend jamais : sans réseau, elle est défaite et surFin le dit. Relue au retour dans l'app et au lundi (heure de Paris).
 */
export function utiliserFileActivite({ actif, service, surRescousseConfirmee }: Options) {
  const m = useRef<Memoire>(memoireVide());
  // Chaque activation et chaque effacement : une nouvelle génération, les réponses d'avant sont ignorées
  const generation = useRef(0);
  const actifActuel = useRef(actif);
  const fins = useRef(new Map<GesteActiviteEnAttente, (fin: FinRescousse) => void>());
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmer = useRef(surRescousseConfirmee);
  const [vue, setVue] = useState<Vue>(() => vueVide(actif));
  // Compte connecté ou déconnecté : on repart d'une activité vide (la mémoire et la copie suivent, dans l'effet plus bas)
  if (vue.actif !== actif) setVue(vueVide(actif));

  useEffect(() => {
    confirmer.current = surRescousseConfirmee;
  }, [surRescousseConfirmee]);

  /** L'activité affichée à cet instant (lue en mémoire : à jour même entre deux rendus, pour deux appuis rapides) */
  const lireAffichee = useCallback((): ActiviteApi => {
    const memoire = m.current;
    return memoire.file.reduce(appliquerGesteActivite, calculerBase(memoire, Date.now()));
  }, []);

  /** Redessine avec la mémoire (et `enPlus` : chargée, hors ligne) */
  const montrer = useCallback(
    (enPlus: Partial<Pick<Vue, "chargee" | "horsLigne">> = {}) => {
      const activite = lireAffichee();
      const serveur = m.current.serveur;
      setVue((v) => ({ ...v, ...enPlus, activite, serveur }));
    },
    [lireAffichee],
  );

  /** Redessine, et garde la copie sur le téléphone */
  const publier = useCallback(
    (enPlus: Partial<Pick<Vue, "chargee" | "horsLigne">> = {}) => {
      montrer(enPlus);
      const { pret, serveur, luLe, enVol, file } = m.current;
      if (!pret || !actifActuel.current) return;
      enregistrerActiviteCompte({ activite: serveur, luLe, enAttente: enVol ? [enVol, ...file] : file }).catch(() => {});
    },
    [montrer],
  );

  /** Prévient (après le geste en cours) ceux qui attendaient un geste qui ne partira jamais */
  const prevenirOublies = useCallback((fin: FinRescousse) => {
    for (const [geste, surFin] of fins.current) {
      if (geste === m.current.enVol || m.current.file.includes(geste)) continue;
      fins.current.delete(geste);
      void Promise.resolve().then(() => surFin(fin));
    }
  }, []);

  // Le couloir unique : vide la file, puis relit si on le demande. Ne s'arrête que sur un pépin passager (nouvel essai plus tard).
  const pomper = useCallback(async () => {
    const memoire = m.current;
    if (!memoire.pret || memoire.occupe || !actifActuel.current) return;
    const finir = (geste: GesteActiviteEnAttente, fin: FinRescousse) => {
      const surFin = fins.current.get(geste);
      fins.current.delete(geste);
      surFin?.(fin);
    };
    const recevoir = (activite: ActiviteApi) => {
      const maintenant = Date.now();
      memoire.serveur = lireActiviteApi(activite, maintenant) ?? memoire.serveur;
      memoire.luLe = maintenant;
      memoire.essais = 0;
    };
    const gen = generation.current;
    memoire.occupe = true;
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = null;
    let attente: number | null = null;
    // Le pépin passager qui a arrêté le couloir (dit aux rescousses qui n'ont pas pu partir)
    let arret: ErreurService = "hors-ligne";
    try {
      while (gen === generation.current) {
        const geste = memoire.file[0];
        if (!geste && !memoire.relire) break;
        let erreur: ErreurService | null = null;
        let chargee: true | undefined;
        if (geste) {
          memoire.file = memoire.file.slice(1);
          memoire.enVol = geste;
          const r = await envoyer(service, geste);
          if (gen !== generation.current) return;
          memoire.enVol = null;
          if (r.ok) {
            recevoir(r.activite);
            if (geste.quoi === "rescousse") {
              finir(geste, { ok: true, premierSauveteur: geste.oui && r.premierSauveteur === true });
              void confirmer.current();
            }
          } else {
            erreur = r.erreur;
            if (geste.quoi === "rescousse") finir(geste, { ok: false, erreur: r.erreur, details: r.details });
            // Pépin passager : le geste (rejouable) reprend sa place en tête, fusionné avec ceux arrivés entre-temps
            else if (PASSAGERES.has(r.erreur)) {
              const base = calculerBase(memoire, Date.now());
              memoire.file = memoire.file.reduce((f, g) => ajouterGesteEnAttente(f, g, base), ajouterGesteEnAttente([], geste, base));
              prevenirOublies({ ok: true, premierSauveteur: false });
            }
            // Refus définitif (cible disparue…) : le geste part en silence ; l'erreur ne porte pas l'activité, on la relit
            if (r.erreur === "hors-ligne" || r.erreur === "erreur-serveur" || !PASSAGERES.has(r.erreur)) memoire.relire = true;
            if (r.erreur === "trop-de-demandes" && r.details?.attenteS) attente = r.details.attenteS * 1000;
          }
        } else {
          memoire.relire = false;
          const r = await service.lireActivite();
          if (gen !== generation.current) return;
          if (r.ok) recevoir(r.activite);
          else {
            erreur = r.erreur;
            // Pépin passager : on relira au prochain essai ; un autre refus ne se répète pas en boucle
            memoire.relire = PASSAGERES.has(r.erreur);
          }
          chargee = true;
        }
        // Une réponse (même un refus) : le réseau est là ; pas de réponse du tout : hors ligne
        publier({ horsLigne: erreur === "hors-ligne", ...(chargee ? { chargee } : {}) });
        // Session expirée : l'app oublie le compte (FournisseurSession), ce couloir s'arrête avec lui
        if (erreur === "connexion-requise") return;
        if (erreur && !geste && !PASSAGERES.has(erreur)) break;
        if (erreur && PASSAGERES.has(erreur)) {
          arret = erreur;
          attente ??= ATTENTES_MS[Math.min(memoire.essais, ATTENTES_MS.length - 1)];
          memoire.essais += 1;
          break;
        }
      }
      if (gen !== generation.current) return;
      // Les rescousses n'attendent jamais le réseau : celles qui restent sont défaites tout de suite
      if (attente !== null) {
        const rescousses = memoire.file.filter((g) => g.quoi === "rescousse");
        memoire.file = memoire.file.filter((g) => g.quoi !== "rescousse");
        for (const g of rescousses) finir(g, { ok: false, erreur: arret });
        if (rescousses.length > 0) publier();
        minuterie.current = setTimeout(() => void pomper(), attente);
      }
    } finally {
      if (gen === generation.current) memoire.occupe = false;
    }
  }, [service, publier, prevenirOublies]);

  /** Ajoute un geste : affiché tout de suite, envoyé dès que le couloir est libre (et les gestes en attente avec lui) */
  const ajouter = useCallback(
    (geste: GesteActiviteEnAttente, surFin?: (fin: FinRescousse) => void) => {
      if (!actifActuel.current) {
        if (surFin) void Promise.resolve().then(() => surFin({ ok: false, erreur: "connexion-requise" }));
        return;
      }
      const memoire = m.current;
      const file = ajouterGesteEnAttente(memoire.file, geste, calculerBase(memoire, Date.now()));
      memoire.file = geste.quoi === "rescousse" ? rescoussesDabord(file) : file;
      if (surFin) fins.current.set(geste, surFin);
      prevenirOublies({ ok: true, premierSauveteur: false });
      publier();
      void pomper();
    },
    [pomper, publier, prevenirOublies],
  );

  const demanderRelecture = useCallback(() => {
    m.current.relire = true;
    void pomper();
  }, [pomper]);

  /** Oublie tout (mémoire, copie du compte et activité de la démo), sans rien demander au serveur */
  const effacer = useCallback(async () => {
    generation.current += 1;
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = null;
    const pret = m.current.pret;
    m.current = { ...memoireVide(), pret };
    prevenirOublies({ ok: false, erreur: "connexion-requise" });
    montrer();
    await Promise.all([effacerActiviteCompte(), effacerActiviteLocale()]);
  }, [prevenirOublies, montrer]);

  // Compte connecté : la copie du téléphone d'abord (l'app s'ouvre tout de suite, même hors ligne), puis la file et l'API
  useEffect(() => {
    actifActuel.current = actif;
    generation.current += 1;
    const gen = generation.current;
    m.current = memoireVide();
    if (!actif) {
      prevenirOublies({ ok: false, erreur: "connexion-requise" });
      return;
    }
    lireActiviteCompte().then((copie) => {
      if (gen !== generation.current) return;
      const memoire = m.current;
      if (copie) {
        memoire.serveur = copie.activite;
        memoire.luLe = copie.luLe;
        // Des gestes faits pendant la relecture de la copie : après les siens
        const base = mettreAJourSemaine(copie.activite, Date.now());
        memoire.file = rescoussesDabord(memoire.file.reduce((f, g) => ajouterGesteEnAttente(f, g, base), copie.enAttente));
        prevenirOublies({ ok: true, premierSauveteur: false });
      }
      memoire.pret = true;
      memoire.relire = true;
      publier(copie ? { chargee: true } : {});
      void pomper();
    });
    return () => {
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = null;
    };
  }, [actif, pomper, publier, prevenirOublies]);

  // De retour dans l'app : la file repart tout de suite, et l'activité est relue si elle date, ou si le lundi est passé
  useEffect(() => {
    if (!actif) return;
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat !== "active") return;
      const { luLe, serveur } = m.current;
      const maintenant = Date.now();
      const lundiPasse = serveur !== null && maintenant >= Date.parse(serveur.rechargeLe);
      if (maintenant - luLe > RELECTURE_MS || lundiPasse) m.current.relire = true;
      m.current.essais = 0;
      // Les rescousses de la semaine passée disparaissent tout de suite, sans attendre l'API
      if (lundiPasse) montrer();
      void pomper();
    });
    return () => abonnement.remove();
  }, [actif, pomper, montrer]);

  // L'app reste ouverte jusqu'au lundi, heure de Paris : les rescousses reviennent à l'écran, puis l'API confirme
  const rechargeLe = vue.serveur?.rechargeLe;
  useEffect(() => {
    if (!actif || !rechargeLe) return;
    const delai = Math.max(0, Date.parse(rechargeLe) - Date.now()) + 1000;
    const recharge = setTimeout(() => {
      montrer();
      demanderRelecture();
    }, delai);
    return () => clearTimeout(recharge);
  }, [actif, rechargeLe, montrer, demanderRelecture]);

  return useMemo(
    () => ({ activite: vue.activite, serveur: vue.serveur, chargee: vue.chargee, horsLigne: vue.horsLigne, ajouter, lireAffichee, effacer }),
    [vue, ajouter, lireAffichee, effacer],
  );
}
