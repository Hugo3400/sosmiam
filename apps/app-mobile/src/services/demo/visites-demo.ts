// Le service des visites joué sur le téléphone (démo, §3.5 du plan) : demander l'addition, scanner le QR du comptoir,
// suivre ses visites. Toutes les règles viennent de commun ; le magasin fait office de base de données.
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ServiceVisites } from "@sos-miam/commun/client-api/contrat-visites";
import { choisirRecompenseAffichee } from "@sos-miam/commun/fonctions/fidelite/choisir-recompense-affichee";
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import { choisirCodeAddition } from "@sos-miam/commun/fonctions/visites/choisir-code-addition";
import { DUREE_DEMANDE_ADDITION_MS } from "@sos-miam/commun/regles/visites";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { EvenementVisite, Visite } from "@sos-miam/commun/types/visite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";
import { convertirCarteDemo } from "~/fonctions/demo/convertir-carte-demo";
import { convertirVisiteDemo } from "~/fonctions/demo/convertir-visite-demo";
import { tirerNombre } from "~/fonctions/demo/tirer-nombre";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";

import { construireResultatValidationDemo } from "./construire-resultat-validation-demo";
import { deciderVisiteDemo } from "./decider-visite-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import { listerCodesPrisDemo } from "./lister-codes-pris-demo";
import { consommerPepin } from "./reglages-demo-vivants";
import { traduirePepinDemo } from "./traduire-pepin-demo";
import type { ContexteDemo, VisiteDemo } from "./types-demo";
import { validerComptoirDemo } from "./valider-comptoir-demo";
import { verifierDroitsDemo } from "./verifier-droits-demo";
import { verifierPositionDemo } from "./verifier-position-demo";

/** « Les lieux répondent tout seuls » : l'addition est réglée au bout de 8 s */
const REPONSE_AUTO_MS = 8_000;
/** Pépin « refus du lieu » : la demande est refusée au bout de 3 s */
const REFUS_PEPIN_MS = 3_000;
/** Le petit mot d'une contestation (lu par l'équipe SOS Miam, jamais par le lieu) */
const MOT_CONTESTATION_MAX = 500;

type ReponseVisite = ReponseApi<{ visite: Visite }>;

const trouverLieu = (id: number) => lieuxExemples.find((l) => l.id === id);
/** Un bar n'existe pas pour un 15-17 ans, ni pour une personne dont on ignore l'âge */
const estCache = (lieu: Lieu, majeur: boolean) => lieu.type === "bar" && !majeur;

