/** Texte sûr à placer dans du HTML (les mails de SOS Miam ne mettent jamais de HTML venu d'ailleurs tel quel). */
export function echapperHtml(texte: string): string {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
