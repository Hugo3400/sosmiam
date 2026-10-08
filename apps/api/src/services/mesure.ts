// Compteur des visites du site (et plus tard de l'app). Tout se passe en mémoire, puis les totaux sont écrits
// dans la base toutes les 30 secondes (voir demarrer.ts). Ce qui est gardé : des totaux par période et par jour.
// Ce qui n'est jamais gardé : l'adresse IP, la signature du navigateur, une empreinte de visiteur.
// - Visiteurs uniques : chaque période a son secret ; l'empreinte HMAC(secret, IP + navigateur) n'entre que dans une
//   esquisse HyperLogLog (qui ne permet pas de la retrouver). Secret et esquisse sont effacés à la fin de la période.
// - Visites : une visite s'arrête après 30 minutes sans page vue. Son parcours (page d'arrivée, nombre de pages, durée,
//   dernière page) reste en mémoire, 30 minutes au plus après la dernière page, jamais sur le disque ; à sa fin, seuls
//   des totaux sont ajoutés (visites finies, rebonds, durée, pages de sortie).
// - Robots, pages introuvables et clics des boutons de /liens : de simples compteurs du jour, sans visiteur.
import { createHmac, randomBytes } from "node:crypto";

import { calculerClesPeriodes, type ClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import { ajouterAEsquisse } from "../fonctions/mesure/ajouter-a-esquisse.ts";
import { classerTempsReponse } from "../fonctions/mesure/classer-temps-reponse.ts";
import { decrireNavigateur } from "../fonctions/mesure/decrire-navigateur.ts";
import { estRobot } from "../fonctions/mesure/est-robot.ts";
import { estimerEsquisse } from "../fonctions/mesure/estimer-esquisse.ts";
import { lireLangue } from "../fonctions/mesure/lire-langue.ts";
import { nettoyerProvenance } from "../fonctions/mesure/nettoyer-provenance.ts";
import { nommerRobot } from "../fonctions/mesure/nommer-robot.ts";

export type SourceMesure = "site" | "app";
export type TypePeriode = keyof ClesPeriodes;
export type DimensionMesure =
  | "page" | "provenance" | "appareil" | "navigateur" | "systeme" | "pays"
  | "entree" | "sortie" | "campagne" | "langue" | "region" | "ville" | "creneau"
  | "clic" | "robot" | "introuvable" | "temps" | "lente";

export type Vue = {
  source: SourceMesure;
  /** Chemin de la page vue, avec ses paramètres (« /liens?ref=tiktok ») */
  adressePage: string;
  /** Adresse de la page d'où l'on arrive, si le navigateur la donne */
  referent: string | null;
  /** Signature du navigateur (user-agent) */
  signature: string;
  ip: string;
  /** Code pays donné par Cloudflare (« FR ») */
  pays: string | null;
  /** En-tête Accept-Language du navigateur */
  langues?: string | null;
  /** Région et ville approximatives données par Cloudflare (si son réglage « visitor location headers » est actif) */
  region?: string | null;
  ville?: string | null;
  /** Temps de réponse du serveur, en millisecondes */
  duree?: number | null;
  /** 404 : page introuvable (comptée à part, ce n'est pas une vue) */
  statut?: number;
  moment?: Date;
};

export type EtatPeriode = {
  vues: number;
  visites: number;
  visiteurs: number;
  tempsTotal: number;
  pagesMesurees: number;
  esquisse: Uint8Array;
  secret: Uint8Array;
};
export type LigneDetail = { source: SourceMesure; jour: string; dimension: DimensionMesure; valeur: string; nombre: number };
/** Totaux de visites terminées à ajouter à une période (celle du début de la visite) */
export type FinsDeVisites = { source: SourceMesure; type: TypePeriode; cle: string; visitesFinies: number; rebonds: number; dureeVisites: number };

/** Ce dont le compteur a besoin pour garder ses totaux (la base en vrai, un faux dans les tests). */
export type StockageStats = {
  lirePeriode: (source: SourceMesure, type: TypePeriode, cle: string) => Promise<EtatPeriode | null>;
  ecrirePeriode: (source: SourceMesure, type: TypePeriode, cle: string, etat: EtatPeriode) => Promise<void>;
  ajouterDetails: (lignes: LigneDetail[]) => Promise<void>;
  ajouterFinsDeVisites: (lignes: FinsDeVisites[]) => Promise<void>;
  /** Efface secret et esquisse de toutes les périodes de cette source qui ne sont plus en cours */
  fermerPeriodesPassees: (source: SourceMesure, enCours: ClesPeriodes) => Promise<void>;
  /** Efface le détail par jour (pages, provenances…) des jours antérieurs à celui-ci (« AAAA-MM-JJ ») */
  effacerDetailsAvant: (source: SourceMesure, jour: string) => Promise<void>;
};

const TYPES: TypePeriode[] = ["jour", "semaine", "mois", "annee"];
const SOURCES: SourceMesure[] = ["site", "app"];
const DUREE_VISITE = 30 * 60_000;
/** « En ce moment » : vu dans les 5 dernières minutes */
const DUREE_DIRECT = 5 * 60_000;
const TAILLE_ESQUISSE = 4096;
/** Valeurs différentes gardées par jour et par dimension : au-delà, « (autres) » (les adresses se forgent facilement) */
const MAX_VALEURS = 300;
/** Le détail par jour est effacé au bout de 25 mois (durée maximale fixée par la CNIL pour la mesure d'audience) */
const MOIS_DETAILS = 25;
const heureParis = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", hourCycle: "h23", weekday: "short" });
const JOURS_SEMAINE: Record<string, number> = { "lun.": 1, "mar.": 2, "mer.": 3, "jeu.": 4, "ven.": 5, "sam.": 6, "dim.": 7 };

type PeriodeEnMemoire = EtatPeriode & { source: SourceMesure; type: TypePeriode; cle: string; modifiee: boolean };
type VisiteEnCours = { source: SourceMesure; cles: ClesPeriodes; debut: number; dernier: number; pages: number; dernierePage: string };

/** Chemin de page lisible et borné : sans paramètres, sans barre finale, 120 caractères au plus. */
function nettoyerChemin(adressePage: string): string {
  const chemin = adressePage.split(/[?#]/)[0] || "/";
  return (chemin.length > 1 ? chemin.replace(/\/+$/, "") : chemin).slice(0, 120) || "/";
}

/** « 4-21 » : jeudi, 21 h (heure de Paris), pour la carte jours × heures. */
function creneau(moment: Date): string {
  const morceaux = heureParis.formatToParts(moment);
  const jour = JOURS_SEMAINE[morceaux.find((m) => m.type === "weekday")?.value ?? ""] ?? 0;
  return `${jour}-${Number(morceaux.find((m) => m.type === "hour")?.value ?? 0)}`;
}

/** Paramètre utm_campaign de l'adresse (la vidéo ou le post qui amène du monde), nettoyé. */
function lireCampagne(adressePage: string): string | null {
  try {
    const campagne = new URL(adressePage, "https://sosmiam.fr").searchParams.get("utm_campaign") ?? "";
    const propre = campagne.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
    return propre || null;
  } catch {
    return null;
  }
}

const nettoyerLieu = (valeur: string | null | undefined) => (valeur ? valeur.normalize("NFC").replace(/[^\p{L}\p{N} .'’-]/gu, "").trim().slice(0, 60) : "");

export function creerCompteurVisites(stockage: StockageStats, domaineSite = "sosmiam.fr") {
  const periodes = new Map<string, PeriodeEnMemoire>();
  const details = new Map<string, LigneDetail>();
  const fins = new Map<string, FinsDeVisites>();
  const valeursDuJour = new Map<string, Set<string>>();
  const visites = new Map<string, VisiteEnCours>();
  const dernieresCles = new Map<SourceMesure, ClesPeriodes>();
  // Une seule opération à la fois : deux vues simultanées ne créent pas deux fois la même période
  let file: Promise<unknown> = Promise.resolve();
  const enFile = <T>(tache: () => Promise<T>) => {
    const resultat = file.then(tache);
    file = resultat.catch(() => {});
    return resultat;
  };

  async function obtenirPeriode(source: SourceMesure, type: TypePeriode, cle: string): Promise<PeriodeEnMemoire> {
    const repere = `${source}|${type}|${cle}`;
    const connue = periodes.get(repere);
    if (connue) return connue;
    const lue = await stockage.lirePeriode(source, type, cle);
    const periode: PeriodeEnMemoire = {
      source,
      type,
      cle,
      vues: lue?.vues ?? 0,
      visites: lue?.visites ?? 0,
      visiteurs: lue?.visiteurs ?? 0,
      tempsTotal: lue?.tempsTotal ?? 0,
      pagesMesurees: lue?.pagesMesurees ?? 0,
      // Période déjà fermée (horloge revenue en arrière…) : nouveau secret, l'esquisse repart de zéro
      esquisse: lue?.secret?.length && lue.esquisse?.length ? new Uint8Array(lue.esquisse) : new Uint8Array(TAILLE_ESQUISSE),
      secret: lue?.secret?.length ? new Uint8Array(lue.secret) : new Uint8Array(randomBytes(32)),
      modifiee: !lue?.secret?.length,
    };
    periodes.set(repere, periode);
    return periode;
  }

  function compterDetail(source: SourceMesure, jour: string, dimension: DimensionMesure, valeurBrute: string) {
    const famille = `${source}|${jour}|${dimension}`;
    const valeurs = valeursDuJour.get(famille) ?? new Set<string>();
    valeursDuJour.set(famille, valeurs);
    let valeur = valeurBrute;
    if (!valeurs.has(valeur)) {
      if (valeurs.size >= MAX_VALEURS) valeur = "(autres)";
      valeurs.add(valeur);
    }
    const repere = `${famille}|${valeur}`;
    const ligne = details.get(repere) ?? { source, jour, dimension, valeur, nombre: 0 };
    ligne.nombre += 1;
    details.set(repere, ligne);
  }

  /** Une visite se termine : ses totaux s'ajoutent aux périodes de son début, sa dernière page aux sorties. */
  function terminerVisite(visite: VisiteEnCours) {
    for (const type of TYPES) {
      const repere = `${visite.source}|${type}|${visite.cles[type]}`;
      const fin = fins.get(repere) ?? { source: visite.source, type, cle: visite.cles[type], visitesFinies: 0, rebonds: 0, dureeVisites: 0 };
      fin.visitesFinies += 1;
      if (visite.pages === 1) fin.rebonds += 1;
      fin.dureeVisites += Math.round((visite.dernier - visite.debut) / 1000);
      fins.set(repere, fin);
    }
    compterDetail(visite.source, visite.cles.jour, "sortie", visite.dernierePage);
  }

  async function compter(vue: Vue) {
    const moment = vue.moment ?? new Date();
    const jour = calculerClesPeriodes(moment).jour;
    if (estRobot(vue.signature)) return compterDetail(vue.source, jour, "robot", nommerRobot(vue.signature));
    if (vue.statut === 404) return compterDetail(vue.source, jour, "introuvable", nettoyerChemin(vue.adressePage));

    const cles = calculerClesPeriodes(moment);
    const page = nettoyerChemin(vue.adressePage);
    const brut = `${vue.ip}\n${vue.signature}`;
    let empreinteDuJour = "";
    const concernees: PeriodeEnMemoire[] = [];
    for (const type of TYPES) {
      const periode = await obtenirPeriode(vue.source, type, cles[type]);
      const empreinte = createHmac("sha256", periode.secret).update(brut).digest();
      if (type === "jour") empreinteDuJour = empreinte.subarray(0, 16).toString("base64url");
      ajouterAEsquisse(periode.esquisse, empreinte);
      periode.vues += 1;
      if (typeof vue.duree === "number" && vue.duree >= 0 && vue.duree < 120_000) {
        periode.tempsTotal += Math.round(vue.duree);
        periode.pagesMesurees += 1;
      }
      periode.modifiee = true;
      concernees.push(periode);
    }
    compterDetail(vue.source, cles.jour, "page", page);
    if (typeof vue.duree === "number" && vue.duree >= 0 && vue.duree < 120_000) {
      compterDetail(vue.source, cles.jour, "temps", classerTempsReponse(vue.duree));
      if (vue.duree >= 1000) compterDetail(vue.source, cles.jour, "lente", page);
    }

    const repereVisite = `${vue.source}|${empreinteDuJour}`;
    const enCours = visites.get(repereVisite);
    if (enCours && moment.getTime() - enCours.dernier <= DUREE_VISITE) {
      enCours.dernier = moment.getTime();
      enCours.pages += 1;
      enCours.dernierePage = page;
      return;
    }
    if (enCours) terminerVisite(enCours);
    visites.set(repereVisite, { source: vue.source, cles, debut: moment.getTime(), dernier: moment.getTime(), pages: 1, dernierePage: page });
    // Nouvelle visite : d'où elle vient, avec quoi, quand, et sa page d'arrivée
    for (const periode of concernees) periode.visites += 1;
    const { appareil, navigateur, systeme } = decrireNavigateur(vue.signature);
    compterDetail(vue.source, cles.jour, "provenance", nettoyerProvenance(vue.adressePage, vue.referent, domaineSite));
    compterDetail(vue.source, cles.jour, "entree", page);
    compterDetail(vue.source, cles.jour, "appareil", appareil);
    compterDetail(vue.source, cles.jour, "navigateur", navigateur);
    compterDetail(vue.source, cles.jour, "systeme", systeme);
    compterDetail(vue.source, cles.jour, "pays", vue.pays && /^[A-Z0-9]{2}$/.test(vue.pays) ? vue.pays : "Inconnu");
    compterDetail(vue.source, cles.jour, "langue", lireLangue(vue.langues ?? null) ?? "Inconnue");
    compterDetail(vue.source, cles.jour, "creneau", creneau(moment));
    const campagne = lireCampagne(vue.adressePage);
    if (campagne) compterDetail(vue.source, cles.jour, "campagne", campagne);
    const region = nettoyerLieu(vue.region);
    if (region) compterDetail(vue.source, cles.jour, "region", region);
    const ville = nettoyerLieu(vue.ville);
    if (ville) compterDetail(vue.source, cles.jour, "ville", ville);
  }

  async function ecrire(maintenant: Date, toutTerminer: boolean) {
    // Visites finies (30 minutes sans page vue), ou toutes à l'arrêt de l'API
    for (const [repere, visite] of visites) {
      if (toutTerminer || maintenant.getTime() - visite.dernier > DUREE_VISITE) {
        terminerVisite(visite);
        visites.delete(repere);
      }
    }
    for (const periode of periodes.values()) {
      if (!periode.modifiee) continue;
      periode.visiteurs = estimerEsquisse(periode.esquisse);
      periode.modifiee = false;
      await stockage.ecrirePeriode(periode.source, periode.type, periode.cle, periode);
    }
    const lignes = [...details.values()];
    details.clear();
    if (lignes.length > 0) await stockage.ajouterDetails(lignes);
    const finsAEcrire = [...fins.values()];
    fins.clear();
    if (finsAEcrire.length > 0) await stockage.ajouterFinsDeVisites(finsAEcrire);

    // Fin d'une période : on l'oublie en mémoire, et la base efface son secret et son esquisse
    const cles = calculerClesPeriodes(maintenant);
    for (const source of SOURCES) {
      const avant = dernieresCles.get(source);
      if (avant && TYPES.every((type) => avant[type] === cles[type])) continue;
      for (const [repere, periode] of periodes) {
        if (periode.source === source && periode.cle !== cles[periode.type]) periodes.delete(repere);
      }
      await stockage.fermerPeriodesPassees(source, cles);
      const [annee, mois, jour] = cles.jour.split("-").map(Number) as [number, number, number];
      await stockage.effacerDetailsAvant(source, new Date(Date.UTC(annee, mois - 1 - MOIS_DETAILS, jour)).toISOString().slice(0, 10));
      dernieresCles.set(source, cles);
    }
    for (const famille of valeursDuJour.keys()) if (!famille.includes(`|${cles.jour}|`)) valeursDuJour.delete(famille);
  }

  return {
    /** Compte une page vue (ou un passage de robot, ou une page introuvable). */
    enregistrerVue: (vue: Vue) => enFile(() => compter(vue)),
    /** Compte un clic sur un bouton de la page /liens (« tiktok », « discord »…). */
    enregistrerClic: (source: SourceMesure, cible: string, moment = new Date()) =>
      enFile(async () => compterDetail(source, calculerClesPeriodes(moment).jour, "clic", cible.slice(0, 30))),
    /** Écrit les totaux en attente et ferme les périodes terminées ; `toutTerminer` clôt aussi les visites en cours (arrêt). */
    vider: (maintenant = new Date(), toutTerminer = false) => enFile(() => ecrire(maintenant, toutTerminer)),
    /** En ce moment : visites actives depuis 5 minutes, et les pages qu'elles regardent. */
    lireDirect: (source: SourceMesure = "site", maintenant = Date.now()) => {
      const actives = [...visites.values()].filter((v) => v.source === source && maintenant - v.dernier <= DUREE_DIRECT);
      const pages = new Map<string, number>();
      for (const visite of actives) pages.set(visite.dernierePage, (pages.get(visite.dernierePage) ?? 0) + 1);
      return {
        visites: actives.length,
        pages: [...pages].map(([valeur, nombre]) => ({ valeur, nombre })).sort((a, b) => b.nombre - a.nombre).slice(0, 10),
      };
    },
  };
}

export type CompteurVisites = ReturnType<typeof creerCompteurVisites>;
