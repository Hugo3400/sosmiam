import type { JSONContent } from "@tiptap/react";

import { POLICE_COURRIEL as POLICE } from "../../contenus/styles-courriel.ts";
import { rendreHtmlCourriel } from "../editeur/rendre-html-courriel.ts";

/** Pied de page d'une newsletter : la désinscription (obligatoire, et promise dans la politique de confidentialité : un
 * simple « STOP » suffit). Pour un mail aux ambassadeurs, voir PIED_AMBASSADEURS. */
export const PIED_NEWSLETTER = `Tu reçois ce mail parce que tu t'es inscrit à la newsletter de SOS Miam. Plus envie ? Réponds simplement « STOP » à ce mail, ou écris à <a href="mailto:bonjour@sosmiam.fr" style="color:#5C5A55">bonjour@sosmiam.fr</a> : on te retire de la liste, sans question.`;
export const PIED_AMBASSADEURS = `Tu reçois ce mail parce que tu es ambassadeur SOS Miam. Une question ? Réponds simplement à ce mail, on lit tout.`;

/** E-mail complet aux couleurs de SOS Miam : bandeau jaune, texte, pied de page (HTML écrit ici, jamais saisi). */
export function creerHtmlNewsletter(objet: string, document: JSONContent, pied = PIED_NEWSLETTER): string {
  const titre = objet.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head>
<body style="margin:0;padding:0;background:#FFF8E7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:2px solid #1A1A1A;border-radius:20px">
<tr><td style="background:#FFD60A;border-radius:18px 18px 0 0;padding:20px 28px;${POLICE};font-size:22px;font-weight:800;color:#1A1A1A">🛟 SOS Miam</td></tr>
<tr><td style="padding:28px">
${rendreHtmlCourriel(document)}
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #EDE6D3;${POLICE};font-size:13px;line-height:1.5;color:#5C5A55">
${pied}
</td></tr>
</table></td></tr></table>
</body></html>`;
}
