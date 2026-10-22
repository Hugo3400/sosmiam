import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BrouillonsChat } from "~/contenus/type-brouillon-chat";
import { nettoyerBrouillonsChat } from "~/fonctions/chat/nettoyer-brouillons-chat";
import { placerBrouillonChat } from "~/fonctions/chat/placer-brouillon-chat";

const CLE = "sosmiam.brouillons-chat";
const AUCUN: BrouillonsChat = new Map();

let enMemoire: BrouillonsChat | null = null;
let lecture: Promise<BrouillonsChat> | null = null;
const ecouteurs = new Set<() => void>();

function prevenir() {
  for (const ecouteur of [...ecouteurs]) {
    try {
      ecouteur();
    } catch {}
  }
}

async function lireGardes(): Promise<BrouillonsChat> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    return nettoyerBrouillonsChat(brut ? JSON.parse(brut) : null);
  } catch {
    return AUCUN;
  }
}

export function lireBrouillonsChatEnMemoire(): BrouillonsChat {
  return enMemoire ?? AUCUN;
}

export function ecouterBrouillonsChat(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}

export function chargerBrouillonsChat(): Promise<BrouillonsChat> {
  if (enMemoire) return Promise.resolve(enMemoire);
  lecture ??= lireGardes().then((lus) => {
    if (!enMemoire) {
      enMemoire = lus;
      prevenir();
    }
    return enMemoire;
  });
  return lecture;
}

export async function enregistrerBrouillonChat(conversationId: string, texte: string): Promise<void> {
  const gardes = await chargerBrouillonsChat();
  const suite = placerBrouillonChat(enMemoire ?? gardes, conversationId, texte, new Date().toISOString());
  if (suite === enMemoire) return;
  enMemoire = suite;
  prevenir();
  try {
    await AsyncStorage.setItem(CLE, JSON.stringify(Object.fromEntries(suite)));
  } catch {}
}

export async function effacerBrouillonsChat(): Promise<void> {
  enMemoire = AUCUN;
  lecture = null;
  prevenir();
  await AsyncStorage.removeItem(CLE);
}
