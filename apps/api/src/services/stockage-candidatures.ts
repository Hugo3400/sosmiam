import { creerStockageMediasChat, creerStockageMediasChatEnMemoire } from "./stockage-medias-chat.ts";

export const DOSSIER_CANDIDATURES = process.env.DOSSIER_CANDIDATURES || "/var/lib/sos-miam/candidatures";

export const creerStockageCandidatures = (dossier = DOSSIER_CANDIDATURES) => creerStockageMediasChat(dossier);

export const creerStockageCandidaturesEnMemoire = creerStockageMediasChatEnMemoire;
