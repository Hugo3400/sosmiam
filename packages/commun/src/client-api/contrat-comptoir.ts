// Contrat du service du comptoir, côté équipe du lieu (mode pro de l'app, puis pro.sosmiam.fr).
// Le lieu est toujours relu sur la ressource par le serveur (jamais pris dans la demande).

import type { AvisPublic, ResumeAvis } from "../types/avis.ts";
import type { EtatComptoir } from "../types/comptoir.ts";
import type { ProgrammeFidelite, ReglageFidelite } from "../types/fidelite.ts";
import type { InfosPratiques } from "../types/infos-pratiques.ts";
import type { MotifRefusReservation, ReservationPro } from "../types/reservation.ts";
import type { LieuGere } from "../types/roles.ts";
import type { MotifRefusVisite, ReglementVisite } from "../types/visite.ts";
import type { Desabonner, ReponseApi } from "./reponse-api.ts";

export type ReponseComptoir = ReponseApi<{ etat: EtatComptoir }>;

export interface ServiceComptoir {
  listerLieux(): Promise<ReponseApi<{ lieux: LieuGere[] }>>;
  lireComptoir(lieuId: number): Promise<ReponseComptoir>;
  /** reglement : comment la table a réglé ; il vaut pour chaque visite validée avec ce QR */
  montrerQr(lieuId: number, personnes: number, reglement: ReglementVisite): Promise<ReponseComptoir>;
  cacherQr(lieuId: number): Promise<ReponseComptoir>;
  /** codeSaisi obligatoire dès DEMANDES_AVANT_SAISIE_CODE additions en attente (sinon « code-faux ») */
  marquerReglee(visiteId: number, codeSaisi: string | null, reglement: ReglementVisite): Promise<ReponseComptoir>;
  refuser(visiteId: number, motif: MotifRefusVisite): Promise<ReponseComptoir>;
  annulerValidation(visiteId: number, motif: MotifRefusVisite): Promise<ReponseComptoir>;
  offrirRecompense(demandeId: number): Promise<ReponseComptoir>;
  listerReservations(lieuId: number): Promise<ReponseApi<{ reservations: ReservationPro[] }>>;
  repondreReservation(
    id: number,
    reponse: { accepter: true } | { accepter: false; motif: MotifRefusReservation },
  ): Promise<ReponseApi<{ reservation: ReservationPro }>>;
  marquerArrivee(id: number, venu: boolean): Promise<ReponseApi<{ reservation: ReservationPro }>>;
  lireProgramme(lieuId: number): Promise<ReponseApi<{ programme: ProgrammeFidelite | null }>>;
  /** Les infos pratiques du lieu (téléphone, animaux, accès…) ; le gérant seul peut les changer */
  lireInfosPratiques(lieuId: number): Promise<ReponseApi<{ infos: InfosPratiques | null }>>;
  reglerInfosPratiques(lieuId: number, infos: InfosPratiques): Promise<ReponseApi<{ infos: InfosPratiques }>>;
  reglerProgramme(lieuId: number, reglage: ReglageFidelite): Promise<ReponseApi<{ programme: ProgrammeFidelite }>>;
  listerAvis(lieuId: number): Promise<ReponseApi<{ resume: ResumeAvis; avis: AvisPublic[] }>>;
  repondreAvis(avisId: number, texte: string): Promise<ReponseApi<{ avis: AvisPublic }>>;
  ecouter(rappel: () => void): Desabonner;
}