/** Le service des visites de la démo. */
export function creerVisitesDemo(ctx: ContexteDemo): ServiceVisites {
  /** Réponse du lieu un peu plus tard (pépin ou réponse automatique), si la demande attend toujours */
  function planifierReponse(visite: Visite, evenement: EvenementVisite, delaiMs: number) {
    setTimeout(() => {
      ctx.magasin
        .modifier((m, maintenantMs) => {
          const v = m.visites.find((x) => x.id === visite.id);
          // Même identifiant mais autre visite : la démo a été remise à zéro entre-temps
          if (!v || v.creeLe !== visite.creeLe || v.statut !== "demandee") return;
          deciderVisiteDemo(m, v.id, evenement, maintenantMs, lireDelaiAvisDemo(ctx.lireReglages()), ctx.lireClient());
        })
        .catch(() => {});
    }, delaiMs);
  }

  /** Décide une visite de « moi » et la rend telle que le client la voit */
  function deciderMaVisite(id: number, evenement: EvenementVisite): Promise<ReponseVisite> {
    const client = ctx.lireClient();
    if (!client) return Promise.resolve({ ok: false, erreur: "connexion-requise" });
    return ctx.magasin.modifier((m, maintenantMs): ReponseVisite => {
      const v = m.visites.find((x) => x.id === id && x.client === "moi");
      const lieu = v ? trouverLieu(v.lieuId) : undefined;
      if (!v || !lieu) return { ok: false, erreur: "introuvable" };
      const decision = deciderVisiteDemo(m, id, evenement, maintenantMs, lireDelaiAvisDemo(ctx.lireReglages()), client);
      return decision.ok ? { ok: true, visite: convertirVisiteDemo(decision.visite, lieu) } : decision;
    });
  }

  return {
    async lireLieu(lieuId) {
      const lieu = trouverLieu(lieuId);
      if (!lieu) return { ok: false, erreur: "introuvable" };
      const client = ctx.lireClient();
      if (estCache(lieu, client?.majeur ?? false)) return { ok: false, erreur: "mineur-bar" };
      return ctx.magasin.lire((m) => {
        const programme = m.programmes.find((p) => p.lieuId === lieuId && p.actif);
        const recompense = programme ? choisirRecompenseAffichee(programme, client?.majeur ?? false) : null;
        const enCours = client ? m.visites.find((v) => v.client === "moi" && v.statut === "demandee" && v.lieuId === lieuId) : undefined;
        return {
          ok: true,
          infos: {
            lieuId,
            validationActive: validationLieuxExemples[lieuId]?.validationActive ?? false,
            reservable: lieu.reservable,
            programme: programme && recompense !== null ? { visitesRequises: programme.visitesRequises, recompense } : null,
            carte: client ? convertirCarteDemo(m, lieuId, client) : null,
            enCoursIci: enCours ? convertirVisiteDemo(enCours, lieu) : null,
            pratique: m.infosPratiques?.[lieuId] ?? null,
          },
        };
      });
    },

    async listerLieuxQuiValident() {
      const majeur = ctx.lireClient()?.majeur ?? false;
      const lieux = lieuxExemples.filter((l) => validationLieuxExemples[l.id]?.validationActive && !estCache(l, majeur)).map((l) => l.id);
      return { ok: true, lieux };
    },

    async demanderAddition(lieuId, position) {
      const client = ctx.lireClient();
      if (!client) return { ok: false, erreur: "connexion-requise" };
      const lieu = trouverLieu(lieuId);
      if (!lieu) return { ok: false, erreur: "introuvable" };
      // Avant le pépin : un bar n'existe pas pour un 15-17 ans (le pépin « hors zone » donnerait son nom)
      if (estCache(lieu, client.majeur)) return { ok: false, erreur: "mineur-bar" };
      const pepin = consommerPepin(["hors-zone", "position-imprecise", "hors-ligne", "refus-lieu"]);
      const echecPepin = traduirePepinDemo(pepin, lieu.nom);
      if (echecPepin) return echecPepin;

      const reponse = await ctx.magasin.modifier((m, maintenantMs): ReponseVisite => {
        const refus = verifierDroitsDemo(lieu, client, maintenantMs);
        if (refus) return refus;
        const enCours = m.visites.find((v) => v.client === "moi" && v.statut === "demandee");
        if (enCours) return { ok: false, erreur: "demande-en-cours", details: { lieu: trouverLieu(enCours.lieuId)?.nom, lieuId: enCours.lieuId } };
        const refusPosition = verifierPositionDemo(position, lieu);
        if (refusPosition) return refusPosition;
        const le = new Date(maintenantMs).toISOString();
        const visite: VisiteDemo = {
          id: m.prochainId,
          lieuId,
          client: "moi",
          mode: "addition",
          statut: "demandee",
          code: choisirCodeAddition(listerCodesPrisDemo(m, lieuId), tirerNombre),
          creeLe: le,
          expireLe: new Date(maintenantMs + DUREE_DEMANDE_ADDITION_MS).toISOString(),
          valideLe: null,
          decideLe: null,
          pendantSos: estSosEnCours(lieu, new Date(maintenantMs)),
          points: 0,
          tampon: false,
          resultatPosition: "dans-rayon",
          motifRefus: null,
          contestee: false,
          avisOuvertLe: null,
          avisFermeLe: null,
          avisDonne: false,
          presentationId: null,
          reservationId: null,
          annulableJusqua: null,
        };
        m.prochainId += 1;
        m.visites.push(visite);
        return { ok: true, visite: convertirVisiteDemo(visite, lieu) };
      });

      if (reponse.ok) {
        if (pepin === "refus-lieu") planifierReponse(reponse.visite, { type: "refuser", motif: "introuvable" }, REFUS_PEPIN_MS);
        else if (ctx.lireReglages().lieuxRepondentSeuls && !peutAgirAuComptoir(ctx.lireRoles(), lieuId)) {
          planifierReponse(reponse.visite, { type: "regler" }, REPONSE_AUTO_MS);
        }
      }
      return reponse;
    },

    validerComptoir(texteScanne, position) {
      return validerComptoirDemo(ctx, texteScanne, position);
    },

    async lireVisite(id) {
      const client = ctx.lireClient();
      if (!client) return { ok: false, erreur: "connexion-requise" };
      return ctx.magasin.lire((m) => {
        const v = m.visites.find((x) => x.id === id && x.client === "moi");
        const resultat = v ? construireResultatValidationDemo(m, v, client) : null;
        return resultat ? { ok: true as const, ...resultat } : { ok: false as const, erreur: "introuvable" as const };
      });
    },

    annulerDemande(id) {
      return deciderMaVisite(id, { type: "annuler-client" });
    },

    async contesterRefus(id, mot) {
      if (!ctx.lireClient()) return { ok: false, erreur: "connexion-requise" };
      return ctx.magasin.modifier((m, maintenantMs): ReponseVisite => {
        const v = m.visites.find((x) => x.id === id && x.client === "moi");
        const lieu = v ? trouverLieu(v.lieuId) : undefined;
        if (!v || !lieu) return { ok: false, erreur: "introuvable" };
        if (v.statut !== "refusee" && v.statut !== "retiree") return { ok: false, erreur: "transition-interdite" };
        if (!v.contestee) {
          v.contestee = true;
          m.contestations.push({ visiteId: v.id, mot: mot.trim().slice(0, MOT_CONTESTATION_MAX), le: new Date(maintenantMs).toISOString() });
        }
        return { ok: true, visite: convertirVisiteDemo(v, lieu) };
      });
    },

    async listerVisites() {
      if (!ctx.lireClient()) return { ok: true, visites: [], enCours: null, points: 0 };
      return ctx.magasin.lire((m) => {
        const visites: Visite[] = [];
        let enCours: Visite | null = null;
        const miennes = m.visites.filter((v) => v.client === "moi").sort((a, b) => b.creeLe.localeCompare(a.creeLe));
        for (const v of miennes) {
          const lieu = trouverLieu(v.lieuId);
          if (!lieu) continue;
          if (v.statut === "demandee") enCours ??= convertirVisiteDemo(v, lieu);
          else visites.push(convertirVisiteDemo(v, lieu));
        }
        const points = m.journal.reduce((total, ligne) => total + ligne.valeur, 0);
        return { ok: true, visites, enCours, points };
      });
    },

    ecouter(rappel) {
      return ctx.magasin.ecouter(rappel);
    },
  };
}
