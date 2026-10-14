// Le SOS du soir, le message du moment, les statistiques et les événements d'un lieu, joués sur le téléphone (mode démo
// seulement). Mêmes règles et mêmes erreurs que l'API (un SOS par jour, 30 places au plus, textes de 80 caractères sans
// gros mot, événements vérifiés par validerEvenement) ; rien n'est gardé après la fermeture de l'app.
import type { LancementSos, ReglageMessageMoment, ServiceLieuPro } from "@sos-miam/commun/client-api/contrat-lieu-pro";
import { calculerProchaineOccurrence } from "@sos-miam/commun/fonctions/evenements/calculer-prochaine-occurrence";
import { estEvenementAlcool } from "@sos-miam/commun/fonctions/evenements/est-evenement-alcool";
import { calculerDecalageParis } from "@sos-miam/commun/fonctions/temps/calculer-decalage-paris";
import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { EVENEMENTS_A_VENIR_MAX } from "@sos-miam/commun/regles/evenements";
import { MESSAGE_MOMENT_MAX, SOS_OFFRE_MAX, SOS_PLACES_MAX, SOS_PLACES_MIN } from "@sos-miam/commun/regles/sos-lieu";
import type { EvenementLieuPro, ReglageEvenement } from "@sos-miam/commun/types/evenement";
import type { MomentLieu, SosDuJour } from "@sos-miam/commun/types/moment-lieu";
import type { StatistiquesSemaine } from "@sos-miam/commun/types/statistiques-lieu";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { validerEvenement } from "@sos-miam/commun/validation/valider-evenement";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import type { ContexteDemo } from "./types-demo";

type EtatLieuDemo = { sos: (SosDuJour & { jour: string }) | null; message: { texte: string; jusqua: string } | null; evenements: EvenementLieuPro[] };

const JOUR_MS = 24 * 60 * 60_000;
const etats = new Map<number, EtatLieuDemo>();
let prochainId = 1;

const jourParis = (ms: number) => new Date(ms + calculerDecalageParis(ms)).toISOString().slice(0, 10);
const refus = (erreur: "champ-invalide", champ: string) => ({ ok: false as const, erreur, champ });

function etatDe(lieuId: number): EtatLieuDemo {
  let etat = etats.get(lieuId);
  if (!etat) etats.set(lieuId, (etat = { sos: null, message: null, evenements: [] }));
  return etat;
}

/** La démo ferme à 23 h (heure de Paris) ; après minuit, la fermeture est passée */
const fermetureDuSoir = (ms: number) => calculerInstantParis(jourParis(ms), "23:00");

function presenterMoment(lieuId: number, ms: number): MomentLieu {
  const etat = etatDe(lieuId);
  const aujourdhui = jourParis(ms);
  const sos = etat.sos && etat.sos.jour === aujourdhui ? etat.sos : null;
  const enCours = !!sos && !sos.arreteLe && Date.parse(sos.jusqua) > ms;
  const message = etat.message && Date.parse(etat.message.jusqua) > ms ? etat.message : null;
  const fermeture = fermetureDuSoir(ms);
  return {
    sos: sos ? { places: sos.places, offre: sos.offre, jusqua: sos.jusqua, lanceLe: sos.lanceLe, lancePar: sos.lancePar, arreteLe: sos.arreteLe, enCours } : null,
    sosPossible: !sos,
    fermeture: fermeture > ms ? new Date(fermeture).toISOString() : null,
    message,
  };
}

