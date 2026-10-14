import { contientMotInterdit } from "./contient-mot-interdit.ts";

/**
 * Vérifie un texte de la partie sociale (message, petit mot, titre, description, commentaire), nettoyé avec trim :
 * « vide », « trop-long » (au-delà de max), « mot-interdit » (filtre de mots), sinon « ok ». La même règle sert dans l'app
 * (réponse tout de suite) et dans l'API (« mot-interdit » y devient 400 message-refuse).
 */
export function verifierTexteSocial(texte: string, max: number): "ok" | "vide" | "trop-long" | "mot-interdit" {
  const propre = texte.trim();
  if (propre === "") return "vide";
  if (propre.length > max) return "trop-long";
  if (contientMotInterdit(propre)) return "mot-interdit";
  return "ok";
}
