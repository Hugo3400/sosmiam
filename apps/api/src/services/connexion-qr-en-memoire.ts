// Connexion par QR en mémoire (tests, API de démonstration) : mêmes règles que connexion-qr.ts ; rien n'est écrit nulle part.
import type { DemandeQr, ServicesConnexionQr } from "./connexion-qr-regles.ts";

type DemandeGardee = DemandeQr & { codeEmpreinte: string; secretEmpreinte: string };

/** `compteExiste` : vrai tant que le compte existe (une demande part avec le compte qui l'a scannée, comme dans la base) */
export function creerConnexionQrEnMemoire(compteExiste: (id: number) => boolean = () => true) {
  const demandes: DemandeGardee[] = [];
  let prochain = 0;
  const vivantes = () => demandes.filter((d) => d.compteId === null || compteExiste(d.compteId));
  const sans = ({ codeEmpreinte: _c, secretEmpreinte: _s, ...demande }: DemandeGardee): DemandeQr => ({ ...demande });
  const trouver = (id: number) => vivantes().find((d) => d.id === id);

  const services: ServicesConnexionQr = {
    async creer(demande) {
      if (demandes.some((d) => d.codeEmpreinte === demande.codeEmpreinte || d.secretEmpreinte === demande.secretEmpreinte)) throw new Error("empreinte déjà prise");
      demandes.push({ ...demande, id: ++prochain, statut: "attente", compteId: null, scanneLe: null, reponduLe: null });
    },
    async lireParCode(empreinte) {
      const demande = vivantes().find((d) => d.codeEmpreinte === empreinte);
      return demande ? sans(demande) : null;
    },
    async lireParSecret(empreinte) {
      const demande = vivantes().find((d) => d.secretEmpreinte === empreinte);
      return demande ? sans(demande) : null;
    },
    async noterScan(id, compteId, maintenant) {
      const demande = trouver(id);
      if (!demande || demande.statut !== "attente") return false;
      Object.assign(demande, { statut: "scanne", compteId, scanneLe: maintenant });
      return true;
    },
    async repondre(id, compteId, accepte, maintenant) {
      const demande = trouver(id);
      if (!demande || demande.statut !== "scanne" || demande.compteId !== compteId) return false;
      Object.assign(demande, { statut: accepte ? "accepte" : "refuse", reponduLe: maintenant });
      return true;
    },
    async utiliser(id) {
      const demande = trouver(id);
      if (!demande || demande.statut !== "accepte") return false;
      demande.statut = "utilisee";
      return true;
    },
  };
  /** Le ménage de nuit, comme effacerDemandesQrExpirees */
  const effacerExpirees = (avant: number) => {
    const avantMenage = demandes.length;
    for (let i = demandes.length - 1; i >= 0; i--) if (demandes[i].expireLe < avant) demandes.splice(i, 1);
    return avantMenage - demandes.length;
  };
  return { services, demandes, effacerExpirees };
}
