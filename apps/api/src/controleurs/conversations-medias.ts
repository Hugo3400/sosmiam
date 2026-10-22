// Photos et notes vocales du chat, et photo d'un groupe (voir routes/conversations.ts). Le corps brut est posé par express.raw
// sur les seules routes POST /:id/medias et PUT /:id/photo. On reconnaît le fichier à sa SIGNATURE (le type annoncé ne suffit
// pas), on le vérifie, puis on retire ses métadonnées AVANT de l'écrire (chiffré) :
// - photo : JPEG, 5 Mo et 4 096 px de côté au plus ; EXIF (position comprise), XMP, commentaires retirés, et tout ce qui
//   suit la fin de l'image principale coupé (images MPF, données collées) ;
// - note vocale : MP4/M4A, une seule piste, audio AAC, aucune vidéo, 2 Mo et 61 s au plus (durée relue dans le fichier) ;
//   boîtes udta, meta et uuid neutralisées (la position « ©xyz » disparaît, le son se lit toujours).
// Lecture : les octets en clair, jamais en cache, seulement pour un membre qui voit le message (ou un membre du groupe).
import type { Request, Response } from "express";

import {
  COTE_MAX_PHOTO_CHAT, DUREE_MAX_VOCAL_SECONDES, FORME_ID_CLIENT, FORME_ONDE_VOCAL, TAILLE_MAX_PHOTO_CHAT, TAILLE_MAX_VOCAL_CHAT,
  TOLERANCE_DUREE_VOCAL_SECONDES,
} from "../../../../packages/commun/src/regles/chat.ts";
import { LONGUEUR_MAX_MESSAGE } from "../../../../packages/commun/src/regles/potes.ts";
import { lireDureeMp4 } from "../fonctions/medias/lire-duree-mp4.ts";
import { lireTailleJpeg } from "../fonctions/medias/lire-taille-jpeg.ts";
import { neutraliserMetadonneesMp4 } from "../fonctions/medias/neutraliser-metadonnees-mp4.ts";
import { verifierVocalMp4 } from "../fonctions/medias/verifier-vocal-mp4.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import type { ContexteRoutesSociales, DependancesSocialApp } from "../routes/social-app.ts";
import type { MediaRecu } from "../services/messagerie-regles.ts";
import { nettoyerJpeg, type NettoyerJpeg } from "../services/nettoyeur-jpeg.ts";
import { lireNumero, rendreRefus } from "./conversations.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireIdClient, lireTexteSocial, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus des photos et notes vocales (spécification sociale D.0, D.3, B.12) */
export const ERREURS_MEDIAS_CHAT: Readonly<Record<string, number>> = {
  "conversation-inconnue": 404, "conversation-fermee": 403, "message-inconnu": 404, "trop-de-medias": 409, "stockage-plein": 503,
  "media-expire": 410, "media-invalide": 400, "media-trop-lourd": 413, "format-refuse": 415, "album-plein": 409, "onde-invalide": 400,
  "reserve-aux-admins": 403, "geree-par-la-sortie": 409, "photo-inconnue": 404,
};

/** Les types annoncés acceptés par express.raw (audio/x-m4a : certains Android) */
export const TYPES_MEDIAS_CHAT = ["image/jpeg", "audio/mp4", "audio/x-m4a"];

type Media = MediaRecu extends infer M ? (M extends unknown ? Omit<M, "idClient"> : never) : never;
export type ControleMediaChat = { type: "photo"; largeur: number; hauteur: number } | { type: "vocal"; dureeSecondes: number };

const estJpeg = (o: Buffer) => o.length >= 4 && o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff;
const estMp4 = (o: Buffer) => o.length >= 12 && o.toString("latin1", 4, 8) === "ftyp";
const invalide = (champ: "format" | "dimensions" | "duree") => refuserSocial("media-invalide", ERREURS_MEDIAS_CHAT, champ);

function lireAjoutsMedia(requete: Request) {
  const album = requete.get("x-album");
  if (album !== undefined && !FORME_ID_CLIENT.test(album)) throw new ChampInvalide("album");
  const onde = requete.get("x-onde");
  if (onde !== undefined && !FORME_ONDE_VOCAL.test(onde)) throw refuserSocial("onde-invalide", ERREURS_MEDIAS_CHAT);
  const brut = requete.get("x-legende");
  if (brut === undefined) return { album: album ?? null, onde: onde ?? null, legende: null };
  let decode: string;
  try {
    if (!/^[\x20-\x7e]*$/.test(brut)) throw new Error("legende");
    decode = decodeURIComponent(brut);
  } catch {
    throw new ChampInvalide("legende");
  }
  return { album: album ?? null, onde: onde ?? null, legende: lireTexteSocial({ legende: decode }, "legende", LONGUEUR_MAX_MESSAGE, false) };
}

