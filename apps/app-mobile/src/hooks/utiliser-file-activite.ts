import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import type { ServiceActivite } from "@sos-miam/commun/client-api/contrat-activite";
import type { DetailsErreur, ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
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
/** Un même geste qui fait trébucher le serveur autant de fois de suite est lâché (refus définitif) : il ne bloque plus la file */
const ECHECS_SERVEUR_MAX = 3;
const OK: FinRescousse = { ok: true, premierSauveteur: false };

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
  /** « Trop de demandes » : rien ne part avant cet instant (Retry-After), même après un nouveau geste ou un retour dans l'app */
  pasAvant: number;
  /** Le geste qui fait trébucher le serveur (erreur 500), et combien de fois de suite */
  echecs: { geste: GesteActiviteEnAttente; nombre: number } | null;
};

/** Ce que l'écran affiche : copie de la mémoire, prise à chaque changement */
type Vue = { actif: boolean; activite: ActiviteApi; serveur: ActiviteApi | null; chargee: boolean; horsLigne: boolean };

/** Avant toute réponse : 3 rescousses, aucune liste (la date de recharge n'est pas affichée) */
const ACTIVITE_VIDE = creerActiviteApiVide();
const vueVide = (actif: boolean): Vue => ({ actif, activite: ACTIVITE_VIDE, serveur: null, chargee: false, horsLigne: false });

const memoireVide = (): Memoire => ({ pret: false, serveur: null, luLe: 0, enVol: null, file: [], relire: false, occupe: false, essais: 0, pasAvant: 0, echecs: null });

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

/** La file reprise geste après geste sur une nouvelle base (un geste revenu, refusé, ou la copie relue), rescousses devant */
const refusionner = (file: GesteActiviteEnAttente[], base: ActiviteApi) =>
  rescoussesDabord(file.reduce<GesteActiviteEnAttente[]>((f, g) => ajouterGesteEnAttente(f, g, base), []));

/**
 * Une rescousse sortie de la file sans partir : faite si l'affichage la montre comme demandé (reprise, ou déjà donnée) ;
 * sinon, un don refusé d'office (plus de rescousse). Jamais « ok » pour un don qui ne partira pas.
 */
function decrireOubli(geste: GesteActiviteEnAttente, affichee: ActiviteApi): FinRescousse {
  if (geste.quoi !== "rescousse" || !geste.oui || affichee.rescoussesSemaine.includes(geste.lieuId)) return OK;
  return { ok: false, erreur: "plus-de-rescousse" };
}

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
  /** Chaque réponse de l'API (le réseau est là) : de quoi relire le compte s'il n'a pas pu l'être */
  surReponse?: () => unknown;
};

/**
 * L'activité du compte connecté, servie par l'API (/app/activite) : affichée tout de suite (dernière réponse, plus les
 * gestes pas encore confirmés), envoyée une demande après l'autre, relectures comprises, pour qu'aucune vieille réponse
 * n'écrase un geste plus récent. Gardes, J'aime, masques et suivis attendent le réseau sur le téléphone ; une rescousse
 * n'attend jamais : sans réseau, elle est défaite et surFin le dit. Relue au retour dans l'app et au lundi (heure de Paris).
 */
