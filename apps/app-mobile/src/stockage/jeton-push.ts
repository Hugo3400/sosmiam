// Le dernier jeton de notifications envoyé au serveur (APNs ou FCM) : de quoi désinscrire ce téléphone quand on coupe les
// notifications, même déconnecté. Ce n'est pas un secret de compte : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.jeton-push";

export const lireJetonPush = () => AsyncStorage.getItem(CLE).catch(() => null);
export const enregistrerJetonPush = (jeton: string) => AsyncStorage.setItem(CLE, jeton).catch(() => {});
export const effacerJetonPush = () => AsyncStorage.removeItem(CLE).catch(() => {});
