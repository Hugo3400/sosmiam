import type { DepotSecurite, EntreeTableauEnBase, SignalementAvecTableau, SignalementEnBase } from "./securite-regles.ts";

export type CompteSecuriteEnMemoire = { id: number; email: string; confirme: boolean };

export type DepotSecuriteEnMemoire = DepotSecurite & {
  signalements: Map<string, SignalementEnBase>;
  entrees: Map<number, EntreeTableauEnBase>;
  comptes: CompteSecuriteEnMemoire[];
  badges: Set<string>;
};

const copier = (s: SignalementEnBase): SignalementEnBase => ({ ...s, images: [...s.images] });
const memesImages = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((f, k) => f === b[k]);

export function creerDepotSecuriteEnMemoire(): DepotSecuriteEnMemoire {
  const signalements = new Map<string, SignalementEnBase>();
  const entrees = new Map<number, EntreeTableauEnBase>();
  const comptes: CompteSecuriteEnMemoire[] = [];
  const badges = new Set<string>();
  let prochaineEntree = 1;

  const avecTableau = (s: SignalementEnBase): SignalementAvecTableau => ({
    ...copier(s), auTableauHonneur: [...entrees.values()].some((e) => e.signalementId === s.id),
  });
  const lireDepotsEmail = (empreinte: string, depuis: Date) => [...signalements.values()]
    .filter((s) => s.emailEmpreinte === empreinte && s.creeLe.getTime() > depuis.getTime())
    .map((s) => s.creeLe);
  const retirer = (id: string) => {
    const s = signalements.get(id);
    if (!s) return null;
    signalements.delete(id);
    for (const e of entrees.values()) if (e.signalementId === id) entrees.set(e.id, { ...e, signalementId: null });
    return s;
  };

  return {
    signalements,
    entrees,
    comptes,
    badges,

    listerDepotsEmail: async (empreinte, depuis) => lireDepotsEmail(empreinte, depuis),

    ajouterSignalement: async (signalement, { depuis, maximum }) => {
      const depots = lireDepotsEmail(signalement.emailEmpreinte, depuis);
      if (depots.length >= maximum) return { ok: false, depots };
      if (signalements.has(signalement.id)) throw new Error("Clé primaire déjà prise");
      signalements.set(signalement.id, copier(signalement));
      return { ok: true };
    },

    listerSignalements: async ({ statut }, nombre) => [...signalements.values()]
      .filter((s) => statut === undefined || s.statut === statut)
      .sort((a, b) => Number(b.statut === "nouveau") - Number(a.statut === "nouveau") || b.creeLe.getTime() - a.creeLe.getTime() || (a.id < b.id ? 1 : -1))
      .slice(0, nombre)
      .map(avecTableau),

    listerSignalementsApres: async (apres, nombre) => [...signalements.values()]
      .filter((s) => apres === null || s.id > apres)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .slice(0, nombre)
      .map(copier),

    lireSignalement: async (id) => {
      const s = signalements.get(id);
      return s ? avecTableau(s) : null;
    },

    modifierSignalement: async (id, changements) => {
      const s = signalements.get(id);
      if (!s) return false;
      signalements.set(id, { ...s, ...changements });
      return true;
    },

    remplacerChiffres: async (id, imagesAvant, chiffres) => {
      const s = signalements.get(id);
      if (!s || !memesImages(s.images, imagesAvant)) return false;
      signalements.set(id, { ...s, ...chiffres, images: [...chiffres.images] });
      return true;
    },

    supprimerSignalement: async (id) => {
      const s = retirer(id);
      return s ? { images: [...s.images] } : null;
    },

    effacerSignalementsClosAvant: async (limite) => {
      const anciens = [...signalements.values()].filter((s) => s.clotureLe !== null && s.clotureLe.getTime() < limite.getTime());
      for (const s of anciens) retirer(s.id);
      return { nombre: anciens.length, images: anciens.flatMap((s) => s.images) };
    },

    listerImagesCitees: async (fichiers) => new Set([...signalements.values()].flatMap((s) => s.images).filter((f) => fichiers.includes(f))),

    listerEmailsConfirmes: async (emails) => new Set(comptes.filter((c) => c.confirme && emails.includes(c.email)).map((c) => c.email)),

    donnerBadge: async (signalementId, email, badge, quand) => {
      const s = signalements.get(signalementId);
      if (!s) return { ok: false, erreur: "signalement-inconnu" };
      const compte = comptes.find((c) => c.confirme && c.email === email);
      if (!compte) return { ok: false, erreur: "compte-introuvable" };
      const cle = `${compte.id}:${badge}`;
      const nouveau = !badges.has(cle);
      badges.add(cle);
      signalements.set(signalementId, { ...s, badgeDonneLe: s.badgeDonneLe ?? quand });
      return { ok: true, nouveau };
    },

    listerTableauHonneur: async (nombre) => [...entrees.values()]
      .sort((a, b) => (a.mois === b.mois ? b.id - a.id : a.mois < b.mois ? 1 : -1))
      .slice(0, nombre)
      .map((e) => ({ ...e })),

    ajouterAuTableau: async ({ nom, mois, signalementId }, quand) => {
      if (!signalements.has(signalementId)) throw new Error("Clé étrangère : signalement absent");
      if ([...entrees.values()].some((e) => e.signalementId === signalementId)) return;
      const id = prochaineEntree++;
      entrees.set(id, { id, nom, mois, signalementId, creeLe: quand });
    },

    retirerDuTableauParSignalement: async (signalementId) => {
      const trouvee = [...entrees.values()].find((e) => e.signalementId === signalementId);
      return trouvee ? entrees.delete(trouvee.id) : false;
    },

    retirerEntreeTableau: async (id) => entrees.delete(id),
  };
}
