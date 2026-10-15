/** Les canaux de diffusion qu'un fichier de l'Espace presse peut servir (filtres du logiciel) */
export type CanalPresse =
  | "instagram" | "tiktok" | "facebook" | "x" | "ios" | "android" | "web" | "impression" | "marque" | "textes" | "sons" | "presentation";
export const CANAUX_PRESSE: readonly CanalPresse[] = [
  "instagram", "tiktok", "facebook", "x", "ios", "android", "web", "impression", "marque", "textes", "sons", "presentation",
];

const FAMILLES_IMPRESSION = new Set(["affiches", "imprimes", "flyer", "kit-media-pro"]);
const SONS = new Set(["MP3", "OGG", "WAV"]);

/**
 * Les canaux d'un fichier. Instagram, TikTok, iOS, Android, impression et textes : ceux de l'index s'il les donne (champ
 * `canaux`), sinon déduits ; Facebook, X, site web, logos et marque, sons et présentations : ceux de l'index s'il en donne,
 * plus ceux déduits du nom, de la description, des dimensions et du format. Carrousel ou post en 1080 × 1350 : Instagram ; story en 1080 × 1920
 * et vidéos : Instagram et TikTok ; App Store, iPhone, iPad : iOS ; Play Store : Android ; PDF et imprimés : impression.
 * Un visuel « à refaire avant de poster » (ancienne campagne, marqué ainsi dans la description par la session Miam Safe et
 * contenus) : AUCUN canal, rien n'est déduit, pour qu'aucun filtre ne le propose.
 */
export function deduireCanauxPresse(fichier: { nom: string; description: string; format: string; dimensions: string | null; canaux?: unknown }, familleId: string): CanalPresse[] {
  if (/à refaire avant de poster/i.test(fichier.description)) return [];
  const texte = `${fichier.nom} ${fichier.description}`.toLowerCase();
  const dimensions = (fichier.dimensions ?? "").replace(/\s/g, "");
  const canaux = new Set<CanalPresse>();
  const image = ["PNG", "JPG", "SVG", "WEBP"].includes(fichier.format);
  if (Array.isArray(fichier.canaux)) {
    for (const canal of fichier.canaux) if (CANAUX_PRESSE.includes(canal as CanalPresse)) canaux.add(canal as CanalPresse);
  } else {
    if (/\b(ios|iphone|ipad|app ?store|apple)\b/.test(texte)) canaux.add("ios");
    if (/\b(android|play ?store|google play)\b/.test(texte)) canaux.add("android");
    if (familleId === "stores" && /icone-app|icône de l.app/.test(texte)) (canaux.add("ios"), canaux.add("android"));
    if (/carrousel|post|1080×1350|1080×1080|badge|ecusson/.test(`${texte} ${dimensions}`) && !canaux.has("ios") && !canaux.has("android")) canaux.add("instagram");
    if (/story|stories|1080×1920/.test(`${texte} ${dimensions}`) || fichier.format === "MP4") (canaux.add("instagram"), canaux.add("tiktok"));
    if (fichier.format === "PDF" || FAMILLES_IMPRESSION.has(familleId) || /autocollant|sticker|memo|affiche|flyer/.test(texte)) canaux.add("impression");
    if (fichier.format === "MD" || fichier.format === "TXT") canaux.add("textes");
    if (image && /logo|mascotte|bouee/.test(texte)) (canaux.add("instagram"), canaux.add("tiktok"), canaux.add("impression"));
  }
  if (/facebook/.test(texte)) canaux.add("facebook");
  if (/1500x500|1500×500/.test(`${texte} ${dimensions}`)) canaux.add("x");
  if (/favicon/.test(texte)) canaux.add("web");
  if (image && (/logo|mascotte|bouee|palette|picto|epingle|ecusson|favicon/.test(texte) || familleId === "kit-de-marque")) canaux.add("marque");
  if (SONS.has(fichier.format)) canaux.add("sons");
  if (/apercu/.test(fichier.nom.toLowerCase())) canaux.add("presentation");
  return CANAUX_PRESSE.filter((canal) => canaux.has(canal));
}
