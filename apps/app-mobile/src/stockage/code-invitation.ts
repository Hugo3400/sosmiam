// Ton code secret d'invitation : tiré au hasard une seule fois, puis gardé dans le coffre-fort du téléphone (Trousseau iOS,
// Keystore Android), comme le profil. Il va dans ton lien et ton QR code (« ?c=<code> ») : sans lui, un lien d'invitation
// se fabriquerait avec ton seul pseudo, qui est public. Démo : rien ne le vérifie encore. Quand les comptes arriveront, c'est
// l'API qui le créera, le vérifiera et pourra le renouveler.
// Sur le web (aperçu de développement seulement), pas de coffre-fort : AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { creerCodeInvitation } from "~/fonctions/communaute/creer-code-invitation";

const CLE = "sosmiam.code-invitation";
const FORME = /^[a-z0-9]{12}$/;
const surLeWeb = Platform.OS === "web";

/** Ton code d'invitation ; créé et rangé la première fois. Si le coffre-fort ne répond pas, un code neuf sert le temps de cette ouverture. */
export async function lireCodeInvitation(): Promise<string> {
  try {
    const lu = surLeWeb ? await AsyncStorage.getItem(CLE) : await SecureStore.getItemAsync(CLE);
    if (lu && FORME.test(lu)) return lu;
  } catch {
    return creerCodeInvitation();
  }
  const code = creerCodeInvitation();
  try {
    await (surLeWeb ? AsyncStorage.setItem(CLE, code) : SecureStore.setItemAsync(CLE, code));
  } catch {
    // Pas rangé : le lien changera à la prochaine ouverture, rien de grave dans la démo
  }
  return code;
}
