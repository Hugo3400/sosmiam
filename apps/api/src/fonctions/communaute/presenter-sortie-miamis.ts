import type { SortieMiamisApi } from "../../../../../packages/commun/src/types/communaute.ts";
import type { TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import type { MaPlaceSortieMiamis, SortiesTenues } from "../../../../../packages/commun/src/types/sorties-miamis.ts";
import { HEURES_INVITATION_HABITUES } from "../../../../../packages/commun/src/regles/communaute.ts";
import type { LieuSortieMiamis, LigneParticipationMiamis, LigneSortieMiamis } from "../../services/communaute-regles.ts";
import { estInvitationHabitueValable } from "./est-invitation-habitue-valable.ts";
import { lirePublicSortie } from "./lire-public-sortie.ts";

export type VueSortieMiamis = {
  moi: number;
  ligne: LigneSortieMiamis;
  participations: readonly LigneParticipationMiamis[];
  lieu: LieuSortieMiamis;
  personnes: ReadonlyMap<number, PersonneResume>;
  potes: ReadonlySet<number>;
  caches: ReadonlySet<number>;
  nouveaux: ReadonlySet<number>;
  tenuesOrganisateur: SortiesTenues;
  rescoussesOrganisateur: number;
  tenuesDemandeurs: ReadonlyMap<number, SortiesTenues>;
  maintenant: Date;
};

const PLACES: Readonly<Record<string, MaPlaceSortieMiamis>> = {
  organise: "organisateur", accepte: "accepte", attente: "attente", demande: "demande", refuse: "demande",
};
const AUCUNE_TENUE: SortiesTenues = { tenues: 0, prevues: 0 };
const ordre = (a: LigneParticipationMiamis, b: LigneParticipationMiamis) =>
  (a.decideLe ?? a.creeLe).getTime() - (b.decideLe ?? b.creeLe).getTime() || a.compteId - b.compteId;

export function presenterSortieMiamis(v: VueSortieMiamis): SortieMiamisApi | null {
  const { ligne, moi } = v;
  const organisateur = v.personnes.get(ligne.organisateurId);
  if (!organisateur) return null;
  const mienne = v.participations.find((p) => p.compteId === moi) ?? null;
  const jeSuisOrganisateur = ligne.organisateurId === moi;
  const voitLesPresences = jeSuisOrganisateur || mienne?.statut === "accepte";
  const visible = (p: LigneParticipationMiamis) => p.compteId === moi || (!v.caches.has(p.compteId) && v.personnes.has(p.compteId));
  const avecStatut = (statut: string) => v.participations.filter((p) => p.statut === statut).sort(ordre);
  const dedans = [...avecStatut("organise"), ...avecStatut("accepte")];
  const attente = avecStatut("attente");
  const invitationValable = mienne !== null && estInvitationHabitueValable(mienne, v.maintenant);
  const rang = attente.findIndex((p) => p.compteId === moi);
  return {
    id: String(ligne.id),
    titre: ligne.titre,
    description: ligne.description,
    quand: ligne.quand.toISOString(),
    lieu: { id: v.lieu.id, nom: v.lieu.nom, emoji: v.lieu.emoji, type: v.lieu.type as TypeLieu, ville: v.lieu.ville },
    organisateur,
    sortiesTenuesOrganisateur: v.tenuesOrganisateur,
    rescoussesOrganisateur: v.rescoussesOrganisateur,
    public: lirePublicSortie(ligne.publicType, ligne.publicValeur),
    etiquettes: ligne.etiquettes.map((e) => ({ nom: e.nom, officielle: e.officielle })),
    places: ligne.places,
    placeGardeePourNouveau: ligne.placeGardeeNouveau,
    recurrente: ligne.recurrente,
    habitues: dedans.filter((p) => p.habitue).length,
    participants: dedans.filter(visible).map((p) => ({
      personne: v.personnes.get(p.compteId)!,
      habitue: p.habitue,
      dansTaBande: v.potes.has(p.compteId),
      nouveau: v.nouveaux.has(p.compteId),
      present: voitLesPresences && p.presentLe !== null,
    })),
    nombreEnAttente: attente.length,
    listeAttente: jeSuisOrganisateur ? attente.filter(visible).map((p) => v.personnes.get(p.compteId)!) : [],
    demandes: jeSuisOrganisateur
      ? avecStatut("demande").filter(visible).map((p) => ({
        personne: v.personnes.get(p.compteId)!,
        date: p.creeLe.toISOString(),
        nouveau: v.nouveaux.has(p.compteId),
        sortiesTenues: v.tenuesDemandeurs.get(p.compteId) ?? AUCUNE_TENUE,
      }))
      : [],
    conversationId: mienne && (mienne.statut === "organise" || mienne.statut === "accepte") && ligne.conversationId !== null ? String(ligne.conversationId) : null,
    moi: {
      place: mienne ? (PLACES[mienne.statut] ?? "aucune") : "aucune",
      rangAttente: rang >= 0 ? rang + 1 : null,
      present: mienne?.presentLe != null,
    },
    version: ligne.version,
    invitationHabitue: invitationValable ? { jusqua: new Date(mienne.creeLe.getTime() + HEURES_INVITATION_HABITUES * 3_600_000).toISOString() } : null,
  };
}
