// Le service du comptoir, version API : routes /pro/comptoir (comptoir, QR, fidélité, SOS du soir, plus tard réservations et
// avis) et /pro/lieux/:id (fiche et carte, routes/pro.ts de l'API). Le lieu est toujours relu par le serveur.

import { INTERVALLE_ECRAN_COMPTOIR_MS } from "../../regles/visites.ts";
import type { CarteLieu } from "../../types/carte.ts";
import type { ProgrammeFidelite } from "../../types/fidelite.ts";
import type { InfosPratiques } from "../../types/infos-pratiques.ts";
import type { LieuGere } from "../../types/roles.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ReponseComptoir, ServiceComptoir } from "../contrat-comptoir.ts";
import type { ReponseApi } from "../reponse-api.ts";
import { convertirFicheEnInfosPratiques } from "./convertir-fiche-en-infos-pratiques.ts";
import { creerEcouteReguliere } from "./creer-ecoute-reguliere.ts";

type ServicesPlusTard = "listerReservations" | "repondreReservation" | "marquerArrivee" | "listerAvis" | "repondreAvis";

/** Une infos pratiques vides effacent tout : chaque champ absent part à null (l'API efface alors l'info) */
const versFiche = (infos: InfosPratiques) => ({
  telephone: infos.telephone ?? null, siteWeb: infos.siteWeb ?? null, instagram: infos.instagram ?? null, animaux: infos.animaux ?? null,
  accessible: infos.accessible ?? null, terrasse: infos.terrasse ?? null, wifi: infos.wifi ?? null, enfants: infos.enfants ?? null,
  parking: infos.parking ?? null, paiements: infos.paiements ?? null, reservation: infos.reservation ?? null,
});

/** Le comptoir lu et réglé par l'API ; les réservations et les avis du lieu arrivent avec leurs routes (creerServicesApi les ajoute). */
export function creerComptoirApi(client: ClientHttp): Omit<ServiceComptoir, ServicesPlusTard> {
  const etat = (methode: "GET" | "POST" | "DELETE", chemin: string, corps?: unknown): Promise<ReponseComptoir> =>
    client.demander(methode, chemin, corps === undefined ? {} : { corps });

  return {
    listerLieux: () => client.demander<{ lieux: LieuGere[] }>("GET", "/pro/comptoir/lieux"),
    lireComptoir: (lieuId) => etat("GET", `/pro/comptoir/lieux/${lieuId}`),
    montrerQr: (lieuId, personnes, reglement) => etat("POST", `/pro/comptoir/lieux/${lieuId}/qr`, { personnes, reglement }),
    cacherQr: (lieuId) => etat("DELETE", `/pro/comptoir/lieux/${lieuId}/qr`),
    marquerReglee: (visiteId, codeSaisi, reglement) => etat("POST", `/pro/comptoir/visites/${visiteId}/reglee`, { code: codeSaisi, reglement }),
    refuser: (visiteId, motif) => etat("POST", `/pro/comptoir/visites/${visiteId}/refuser`, { motif }),
    annulerValidation: (visiteId, motif) => etat("POST", `/pro/comptoir/visites/${visiteId}/annuler`, { motif }),
    offrirRecompense: (demandeId) => etat("POST", `/pro/comptoir/recompenses/${demandeId}/offrir`),
    lireProgramme: (lieuId) => client.demander<{ programme: ProgrammeFidelite | null }>("GET", `/pro/comptoir/lieux/${lieuId}/programme`),
    reglerProgramme: (lieuId, reglage) => client.demander<{ programme: ProgrammeFidelite }>("PUT", `/pro/comptoir/lieux/${lieuId}/programme`, { corps: reglage }),
    async lireInfosPratiques(lieuId): Promise<ReponseApi<{ infos: InfosPratiques | null }>> {
      const r = await client.demander<{ fiche: Record<string, unknown> }>("GET", `/pro/lieux/${lieuId}`);
      return r.ok ? { ok: true, infos: convertirFicheEnInfosPratiques(r.fiche) } : r;
    },
    async reglerInfosPratiques(lieuId, infos): Promise<ReponseApi<{ infos: InfosPratiques }>> {
      const r = await client.demander<{ fiche: Record<string, unknown> }>("PATCH", `/pro/lieux/${lieuId}`, { corps: versFiche(infos) });
      return r.ok ? { ok: true, infos: convertirFicheEnInfosPratiques(r.fiche) } : r;
    },
    async lireCarteDuLieu(lieuId): Promise<ReponseApi<{ carte: CarteLieu | null }>> {
      const r = await client.demander<{ carte: CarteLieu | null }>("GET", `/pro/lieux/${lieuId}/carte`);
      return r.ok ? { ok: true, carte: r.carte } : r;
    },
    async reglerCarteDuLieu(lieuId, carte): Promise<ReponseApi<{ carte: CarteLieu }>> {
      const r = await client.demander<{ carte: CarteLieu | null }>("PUT", `/pro/lieux/${lieuId}/carte`, { corps: { carte } });
      if (!r.ok) return r;
      // Une carte vide est effacée par l'API (null) : l'app garde alors une carte sans section
      return { ok: true, carte: r.carte ?? { sections: [], majLe: carte.majLe } };
    },
    ecouter: creerEcouteReguliere(INTERVALLE_ECRAN_COMPTOIR_MS),
  };
}