export function utiliserFileActivite({ actif, service, surRescousseConfirmee, surReponse }: Options) {
  const m = useRef<Memoire>(memoireVide());
  // Chaque activation et chaque effacement : une nouvelle génération, les réponses d'avant sont ignorées
  const generation = useRef(0);
  const actifActuel = useRef(actif);
  const fins = useRef(new Map<GesteActiviteEnAttente, (fin: FinRescousse) => void>());
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rappels = useRef({ surRescousseConfirmee, surReponse });
  const [vue, setVue] = useState<Vue>(() => vueVide(actif));
  // Compte connecté ou déconnecté : on repart d'une activité vide (la mémoire et la copie suivent, dans l'effet plus bas)
  if (vue.actif !== actif) setVue(vueVide(actif));

  useEffect(() => {
    rappels.current = { surRescousseConfirmee, surReponse };
  }, [surRescousseConfirmee, surReponse]);

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

  /** Le geste a fini : prévient celui qui l'attendait, tout de suite ou après le geste en cours (`plusTard`) */
  const finir = useCallback((geste: GesteActiviteEnAttente, fin: FinRescousse, plusTard = false) => {
    const surFin = fins.current.get(geste);
    fins.current.delete(geste);
    if (surFin && plusTard) void Promise.resolve().then(() => surFin(fin));
    else surFin?.(fin);
  }, []);

  /**
   * Prévient ceux qui attendaient un geste qui ne partira jamais : `force` pour tous (compte oublié) ; sinon, une rescousse
   * identique au geste en route attend sa réponse, et les autres disent ce que montre l'affichage (decrireOubli).
   */
  const prevenirOublies = useCallback(
    (force?: FinRescousse) => {
      const { enVol, file } = m.current;
      let affichee: ActiviteApi | null = null;
      for (const [geste, surFin] of fins.current) {
        if (geste === enVol || file.includes(geste)) continue;
        fins.current.delete(geste);
        // Don, reprise, don pendant que le premier don est en route : le dernier appui aura la réponse du premier (réseau, premier sauveteur)
        if (!force && enVol?.quoi === "rescousse" && geste.quoi === "rescousse" && enVol.lieuId === geste.lieuId && enVol.oui === geste.oui) {
          const avant = fins.current.get(enVol);
          fins.current.set(enVol, (fin) => {
            avant?.(fin);
            surFin(fin);
          });
          continue;
        }
        affichee ??= lireAffichee();
        const fin = force ?? decrireOubli(geste, affichee);
        void Promise.resolve().then(() => surFin(fin));
      }
    },
    [lireAffichee],
  );

  /** Les rescousses n'attendent jamais le réseau : celles qui restent dans la file sont défaites tout de suite */
  const defaireRescousses = useCallback(
    (erreur: ErreurService) => {
      const memoire = m.current;
      const rescousses = memoire.file.filter((g) => g.quoi === "rescousse");
      if (rescousses.length === 0) return;
      memoire.file = memoire.file.filter((g) => g.quoi !== "rescousse");
      for (const g of rescousses) finir(g, { ok: false, erreur });
      publier();
    },
    [finir, publier],
  );

  // Le couloir unique : vide la file, puis relit si on le demande. Ne s'arrête que sur un pépin passager (nouvel essai plus tard).
  const pomper = useCallback(async () => {
    const memoire = m.current;
    if (!memoire.pret || memoire.occupe || !actifActuel.current) return;
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = null;
    // « Trop de demandes » encore en cours : rien ne part avant l'heure dite (les rescousses, elles, sont défaites tout de suite)
    const patience = memoire.pasAvant - Date.now();
    if (patience > 0) {
      defaireRescousses("trop-de-demandes");
      minuterie.current = setTimeout(() => void pomper(), patience);
      return;
    }
    const recevoir = (activite: ActiviteApi) => {
      const maintenant = Date.now();
      memoire.serveur = lireActiviteApi(activite, maintenant) ?? memoire.serveur;
      memoire.luLe = maintenant;
      memoire.essais = 0;
      void rappels.current.surReponse?.();
    };
    const gen = generation.current;
    memoire.occupe = true;
    let attente: number | null = null;
    // Le pépin passager qui a arrêté le couloir (dit aux rescousses qui n'ont pas pu partir)
    let arret: ErreurService = "hors-ligne";
    // Un geste qui fait trébucher le serveur : les rescousses passent devant, puis on attend en le retrouvant en tête
    let arreterSur: GesteActiviteEnAttente | null = null;
    try {
      while (gen === generation.current) {
        const geste = memoire.file[0];
        if ((!geste && !memoire.relire) || (geste && geste === arreterSur)) break;
        let erreur: ErreurService | null = null;
        let details: DetailsErreur | undefined;
        let chargee: true | undefined;
        if (geste) {
          memoire.file = memoire.file.slice(1);
          memoire.enVol = geste;
          const r = await envoyer(service, geste);
          if (gen !== generation.current) return;
          memoire.enVol = null;
          if (r.ok) {
            recevoir(r.activite);
            if (memoire.echecs?.geste === geste) memoire.echecs = null;
            if (geste.quoi === "rescousse") {
              finir(geste, { ok: true, premierSauveteur: geste.oui && r.premierSauveteur === true });
              void rappels.current.surRescousseConfirmee();
            }
          } else {
            ({ erreur, details } = r);
            const nombre = r.erreur === "erreur-serveur" && geste.quoi !== "rescousse" ? (memoire.echecs?.geste === geste ? memoire.echecs.nombre : 0) + 1 : 0;
            memoire.echecs = nombre > 0 ? { geste, nombre } : null;
            // Trop d'erreurs 500 de suite pour ce geste : il est lâché comme un refus définitif (l'affichage revient à l'API)
            if (nombre >= ECHECS_SERVEUR_MAX) {
              memoire.echecs = null;
              erreur = null;
            }
            if (geste.quoi === "rescousse") finir(geste, { ok: false, erreur: r.erreur, details: r.details });
            // Pépin passager : le geste (rejouable) reprend sa place, fusionné avec ceux arrivés entre-temps (les rescousses devant)
            const revient = geste.quoi !== "rescousse" && erreur !== null && PASSAGERES.has(erreur);
            // Rescousse défaite ou geste revenu : la file est refusionnée (un don qui comptait sur une reprise défaite ne part plus)
            memoire.file = refusionner(revient ? [geste, ...memoire.file] : memoire.file, calculerBase(memoire, Date.now()));
            prevenirOublies();
            // Refus définitif (cible disparue…) : le geste part en silence ; l'erreur ne porte pas l'activité, on la relit
            if (erreur === null || r.erreur === "hors-ligne" || r.erreur === "erreur-serveur" || !PASSAGERES.has(r.erreur)) memoire.relire = true;
          }
        } else {
          memoire.relire = false;
          const r = await service.lireActivite();
          if (gen !== generation.current) return;
          if (r.ok) recevoir(r.activite);
          else {
            ({ erreur, details } = r);
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
          if (erreur === "trop-de-demandes" && details?.attenteS) {
            attente = details.attenteS * 1000;
            memoire.pasAvant = Date.now() + attente;
          }
          attente ??= ATTENTES_MS[Math.min(memoire.essais, ATTENTES_MS.length - 1)];
          memoire.essais += 1;
          // Erreur 500 sur ce seul geste : les rescousses passées devant lui sont quand même essayées
          if (erreur === "erreur-serveur" && geste && geste.quoi !== "rescousse" && memoire.file[0]?.quoi === "rescousse") {
            arreterSur = geste;
            continue;
          }
          break;
        }
      }
      if (gen !== generation.current) return;
      if (attente !== null) {
        defaireRescousses(arret);
        minuterie.current = setTimeout(() => void pomper(), attente);
      }
    } finally {
      if (gen === generation.current) memoire.occupe = false;
    }
  }, [service, publier, finir, prevenirOublies, defaireRescousses]);

  /** Ajoute un geste : affiché tout de suite, envoyé dès que le couloir est libre (et les gestes en attente avec lui) */
  const ajouter = useCallback(
    (geste: GesteActiviteEnAttente, surFin?: (fin: FinRescousse) => void) => {
      if (!actifActuel.current) {
        if (surFin) void Promise.resolve().then(() => surFin({ ok: false, erreur: "connexion-requise" }));
        return;
      }
      const memoire = m.current;
      // Un appui plus ancien sur ce lieu, pas encore parti : remplacé par celui-ci, dont seule la réponse comptera
      for (const g of memoire.file) if (geste.quoi === "rescousse" && g.quoi === "rescousse" && g.lieuId === geste.lieuId) finir(g, OK, true);
      const file = ajouterGesteEnAttente(memoire.file, geste, calculerBase(memoire, Date.now()));
      memoire.file = geste.quoi === "rescousse" ? rescoussesDabord(file) : file;
      if (surFin) fins.current.set(geste, surFin);
      prevenirOublies();
      publier();
      void pomper();
    },
    [pomper, publier, finir, prevenirOublies],
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
        // Des gestes faits pendant la relecture de la copie : après les siens (un don sans rescousse restante est refusé, et dit)
        memoire.file = refusionner([...copie.enAttente, ...memoire.file], mettreAJourSemaine(copie.activite, Date.now()));
        prevenirOublies();
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
