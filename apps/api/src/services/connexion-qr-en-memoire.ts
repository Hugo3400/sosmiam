// Connexion par QR en mémoire (tests, API de démonstration) : mêmes règles que connexion-qr.ts ; rien n'est écrit nulle part.
import { choisirRemiseQr } from "../fonctions/comptes/choisir-remise-qr.ts";
import { creerStockageSessionsComptesEnMemoire, type StockageSessionsComptes } from "../middlewares/proteger-comptes.ts";
import type { DemandeQr, ServicesConnexionQr } from "./connexion-qr-regles.ts";

/** sessionEmpreinte : la session remise (en mémoire, les sessions se retrouvent par leur empreinte, pas par un numéro) */
type DemandeGardee = DemandeQr & {
  codeEmpreinte: string; secretEmpreinte: string; sessionEmpreinte: string | null; remisLe: number | null; nombreRemises: number | null;
};

/**
 * `compteExiste` : vrai tant que le compte existe (une demande part avec le compte qui l'a scannée, comme dans la base) ;
 * `sessions` : où les sessions remises sont ouvertes et révoquées (celles de la protection des comptes).
 */
export function creerConnexionQrEnMemoire(
  compteExiste: (id: number) => boolean = () => true, sessions: StockageSessionsComptes = creerStockageSessionsComptesEnMemoire(),
) {
  const demandes: DemandeGardee[] = [];
  let prochain = 0;
  const vivantes = () => demandes.filter((d) => d.compteId === null || compteExiste(d.compteId));
  const sans = ({ codeEmpreinte: _c, secretEmpreinte: _s, sessionEmpreinte: _e, remisLe: _r, nombreRemises: _n, ...demande }: DemandeGardee): DemandeQr => ({ ...demande });
  const trouver = (id: number) => vivantes().find((d) => d.id === id);

  const services: ServicesConnexionQr = {
    async creer(demande) {
      if (demandes.some((d) => d.codeEmpreinte === demande.codeEmpreinte || d.secretEmpreinte === demande.secretEmpreinte)) throw new Error("empreinte déjà prise");
      demandes.push({ ...demande, id: ++prochain, statut: "attente", compteId: null, scanneLe: null, reponduLe: null, sessionEmpreinte: null, remisLe: null, nombreRemises: null });
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
    async remettre(id, empreinteSession, maintenant) {
      const demande = trouver(id);
      const remise = demande && demande.compteId !== null ? choisirRemiseQr(demande, maintenant) : null;
      if (!demande || demande.compteId === null || !remise) return false;
      const ancienne = demande.sessionEmpreinte;
      Object.assign(demande, {
        statut: "utilisee", sessionEmpreinte: empreinteSession,
        remisLe: remise === "premiere" ? maintenant : demande.remisLe, nombreRemises: (demande.nombreRemises ?? 0) + 1,
      });
      // Révoquer et ouvrir partent dans le même tour, sans attente entre la décision et eux : rien ne se glisse au milieu
      const session = { compteId: demande.compteId, creeLe: maintenant, activite: maintenant, support: demande.cible };
      await Promise.all([ancienne ? sessions.supprimer(ancienne) : undefined, sessions.creer(empreinteSession, session)]);
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