/** Des statistiques d'exemple, toujours les mêmes pour un lieu (la démo ne compte pas de vraies vues) */
function statistiquesExemple(lieuId: number, ms: number, semaines: number): StatistiquesSemaine[] {
  const lundi = (decalage: number) => {
    const jour = new Date(Date.parse(`${jourParis(ms - decalage * 7 * JOUR_MS)}T12:00:00Z`));
    jour.setUTCDate(jour.getUTCDate() - ((jour.getUTCDay() + 6) % 7));
    return jour;
  };
  return Array.from({ length: semaines }, (_, i) => {
    const debut = lundi(i);
    const graine = (lieuId * 31 + i * 7) % 11;
    const vues = 40 + graine * 9 - i * 2;
    const jeudi = new Date(debut.getTime() + 3 * JOUR_MS);
    const premierJanvier = Date.UTC(jeudi.getUTCFullYear(), 0, 1);
    const numero = Math.ceil(((jeudi.getTime() - premierJanvier) / JOUR_MS + 1) / 7);
    return {
      semaine: `${jeudi.getUTCFullYear()}-S${String(numero).padStart(2, "0")}`,
      debut: debut.toISOString().slice(0, 10),
      vues: Math.max(0, vues),
      rescousses: Math.max(0, 6 + graine - i),
      visitesValidees: Math.max(0, 9 + (graine % 5) * 2 - i),
      nouveauxClients: Math.max(0, 3 + (graine % 4) - Math.floor(i / 2)),
    };
  });
}

function presenterEvenement(e: EvenementLieuPro, ms: number): EvenementLieuPro {
  const prochaine = e.annuleLe ? null : calculerProchaineOccurrence(e, new Date(ms));
  return {
    ...e,
    prochaine: prochaine ? { debut: prochaine.debut.toISOString(), fin: prochaine.fin?.toISOString() ?? null } : null,
    statut: e.annuleLe ? "annule" : prochaine ? "a-venir" : "passe",
  };
}