const lireTypeAnnonce = (requete: Request) => (requete.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();

/** Le fichier reçu, reconnu, vérifié et nettoyé ; lance le refus qui convient (415, 413, 400 media-invalide) */
export function controlerMediaChat(octets: Buffer, typeAnnonce: string): ControleMediaChat {
  if (typeAnnonce === "image/jpeg") {
    if (!estJpeg(octets)) throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
    if (octets.length > TAILLE_MAX_PHOTO_CHAT) throw refuserSocial("media-trop-lourd", ERREURS_MEDIAS_CHAT);
    const taille = lireTailleJpeg(octets);
    if (!taille) throw invalide("format");
    if (taille.largeur > COTE_MAX_PHOTO_CHAT || taille.hauteur > COTE_MAX_PHOTO_CHAT) throw invalide("dimensions");
    return { type: "photo", largeur: taille.largeur, hauteur: taille.hauteur };
  }
  if (typeAnnonce === "audio/mp4" || typeAnnonce === "audio/x-m4a") {
    if (!estMp4(octets)) throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
    if (octets.length > TAILLE_MAX_VOCAL_CHAT) throw refuserSocial("media-trop-lourd", ERREURS_MEDIAS_CHAT);
    if (verifierVocalMp4(octets) !== "ok") throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
    const duree = lireDureeMp4(octets);
    if (duree === null) throw invalide("format");
    if (duree > DUREE_MAX_VOCAL_SECONDES + TOLERANCE_DUREE_VOCAL_SECONDES) throw invalide("duree");
    return { type: "vocal", dureeSecondes: Math.max(1, Math.round(duree)) };
  }
  throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
}

export async function preparerMediaChat(octets: Buffer, controle: ControleMediaChat, nettoyer: NettoyerJpeg = nettoyerJpeg): Promise<Media> {
  if (controle.type === "vocal") return { ...controle, octets: neutraliserMetadonneesMp4(octets) };
  const propre = await nettoyer(octets);
  if (!propre) throw invalide("format");
  return { ...controle, octets: propre };
}

export function creerControleursMediasChat(d: Pick<DependancesSocialApp, "messagerie">, contexte: Pick<ContexteRoutesSociales, "horloge" | "appliquer">) {
  const maintenant = () => new Date(contexte.horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  return {
    /** POST /app/conversations/:id/medias (corps brut, Idempotency-Key) : 201 nouveau, 200 envoi rejoué */
    async envoyerMedia(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const idClient = lireIdClient(requete);
      const ajouts = lireAjoutsMedia(requete);
      const corps: unknown = requete.body;
      if (!Buffer.isBuffer(corps) || corps.length === 0) throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
      const controle = controlerMediaChat(corps, lireTypeAnnonce(requete));
      if (controle.type === "vocal" && ajouts.album !== null) throw new ChampInvalide("album");
      if (controle.type === "vocal" && ajouts.legende !== null) throw new ChampInvalide("legende");
      if (controle.type === "photo" && ajouts.onde !== null) throw refuserSocial("onde-invalide", ERREURS_MEDIAS_CHAT);
      const verdict = await d.messagerie.verifierEnvoiMedia(moi(reponse), id, idClient, corps.length, maintenant());
      if (verdict !== "ok") rendreRefus(reponse, verdict, ERREURS_MEDIAS_CHAT);
      const prepare = await preparerMediaChat(corps, controle);
      const media: MediaRecu = prepare.type === "photo"
        ? { ...prepare, idClient, album: ajouts.album, legende: ajouts.legende }
        : { ...prepare, idClient, onde: ajouts.onde };
      const r = await d.messagerie.envoyerMedia(moi(reponse), id, media, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur, ERREURS_MEDIAS_CHAT);
      await contexte.appliquer(r.effets);
      reponse.status(r.rejoue ? 200 : 201).json({ ok: true, message: r.message, version: r.version });
    },

    /** GET /app/conversations/:id/messages/:messageId/media : les octets, en clair, jamais en cache */
    async lireMedia(requete: Request, reponse: Response) {
      const r = await d.messagerie.lireMedia(moi(reponse), lireNumero(requete, "id"), lireNumero(requete, "messageId"), maintenant());
      if (r === null) rendreRefus(reponse, "message-inconnu", ERREURS_MEDIAS_CHAT);
      if (r === "expire") rendreRefus(reponse, "media-expire", ERREURS_MEDIAS_CHAT);
      reponse.set({
        "Content-Type": r.typeMime,
        "Content-Length": String(r.octets.length),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      });
      reponse.status(200).end(r.octets);
    },

    async changerPhoto(requete: Request, reponse: Response) {
      const id = lireNumero(requete, "id");
      const corps: unknown = requete.body;
      if (!Buffer.isBuffer(corps) || corps.length === 0) throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
      const typeAnnonce = lireTypeAnnonce(requete);
      if (typeAnnonce !== "image/jpeg") throw refuserSocial("format-refuse", ERREURS_MEDIAS_CHAT);
      const controle = controlerMediaChat(corps, typeAnnonce);
      const verdict = await d.messagerie.verifierPhotoGroupe(moi(reponse), id, corps.length, maintenant());
      if (verdict !== "ok") rendreRefus(reponse, verdict, ERREURS_MEDIAS_CHAT);
      const photo = await preparerMediaChat(corps, controle);
      const r = await d.messagerie.changerPhotoGroupe(moi(reponse), id, photo.octets, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur, ERREURS_MEDIAS_CHAT);
      reponse.json({ ok: true, conversation: r.conversation });
    },

    async retirerPhoto(requete: Request, reponse: Response) {
      const r = await d.messagerie.changerPhotoGroupe(moi(reponse), lireNumero(requete, "id"), null, maintenant());
      if (!r.ok) rendreRefus(reponse, r.erreur, ERREURS_MEDIAS_CHAT);
      reponse.json({ ok: true, conversation: r.conversation });
    },

    async lirePhoto(requete: Request, reponse: Response) {
      const r = await d.messagerie.lirePhotoGroupe(moi(reponse), lireNumero(requete, "id"));
      if (r === null) rendreRefus(reponse, "conversation-inconnue", ERREURS_MEDIAS_CHAT);
      if (r === "absente") rendreRefus(reponse, "photo-inconnue", ERREURS_MEDIAS_CHAT);
      reponse.set({
        "Content-Type": "image/jpeg",
        "Content-Length": String(r.octets.length),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      });
      reponse.status(200).end(r.octets);
    },
  };
}
