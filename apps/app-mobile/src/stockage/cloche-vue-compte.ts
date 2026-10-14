// Le « vu jusqu'à » de la cloche d'un compte connecté, gardé aussi sur le téléphone : sans profil social (Potes jamais
// ouvert), le serveur ne peut pas le garder (lire la cloche ne crée jamais le profil), et la pastille ne retomberait jamais
// à zéro. Avec un profil social, le serveur fait foi (le même sur tous tes téléphones) ; celui-ci empêche seulement de
// reculer. Rien de sensible (une date) : AsyncStorage suffit. Effacé à la déconnexion.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.cloche-vue";

type ClocheVue = { compteCreeLe: string; vuesLe: string };

/** La date gardée pour ce compte (sa date de création le désigne), ou null */
export async function lireClocheVue(compteCreeLe: string): Promise<string | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<ClocheVue>;
    return lu.compteCreeLe === compteCreeLe && typeof lu.vuesLe === "string" && !Number.isNaN(Date.parse(lu.vuesLe)) ? lu.vuesLe : null;
  } catch {
    return null;
  }
}

export async function enregistrerClocheVue(compteCreeLe: string, vuesLe: string): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify({ compteCreeLe, vuesLe } satisfies ClocheVue)).catch(() => {});
}

export async function effacerClocheVue(): Promise<void> {
  await AsyncStorage.removeItem(CLE).catch(() => {});
}