/** Le service « lieu » de l'équipe en démo (le rôle a déjà été vérifié par l'écran : seuls les rôles de démo y mènent) */
export function creerLieuProDemo(ctx: ContexteDemo): ServiceLieuPro {
  const maintenant = () => ctx.maintenant();
  const prenom = () => ctx.lireClient()?.prenom ?? null;

  const lancerSos = async (lieuId: number, sos: LancementSos) => {
    const ms = maintenant();
    const etat = etatDe(lieuId);
    if (!Number.isInteger(sos.places) || sos.places < SOS_PLACES_MIN || sos.places > SOS_PLACES_MAX) return refus("champ-invalide", "places");
    const offre = sos.offre?.trim() || null;
    if (offre && (offre.length > SOS_OFFRE_MAX || contientMotInterdit(offre))) return refus("champ-invalide", "offre");
    const fermeture = fermetureDuSoir(ms);
    const jusqua = sos.jusqua ? Date.parse(sos.jusqua) : fermeture;
    if (Number.isNaN(jusqua) || jusqua <= ms || jusqua > fermeture) return refus("champ-invalide", "jusqua");
    if (etat.sos?.jour === jourParis(ms)) return { ok: false as const, erreur: "sos-deja-lance" as const };
    const lanceLe = new Date(ms).toISOString();
    etat.sos = { jour: jourParis(ms), places: sos.places, offre, jusqua: new Date(jusqua).toISOString(), lanceLe, lancePar: prenom(), arreteLe: null, enCours: true };
    return { ok: true as const, moment: presenterMoment(lieuId, ms) };
  };

  const reglerMessage = async (lieuId: number, message: ReglageMessageMoment) => {
    const ms = maintenant();
    const texte = message.texte.replace(/\s+/g, " ").trim();
    if (!texte || texte.length > MESSAGE_MOMENT_MAX || contientMotInterdit(texte)) return refus("champ-invalide", "texte");
    const fermeture = fermetureDuSoir(ms);
    const jusqua = message.jusqua ? Date.parse(message.jusqua) : fermeture > ms ? fermeture : ms + JOUR_MS;
    if (Number.isNaN(jusqua) || jusqua <= ms || jusqua > ms + JOUR_MS) return refus("champ-invalide", "jusqua");
    etatDe(lieuId).message = { texte, jusqua: new Date(jusqua).toISOString() };
    return { ok: true as const, moment: presenterMoment(lieuId, ms) };
  };

  const enregistrer = (lieuId: number, reglage: ReglageEvenement, existant: EvenementLieuPro | null) => {
    const ms = maintenant();
    const lu = validerEvenement(reglage, new Date(ms), existant?.debut ?? null);
    if (!lu.ok) return lu;
    const typeLieu = lieuxExemples.find((l) => l.id === lieuId)?.type ?? "resto";
    const date = new Date(ms).toISOString();
    const base: EvenementLieuPro = existant ?? {
      ...lu.evenement, id: prochainId++, photo: null, prochaine: null, statut: "a-venir", annuleLe: null, suspendu: false, interesses: 0, publiePar: prenom(), creeLe: date, modifieLe: date,
    };
    const evenement = presenterEvenement({ ...base, ...lu.evenement, alcool: estEvenementAlcool(lu.evenement, typeLieu), modifieLe: date }, ms);
    const etat = etatDe(lieuId);
    etat.evenements = [evenement, ...etat.evenements.filter((e) => e.id !== evenement.id)];
    return { ok: true as const, evenement };
  };

  const trouver = (lieuId: number, id: number) => etatDe(lieuId).evenements.find((e) => e.id === id) ?? null;

  return {
    lireMoment: async (lieuId) => ({ ok: true, moment: presenterMoment(lieuId, maintenant()) }),
    lancerSos,
    async arreterSos(lieuId) {
      const ms = maintenant();
      const sos = etatDe(lieuId).sos;
      if (sos && sos.jour === jourParis(ms) && !sos.arreteLe) sos.arreteLe = new Date(ms).toISOString();
      return { ok: true, moment: presenterMoment(lieuId, ms) };
    },
    reglerMessage,
    async effacerMessage(lieuId) {
      etatDe(lieuId).message = null;
      return { ok: true, moment: presenterMoment(lieuId, maintenant()) };
    },
    lireStatistiques: async (lieuId, semaines = 8) => ({ ok: true, semaines: statistiquesExemple(lieuId, maintenant(), Math.min(26, Math.max(1, semaines))) }),
    async listerEvenements(lieuId) {
      const ms = maintenant();
      const tous = etatDe(lieuId).evenements.map((e) => presenterEvenement(e, ms));
      const aVenir = tous.filter((e) => e.statut === "a-venir").sort((a, b) => (a.prochaine?.debut ?? "").localeCompare(b.prochaine?.debut ?? ""));
      const finis = tous.filter((e) => e.statut !== "a-venir" && Date.parse(e.annuleLe ?? e.debut) > ms - 30 * JOUR_MS).sort((a, b) => b.debut.localeCompare(a.debut));
      return { ok: true, evenements: [...aVenir, ...finis] };
    },
    async creerEvenement(lieuId, reglage) {
      const aVenir = etatDe(lieuId).evenements.filter((e) => presenterEvenement(e, maintenant()).statut === "a-venir").length;
      if (aVenir >= EVENEMENTS_A_VENIR_MAX) return { ok: false, erreur: "trop-d-evenements" };
      return enregistrer(lieuId, reglage, null);
    },
    async modifierEvenement(lieuId, id, reglage) {
      const existant = trouver(lieuId, id);
      if (!existant) return { ok: false, erreur: "evenement-inconnu" };
      const actuel = presenterEvenement(existant, maintenant());
      if (actuel.statut === "annule") return { ok: false, erreur: "transition-interdite" };
      if (actuel.statut === "passe") return { ok: false, erreur: "evenement-passe" };
      return enregistrer(lieuId, reglage, existant);
    },
    async annulerEvenement(lieuId, id) {
      const existant = trouver(lieuId, id);
      if (!existant) return { ok: false, erreur: "evenement-inconnu" };
      const actuel = presenterEvenement(existant, maintenant());
      if (actuel.statut === "passe") return { ok: false, erreur: "evenement-passe" };
      if (actuel.statut === "annule") return { ok: true, evenement: actuel };
      const annule = presenterEvenement({ ...existant, annuleLe: new Date(maintenant()).toISOString() }, maintenant());
      etatDe(lieuId).evenements = etatDe(lieuId).evenements.map((e) => (e.id === id ? annule : e));
      return { ok: true, evenement: annule };
    },
  };
}
