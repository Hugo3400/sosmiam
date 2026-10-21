import { monde } from "./monde.mjs";

const effacer = (nom) => async () => {
  if (monde.attenteEffacement) await new Promise((fin) => setTimeout(fin, monde.attenteEffacement));
  monde.effacements.push(nom);
};

export const utiliserActivite = () => ({ effacer: effacer("activite") });
export const utiliserAppareilPush = () => ({ effacerReglages: effacer("telephone") });
export const utiliserCommunaute = () => ({ effacer: effacer("communaute") });
export const utiliserConversations = () => ({ effacer: effacer("conversations") });
export const utiliserNotifications = () => ({ effacer: effacer("notifications") });
export const utiliserOutilsDemo = () => null;
export const utiliserSuivisPersonnes = () => ({ effacer: effacer("suivis") });
export const oublierReglagesDemo = effacer("reglages-demo");
export const effacerEnviesMiamis = effacer("envies");
export const effacerModeApp = effacer("mode");
export const effacerRolesDemo = effacer("roles");
export const effacerSignalementsLocaux = effacer("signalements");
