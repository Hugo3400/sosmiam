// Les propositions de modification jouées sur le téléphone (démo) : mêmes règles que POST /comptes/moi/suggestions de l'API.
// Compte connecté ; proposition revérifiée (validerPropositionLieu) ; seuls les champs qui changent par rapport à la fiche
// sont gardés (« rien-a-changer » sinon) ; 10 propositions par 24 h et par compte, 3 en attente au plus sur un lieu.
import type { ServiceSuggestions } from "@sos-miam/commun/client-api/contrat-suggestions";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { PropositionLieu } from "@sos-miam/commun/types/proposition-lieu";
import { validerPropositionLieu } from "@sos-miam/commun/validation/valider-proposition-lieu";

import { lieuxExemples } from "~/contenus/lieux-exemples";

import type { ContexteDemo } from "./types-demo";

const JOUR_MS = 24 * 60 * 60 * 1000;
const PAR_JOUR_ET_PAR_COMPTE = 10;
const EN_ATTENTE_PAR_LIEU = 3;
const CASES = ["accessible", "terrasse", "wifi", "enfants", "parking"] as const;

/** Ne garde que ce qui change par rapport à la fiche (texte, infos pratiques) ; l'adresse, absente des exemples, change toujours */
function garderCeQuiChange(p: PropositionLieu, lieu: Lieu, pratique: InfosPratiques): PropositionLieu {
  const garde: Record<string, unknown> = {};
  if (p.nom !== undefined && p.nom !== lieu.nom) garde.nom = p.nom;
  if (p.adresse !== undefined) garde.adresse = p.adresse;
  if (p.horaires !== undefined && p.horaires !== lieu.horaires) garde.horaires = p.horaires;
  if (p.texte !== undefined && p.texte !== lieu.texte) garde.texte = p.texte;
  for (const cle of ["telephone", "siteWeb", "instagram", "animaux", "reservation"] as const) {
    if (p[cle] !== undefined && p[cle] !== pratique[cle]) garde[cle] = p[cle];
  }
  for (const cle of CASES) {
    if (p[cle] !== undefined && (p[cle] === true) !== (pratique[cle] === true)) garde[cle] = p[cle];
  }
  if (p.paiements !== undefined) {
    const avant = pratique.paiements ?? [];
    if (p.paiements.length !== avant.length || p.paiements.some((m) => !avant.includes(m))) garde.paiements = p.paiements;
  }
  return garde as PropositionLieu;
}

export function creerSuggestionsDemo(ctx: ContexteDemo): ServiceSuggestions {
  return {
    async proposer(lieuId, suggestion) {
      const client = ctx.lireClient();
      if (!client) return { ok: false, erreur: "connexion-requise" };
      const lieu = lieuxExemples.find((l) => l.id === lieuId);
      // Un bar n'existe pas pour un 15-17 ans, comme partout dans l'app
      if (!lieu || (lieu.type === "bar" && !client.majeur)) return { ok: false, erreur: "lieu-inconnu" };
      const valide = validerPropositionLieu(suggestion);
      if (!valide.ok) return { ok: false, erreur: valide.erreur };

      return ctx.magasin.modifier((m, maintenantMs): ReponseApi<{ id: number }> => {
        // Comme sur la fiche : les infos remplies par le lieu s'il l'a fait, sinon celles de la fiche
        const pratique = m.infosPratiques?.[lieuId] ?? lieu.pratique ?? {};
        const proposition = garderCeQuiChange(valide.suggestion.proposition, lieu, pratique);
        if (Object.keys(proposition).length === 0) return { ok: false, erreur: "rien-a-changer" };
        const toutes = m.suggestions ?? [];
        const recentes = toutes.filter((s) => s.client === client.cle && maintenantMs - Date.parse(s.creeLe) < JOUR_MS).length;
        const enAttenteIci = toutes.filter((s) => s.lieuId === lieuId && s.statut === "en-attente").length;
        if (recentes >= PAR_JOUR_ET_PAR_COMPTE || enAttenteIci >= EN_ATTENTE_PAR_LIEU) return { ok: false, erreur: "trop-de-suggestions" };
        const id = m.prochainId;
        m.prochainId += 1;
        m.suggestions = [
          ...toutes,
          { id, lieuId, client: client.cle, proposition, message: valide.suggestion.message, creeLe: new Date(maintenantMs).toISOString(), statut: "en-attente" },
        ];
        return { ok: true, id };
      });
    },
  };
}
