// Compteur des visites du site (et plus tard de l'app). Tout se passe en mémoire, puis les totaux sont écrits
// dans la base toutes les 30 secondes (voir demarrer.ts). Ce qui est gardé : des totaux par période et par jour.
// Ce qui n'est jamais gardé : l'adresse IP, la signature du navigateur, une empreinte de visiteur.
// - Visiteurs uniques : chaque période a son secret ; l'empreinte HMAC(secret, IP + navigateur) n'entre que dans une
//   esquisse HyperLogLog (qui ne permet pas de la retrouver). Secret et esquisse sont effacés à la fin de la période.
// - Visites : une visite s'arrête après 30 minutes sans page vue. Le dernier passage de chaque empreinte du jour
//   reste en mémoire, 30 minutes au plus, jamais sur le disque.
import { createHmac, randomBytes } from "node:crypto";

import { calculerClesPeriodes, type ClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import { ajouterAEsquisse } from "../fonctions/mesure/ajouter-a-esquisse.ts";
import { decrireNavigateur } from "../fonctions/mesure/decrire-navigateur.ts";
import { estRobot } from "../fonctions/mesure/est-robot.ts";
import { estimerEsquisse } from "../fonctions/mesure/estimer-esquisse.ts";
import { nettoyerProvenance } from "../fonctions/mesure/nettoyer-provenance.ts";

export type SourceMesure = "site" | "app";
export type TypePeriode = keyof ClesPeriodes;
export type DimensionMesure = "page" | "provenance" | "appareil" | "navigateur" | "systeme" | "pays";

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
  moment?: Date;
};

export type EtatPeriode = { vues: number; visites: number; visiteurs: number; esquisse: Uint8Array; secret: Uint8Array };
export type LigneDetail = { source: SourceMesure; jour: string; dimension: DimensionMesure; valeur: string; nombre: number };

/** Ce dont le compteur a besoin pour garder ses totaux (la base en vrai, un faux dans les tests). */
export type StockageStats = {
  lirePeriode: (source: SourceMesure, type: TypePeriode, cle: string) => Promise<EtatPeriode | null>;
  ecrirePeriode: (source: SourceMesure, type: TypePeriode, cle: string, etat: EtatPeriode) => Promise<void>;
  ajouterDetails: (lignes: LigneDetail[]) => Promise<void>;
  /** Efface secret et esquisse de toutes les périodes de cette source qui ne sont plus en cours */
  fermerPeriodesPassees: (source: SourceMesure, enCours: ClesPeriodes) => Promise<void>;
};

const TYPES: TypePeriode[] = ["jour", "semaine", "mois", "annee"];
const SOURCES: SourceMesure[] = ["site", "app"];
const DUREE_VISITE = 30 * 60_000;
const TAILLE_ESQUISSE = 4096;
/** Valeurs différentes gardées par jour et par dimension : au-delà, « (autres) » (les adresses se forgent facilement) */
const MAX_VALEURS = 300;

type PeriodeEnMemoire = EtatPeriode & { source: SourceMesure; type: TypePeriode; cle: string; modifiee: boolean };

