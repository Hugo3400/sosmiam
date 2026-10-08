// Rôles joués dans la démo des visites (« Je joue l'équipe de Chez Nonna Lia », « Je suis ambassadeur »), réglés dans les
// Coulisses de la démo et gardés sur le téléphone. Utilisés seulement en démo : sans démo, les rôles viendront du compte.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LieuGere, RolesCompte, StatutAmbassadeur } from "@sos-miam/commun/types/roles";

/** Aucun rôle : ni pro, ni ambassadeur */
export const ROLES_VIDES: RolesCompte = { ambassadeur: null, pro: [] };

const CLE = "sosmiam.demo-roles";
const STATUTS: readonly StatutAmbassadeur[] = ["en-attente", "actif", "refuse", "suspendu"];

/** Garde un lieu géré seulement s'il a la bonne forme (un stockage abîmé ne doit rien ouvrir de travers). */
function lireLieuGere(brut: unknown): LieuGere | null {
  if (!brut || typeof brut !== "object") return null;
  const l = brut as Partial<LieuGere>;
  if (typeof l.id !== "number" || !Number.isInteger(l.id) || typeof l.nom !== "string" || typeof l.emoji !== "string") return null;
  if (l.role !== "gerant" && l.role !== "equipe") return null;
  return { id: l.id, nom: l.nom, emoji: l.emoji, role: l.role };
}

/** Lit les rôles de démo (aucun si rien, ou illisible). */
export async function lireRolesDemo(): Promise<RolesCompte> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<RolesCompte> | null) : null;
    if (!lu || typeof lu !== "object") return ROLES_VIDES;
    const ambassadeur = STATUTS.includes(lu.ambassadeur as StatutAmbassadeur) ? (lu.ambassadeur as StatutAmbassadeur) : null;
    const pro = Array.isArray(lu.pro) ? lu.pro.map(lireLieuGere).filter((l): l is LieuGere => l !== null) : [];
    return { ambassadeur, pro };
  } catch {
    return ROLES_VIDES;
  }
}

/** Enregistre les rôles de démo. */
export async function enregistrerRolesDemo(roles: RolesCompte): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(roles));
}

/** Oublie les rôles de démo. */
export async function effacerRolesDemo(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
