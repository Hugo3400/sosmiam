// Les signalements de contenus sociaux (message, commentaire, liste, profil, sortie, groupe) d'un compte connecté pas encore
// partis à la modération (pas de réseau au moment de signaler) : renvoyés dès que possible, et gardés d'ici là pour que le
// contenu reste caché sur ce téléphone. Liés au compte (sa date de création le désigne) ; effacés à la déconnexion.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SignalementSocialEnvoye } from "@sos-miam/commun/client-api/contrat-signalements-sociaux";
import { CIBLES_SIGNALEMENT_SOCIAL } from "@sos-miam/commun/regles/signalement";

const CLE = "sosmiam.signalements-sociaux-a-envoyer";
const MAXIMUM = 50;

type EnAttente = { compteCreeLe: string; signalements: SignalementSocialEnvoye[] };

const estBienForme = (s: unknown): s is SignalementSocialEnvoye => {
  if (!s || typeof s !== "object") return false;
  const x = s as Record<string, unknown>;
  return (
    (CIBLES_SIGNALEMENT_SOCIAL as readonly unknown[]).includes(x.cible) &&
    typeof x.cibleId === "string" &&
    typeof x.raison === "string" &&
    (x.precision === null || typeof x.precision === "string") &&
    typeof x.explication === "string"
  );
};

/** Ceux de ce compte, ou rien */
export async function lireSignalementsSociauxAEnvoyer(compteCreeLe: string): Promise<SignalementSocialEnvoye[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<EnAttente>) : null;
    if (!lu || lu.compteCreeLe !== compteCreeLe || !Array.isArray(lu.signalements)) return [];
    return lu.signalements.filter(estBienForme);
  } catch {
    return [];
  }
}

export async function remplacerSignalementsSociauxAEnvoyer(compteCreeLe: string, signalements: SignalementSocialEnvoye[]): Promise<void> {
  if (signalements.length === 0) return void (await AsyncStorage.removeItem(CLE).catch(() => {}));
  await AsyncStorage.setItem(CLE, JSON.stringify({ compteCreeLe, signalements: signalements.slice(-MAXIMUM) } satisfies EnAttente)).catch(() => {});
}

export async function effacerSignalementsSociauxAEnvoyer(): Promise<void> {
  await AsyncStorage.removeItem(CLE).catch(() => {});
}
