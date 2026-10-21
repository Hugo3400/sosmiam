import { creerStockageMediasChat, creerStockageMediasChatEnMemoire } from "./stockage-medias-chat.ts";

export const DOSSIER_SIGNALEMENTS_SECURITE = process.env.DOSSIER_SIGNALEMENTS_SECURITE || "/var/lib/sos-miam/signalements-securite";

export const creerStockageSignalementsSecurite = (dossier = DOSSIER_SIGNALEMENTS_SECURITE) => creerStockageMediasChat(dossier);

export const creerStockageSignalementsSecuriteEnMemoire = creerStockageMediasChatEnMemoire;
