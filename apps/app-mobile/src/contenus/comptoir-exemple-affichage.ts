// TEMPORAIRE : données d'exemple pour montrer l'affichage du Comptoir (mode pro) avant de brancher la logique.
// À supprimer quand l'écran lira le vrai comptoir (utiliserComptoir).
import type { EtatComptoir, QrAffiche } from "@sos-miam/commun/types/comptoir";

const il = (maintenant: Date, minutes: number) => new Date(maintenant.getTime() - minutes * 60_000).toISOString();
const dans = (maintenant: Date, minutes: number) => new Date(maintenant.getTime() + minutes * 60_000).toISOString();

/** Un comptoir bien rempli : deux additions, une récompense à offrir, trois validations encore annulables (réduction, offert, payé) */
export function creerComptoirExempleAffichage(maintenant: Date): EtatComptoir {
  return {
    lieu: { id: 0, nom: "Chez Nonna Lia", emoji: "🍝", type: "resto", ville: "Montpellier" },
    validationActive: true,
    qr: null,
    demandes: [
      { id: 1, type: "addition", code: "5307", prenom: "Karim", initialeNom: "B", avatar: "🧑‍🍳", depuis: il(maintenant, 6), recompense: null, tamponsIci: 3 },
      { id: 2, type: "recompense", code: "8214", prenom: "Inès", initialeNom: null, avatar: "🦄", depuis: il(maintenant, 2), recompense: "un tiramisu maison", tamponsIci: 0 },
      { id: 3, type: "addition", code: "4189", prenom: "Hugo", initialeNom: "R", avatar: "🦸", depuis: il(maintenant, 0), recompense: null, tamponsIci: 1 },
    ],
    arrivees: [],
    reservationsARepondre: 0,
    validees: [
      { visiteId: 10, mode: "comptoir", prenom: "Léa", initialeNom: "M", avatar: "🍜", valideLe: il(maintenant, 3), annulableJusqua: dans(maintenant, 12), reglement: { type: "reduction", reductionPourcent: 20, avantages: ["happy-hour"] } },
      { visiteId: 11, mode: "addition", prenom: "Tom", initialeNom: "D", avatar: "🎸", valideLe: il(maintenant, 9), annulableJusqua: dans(maintenant, 6), reglement: { type: "offert", reductionPourcent: null, avantages: ["partenariat"] } },
      { visiteId: 12, mode: "addition", prenom: "Sofia", initialeNom: "K", avatar: "🌻", valideLe: il(maintenant, 11), annulableJusqua: dans(maintenant, 4), reglement: { type: "paye", reductionPourcent: null, avantages: ["recompense-fidelite"] } },
    ],
    genereLe: maintenant.toISOString(),
  };
}

/** Le QR allumé pour 4 personnes, dont 2 ont déjà scanné */
export function creerQrExempleAffichage(maintenant: Date): QrAffiche {
  return { texte: "https://sosmiam.fr/c/exemple", presentationId: 99, fenetre: 0, changeDansMs: 18_000, personnes: 4, restantes: 2, finitLe: dans(maintenant, 1.2) };
}
