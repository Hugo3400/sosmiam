// La marque « ta session a pris fin » : posée quand l'app oublie un compte que le serveur dit expiré, lue une fois par
// l'écran du compte pour te dire de te reconnecter, puis effacée.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.session-perdue";

export const poserSessionPerdue = () => AsyncStorage.setItem(CLE, "1").catch(() => {});
export const lireSessionPerdue = async () => (await AsyncStorage.getItem(CLE).catch(() => null)) === "1";
export const effacerSessionPerdue = () => AsyncStorage.removeItem(CLE).catch(() => {});
