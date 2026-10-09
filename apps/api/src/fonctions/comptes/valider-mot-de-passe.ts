// Règles figées le 8 octobre 2026 (docs/decisions.md), complétées après la relecture : 12 à 128 caractères, aucune règle
// de composition (une petite phrase marche très bien), mais 16 chiffres au moins s'il n'y a que des chiffres ; pas un mot
// de passe courant (même entouré de chiffres ou de signes), ni une suite, ni un petit motif répété, ni l'e-mail ou ce qui
// précède son « @ ». Ça suffit (cas 2 de la délibération CNIL 2022-100) parce que l'API impose en plus une attente par
// compte après plusieurs échecs (controleurs/comptes-attente.ts). La liste des mots de passe courants (plus de 10 000,
// en français et en anglais, décidée le 9 octobre 2026) est dans src/donnees/mots-de-passe-courants.txt.
import { chargerMotsDePasseCourants } from "./charger-mots-de-passe-courants.ts";

/** Suites des chiffres, de l'alphabet et des claviers, dans les deux sens, assez longues pour 128 caractères */
const SUITES = [
  "0123456789", "abcdefghijklmnopqrstuvwxyz", "azertyuiopqsdfghjklmwxcvbn", "qwertyuiopasdfghjklzxcvbnm",
  "1q2w3e4r5t6y7u8i9o0p", "q1w2e3r4t5y6u7i8o9p0", "a1z2e3r4t5y6u7i8o9p0", "1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p",
].flatMap((suite) => [suite, [...suite].reverse().join("")].map((sens) => sens.repeat(Math.ceil(140 / sens.length))));

/** Mot de passe courant, ce qui précède le « @ » de l'e-mail, petit motif répété (« aaaa… », « 1212… ») ou suite */
function estEvident(texte: string, avantArobase: string): boolean {
  if (texte.length < 6) return false;
  return chargerMotsDePasseCourants().has(texte) || texte === avantArobase
    || [1, 2, 3, 4].some((n) => texte.length >= 3 * n && texte.slice(n) === texte.slice(0, -n))
    || SUITES.some((suite) => suite.includes(texte));
}

/**
 * Vrai si le mot de passe peut être choisi : 12 à 128 caractères une fois normalisé (NFC, un emoji compte pour un),
 * pas fait que d'espaces, 16 chiffres au moins s'il n'a que des chiffres (CNIL, cas 2, exemple 3), différent de l'e-mail,
 * et rien d'évident (sans tenir compte des majuscules ni des espaces, puis sans les signes, puis sans les chiffres du
 * début et de la fin) : ni un mot de passe courant, ni une suite, ni un petit motif répété, ni ce qui précède le « @ ».
 */
export function validerMotDePasse(motDePasse: string, email: string): boolean {
  const normalise = motDePasse.normalize("NFC");
  const longueur = [...normalise].length;
  if (longueur < 12 || longueur > 128) return false;
  const minuscules = normalise.toLowerCase();
  const sansEspaces = minuscules.replace(/\s+/g, "");
  const adresse = email.trim().toLowerCase();
  if (sansEspaces === "" || minuscules.trim() === adresse) return false;
  const sansSignes = sansEspaces.replace(/[\p{P}\p{S}]+/gu, "");
  // Que des chiffres (espaces et signes n'y changent presque rien : « 06 12 34… », « 08/10/2026… ») : 16 au moins
  if (/^\p{Nd}{1,15}$/u.test(sansSignes)) return false;
  const coeur = sansSignes.replace(/^\p{N}+|\p{N}+$/gu, "");
  const avantArobase = adresse.split("@")[0].replace(/[\p{P}\p{S}]+/gu, "");
  return ![sansEspaces, sansSignes, coeur].some((texte) => estEvident(texte, avantArobase));
}
