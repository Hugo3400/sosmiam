// L'espace ambassadeur joué sur le téléphone (mode démo seulement) : missions, avis à relire et messages de l'équipe, pris
// dans le magasin de la démo (creerMagasinInitial les y pose). Mêmes règles que l'API : un rôle d'ambassadeur actif, un compte
// rendu d'au moins 5 caractères, un verdict par avis (consultatif : l'équipe tranche), « Je suis sur place » vérifié comme une
// visite (même rayon, mêmes règles) et seule l'heure gardée.
import type { ServiceEspaceAmbassadeur } from "@sos-miam/commun/client-api/contrat-espace-ambassadeur";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { evaluerPosition } from "@sos-miam/commun/fonctions/visites/evaluer-position";
import { traduireResultatPosition } from "@sos-miam/commun/fonctions/visites/traduire-resultat-position";
import { RAYON_VALIDATION_M } from "@sos-miam/commun/regles/visites";
import type { MissionAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import type { LecturePosition } from "@sos-miam/commun/types/position";

import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";
import type { ContexteDemo } from "./types-demo";

const COMPTE_RENDU_MIN = 5;
const COMPTE_RENDU_MAX = 2000;

type Echec = Extract<ReponseApi, { ok: false }>;

/**
 * « Je suis sur place », comme l'API : la mission à faire, pas encore pointée, avec un lieu placé, puis la lecture comparée
 * au lieu (son rayon de validation, 200 m par défaut). null si c'est bon. La distance, arrondie à 100 m, ne sert qu'au message.
 */
function refuserPresence(mission: MissionAmbassadeur, position: LecturePosition): Echec | null {
  if (mission.statut !== "a-faire") return { ok: false, erreur: "transition-interdite" };
  if (mission.presenceVerifieeLe) return { ok: false, erreur: "deja-sur-place" };
  const lieu = mission.lieu;
  if (!lieu?.position) return { ok: false, erreur: "lieu-sans-position" };
  const { resultat, distanceM } = evaluerPosition(position, lieu.position, validationLieuxExemples[lieu.id]?.rayonM ?? RAYON_VALIDATION_M);
  const erreur = traduireResultatPosition(resultat);
  if (erreur === "hors-zone") return { ok: false, erreur, details: { distanceM: Math.round(distanceM / 100) * 100, lieu: lieu.nom } };
  if (erreur === "position-imprecise" && position.precision !== null) return { ok: false, erreur, details: { precisionM: Math.round(position.precision) } };
  return erreur ? { ok: false, erreur } : null;
}

export function creerEspaceAmbassadeurDemo(ctx: ContexteDemo): ServiceEspaceAmbassadeur {
  const actif = () => ctx.lireRoles().ambassadeur === "actif";
  const refus = { ok: false as const, erreur: "role-requis" as const };

  return {
    async lireEspace() {
      const statut = ctx.lireRoles().ambassadeur;
      if (!statut) return refus;
      return ctx.magasin.lire((m) => {
        const relus = new Set(m.relectures.map((r) => r.avisId));
        return {
          ok: true as const,
          espace: {
            statut,
            missionsAFaire: m.missions.filter((x) => x.statut === "a-faire").length,
            avisARelire: m.avisARelire.filter((a) => !relus.has(a.id)).length,
            messagesNonLus: m.messages.filter((x) => x.luLe === null).length,
          },
        };
      });
    },
    async listerMissions() {
      if (!actif()) return refus;
      return ctx.magasin.lire((m) => ({ ok: true as const, missions: [...m.missions] }));
    },
    async signalerPresence(missionId, position) {
      if (!actif()) return refus;
      return ctx.magasin.modifier((m, maintenantMs) => {
        const mission = m.missions.find((x) => x.id === missionId);
        if (!mission) return { ok: false as const, erreur: "introuvable" as const };
        const echec = refuserPresence(mission, position);
        if (echec) return echec;
        mission.presenceVerifieeLe = new Date(maintenantMs).toISOString();
        return { ok: true as const, mission: { ...mission } };
      });
    },
    async terminerMission(missionId, compteRendu) {
      if (!actif()) return refus;
      const texte = compteRendu.trim().slice(0, COMPTE_RENDU_MAX);
      if (texte.length < COMPTE_RENDU_MIN) return { ok: false, erreur: "compte-rendu-invalide" };
      return ctx.magasin.modifier((m, maintenantMs) => {
        const mission = m.missions.find((x) => x.id === missionId && x.statut === "a-faire");
        if (!mission) return { ok: false as const, erreur: "introuvable" as const };
        mission.statut = "faite";
        mission.compteRendu = texte;
        mission.faiteLe = new Date(maintenantMs).toISOString();
        return { ok: true as const, mission: { ...mission } };
      });
    },
    async listerAvisARelire() {
      if (!actif()) return refus;
      return ctx.magasin.lire((m) => {
        const relus = new Set(m.relectures.map((r) => r.avisId));
        return { ok: true as const, avis: m.avisARelire.filter((a) => !relus.has(a.id)) };
      });
    },
    async donnerVerdict(avisId, verdict) {
      if (!actif()) return refus;
      return ctx.magasin.modifier((m, maintenantMs) => {
        if (!m.avisARelire.some((a) => a.id === avisId) || m.relectures.some((r) => r.avisId === avisId)) return { ok: false as const, erreur: "introuvable" as const };
        m.relectures.push({ avisId, verdict, le: new Date(maintenantMs).toISOString() });
        return { ok: true as const };
      });
    },
    async listerMessages() {
      if (!actif()) return refus;
      return ctx.magasin.lire((m) => ({ ok: true as const, messages: [...m.messages].sort((a, b) => b.creeLe.localeCompare(a.creeLe)) }));
    },
    async marquerLu(messageId) {
      if (!actif()) return refus;
      return ctx.magasin.modifier((m, maintenantMs) => {
        const message = m.messages.find((x) => x.id === messageId);
        if (!message) return { ok: false as const, erreur: "introuvable" as const };
        message.luLe ??= new Date(maintenantMs).toISOString();
        return { ok: true as const };
      });
    },
    ecouter: (rappel) => ctx.magasin.ecouter(rappel),
  };
}
