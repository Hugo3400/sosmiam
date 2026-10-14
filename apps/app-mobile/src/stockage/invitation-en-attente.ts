// Le lien d'invitation ouvert avant d'avoir un compte (sosmiam.fr/invitation/…) : gardé le temps de t'inscrire, puis
// rouvert une fois dans « Ajouter un pote ». Effacé dès qu'il a servi.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.invitation-en-attente";

export const garderInvitationEnAttente = (lien: string) => AsyncStorage.setItem(CLE, lien).catch(() => {});
export const lireInvitationEnAttente = () => AsyncStorage.getItem(CLE).catch(() => null);
export const effacerInvitationEnAttente = () => AsyncStorage.removeItem(CLE).catch(() => {});
