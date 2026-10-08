import { echapperHtml } from "./echapper-html.ts";

const POLICE = "font-family:Inter,Arial,Helvetica,sans-serif";

export type ContenuCourriel = {
  titre: string;
  /** Paragraphes en texte simple (échappés ici) */
  paragraphes: string[];
  bouton?: { texte: string; adresse: string };
  /** Petite ligne du bas : pourquoi la personne reçoit ce mail */
  pied: string;
};

/**
 * Un mail de SOS Miam (compte, ambassadeur…) aux couleurs de la newsletter : bandeau jaune, texte, bouton, pied de page.
 * Rend aussi la version texte, pour les messageries qui n'affichent pas le HTML.
 */
export function habillerCourriel({ titre, paragraphes, bouton, pied }: ContenuCourriel): { html: string; texte: string } {
  const corps = paragraphes
    .map((p) => `<p style="${POLICE};font-size:16px;line-height:1.6;color:#1A1A1A;margin:0 0 16px">${echapperHtml(p)}</p>`)
    .join("\n");
  const lienBouton = bouton
    ? `<p style="margin:8px 0 20px"><a href="${echapperHtml(bouton.adresse)}" style="${POLICE};display:inline-block;background:#FFD60A;color:#1A1A1A;font-weight:800;font-size:16px;text-decoration:none;padding:12px 22px;border:2px solid #1A1A1A;border-radius:999px">${echapperHtml(bouton.texte)}</a></p>`
    : "";
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapperHtml(titre)}</title></head>
<body style="margin:0;padding:0;background:#FFF8E7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:2px solid #1A1A1A;border-radius:20px">
<tr><td style="background:#FFD60A;border-radius:18px 18px 0 0;padding:20px 28px;${POLICE};font-size:22px;font-weight:800;color:#1A1A1A">🛟 SOS Miam</td></tr>
<tr><td style="padding:28px">
<h1 style="${POLICE};font-size:26px;line-height:1.15;font-weight:800;color:#1A1A1A;margin:0 0 16px">${echapperHtml(titre)}</h1>
${corps}
${lienBouton}
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #EDE6D3;${POLICE};font-size:13px;line-height:1.5;color:#5C5A55">${echapperHtml(pied)}</td></tr>
</table></td></tr></table>
</body></html>`;
  const texte = [titre, "", ...paragraphes.flatMap((p) => [p, ""]), ...(bouton ? [`${bouton.texte} : ${bouton.adresse}`, ""] : []), "—", pied].join("\n");
  return { html, texte };
}