/** Chemin de page lisible et borné : sans paramètres, sans barre finale, 120 caractères au plus. */
function nettoyerChemin(adressePage: string): string {
  const chemin = adressePage.split(/[?#]/)[0] || "/";
  return (chemin.length > 1 ? chemin.replace(/\/+$/, "") : chemin).slice(0, 120) || "/";
}

export function creerCompteurVisites(stockage: StockageStats, domaineSite = "sosmiam.fr") {
  const periodes = new Map<string, PeriodeEnMemoire>();
  const details = new Map<string, LigneDetail>();
  const valeursDuJour = new Map<string, Set<string>>();
  const passages = new Map<string, number>();
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
      // Période déjà fermée (horloge revenue en arrière…) : nouveau secret, l'esquisse repart de zéro
      esquisse: lue?.esquisse ? new Uint8Array(lue.esquisse) : new Uint8Array(TAILLE_ESQUISSE),
      secret: lue?.secret ? new Uint8Array(lue.secret) : new Uint8Array(randomBytes(32)),
      modifiee: !lue?.secret,
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

  async function compter(vue: Vue) {
    if (estRobot(vue.signature)) return;
    const moment = vue.moment ?? new Date();
    const cles = calculerClesPeriodes(moment);
    const brut = `${vue.ip}\n${vue.signature}`;
    let empreinteDuJour = "";
    const concernees: PeriodeEnMemoire[] = [];
    for (const type of TYPES) {
      const periode = await obtenirPeriode(vue.source, type, cles[type]);
      const empreinte = createHmac("sha256", periode.secret).update(brut).digest();
      if (type === "jour") empreinteDuJour = empreinte.subarray(0, 16).toString("base64url");
      ajouterAEsquisse(periode.esquisse, empreinte);
      periode.vues += 1;
      periode.modifiee = true;
      concernees.push(periode);
    }
    compterDetail(vue.source, cles.jour, "page", nettoyerChemin(vue.adressePage));

    const repereVisite = `${vue.source}|${empreinteDuJour}`;
    const dernierPassage = passages.get(repereVisite);
    passages.set(repereVisite, moment.getTime());
    if (dernierPassage !== undefined && moment.getTime() - dernierPassage <= DUREE_VISITE) return;
    // Nouvelle visite : on note d'où elle vient et avec quoi
    for (const periode of concernees) periode.visites += 1;
    const { appareil, navigateur, systeme } = decrireNavigateur(vue.signature);
    compterDetail(vue.source, cles.jour, "provenance", nettoyerProvenance(vue.adressePage, vue.referent, domaineSite));
    compterDetail(vue.source, cles.jour, "appareil", appareil);
    compterDetail(vue.source, cles.jour, "navigateur", navigateur);
    compterDetail(vue.source, cles.jour, "systeme", systeme);
    compterDetail(vue.source, cles.jour, "pays", vue.pays && /^[A-Z0-9]{2}$/.test(vue.pays) ? vue.pays : "Inconnu");
  }

  async function ecrire(maintenant: Date) {
    for (const periode of periodes.values()) {
      if (!periode.modifiee) continue;
      periode.visiteurs = estimerEsquisse(periode.esquisse);
      periode.modifiee = false;
      await stockage.ecrirePeriode(periode.source, periode.type, periode.cle, periode);
    }
    const lignes = [...details.values()];
    details.clear();
    if (lignes.length > 0) await stockage.ajouterDetails(lignes);

    // Fin d'une période : on l'oublie en mémoire, et la base efface son secret et son esquisse
    const cles = calculerClesPeriodes(maintenant);
    for (const source of SOURCES) {
      const avant = dernieresCles.get(source);
      if (avant && TYPES.every((type) => avant[type] === cles[type])) continue;
      for (const [repere, periode] of periodes) {
        if (periode.source === source && periode.cle !== cles[periode.type]) periodes.delete(repere);
      }
      await stockage.fermerPeriodesPassees(source, cles);
      dernieresCles.set(source, cles);
    }
    for (const famille of valeursDuJour.keys()) if (!famille.includes(`|${cles.jour}|`)) valeursDuJour.delete(famille);
    for (const [repere, moment] of passages) if (maintenant.getTime() - moment > DUREE_VISITE) passages.delete(repere);
  }

  return {
    /** Compte une page vue (les robots sont ignorés). */
    enregistrerVue: (vue: Vue) => enFile(() => compter(vue)),
    /** Écrit les totaux en attente et ferme les périodes terminées. */
    vider: (maintenant = new Date()) => enFile(() => ecrire(maintenant)),
  };
}

export type CompteurVisites = ReturnType<typeof creerCompteurVisites>;
