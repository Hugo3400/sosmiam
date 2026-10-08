// Styles des mails (en ligne : les messageries ignorent les feuilles de style), aux couleurs de SOS Miam.
const POLICE = "font-family:Inter,Arial,Helvetica,sans-serif";
const TEXTE = `${POLICE};font-size:16px;line-height:1.6;color:#1A1A1A`;

export const STYLES_COURRIEL = {
  titre1: `${POLICE};font-size:28px;line-height:1.15;font-weight:800;color:#1A1A1A;margin:0 0 16px`,
  titre2: `${POLICE};font-size:20px;line-height:1.2;font-weight:800;color:#1A1A1A;margin:28px 0 10px`,
  titre3: `${POLICE};font-size:17px;line-height:1.3;font-weight:800;color:#1A1A1A;margin:20px 0 8px`,
  paragraphe: `${TEXTE};margin:0 0 16px`,
  liste: `${TEXTE};margin:0 0 16px;padding-left:22px`,
  citation: `${TEXTE};margin:0 0 16px;padding:4px 0 4px 16px;border-left:4px solid #FFD60A;color:#5C5A55`,
  separateur: "border:none;border-top:2px solid #EDE6D3;margin:24px 0",
  lien: "color:#1A1A1A;text-decoration:underline;text-decoration-color:#FFD60A;text-decoration-thickness:3px",
  bouton: `${POLICE};display:inline-block;background:#FFD60A;color:#1A1A1A;font-weight:800;font-size:16px;text-decoration:none;padding:12px 22px;border:2px solid #1A1A1A;border-radius:999px`,
};
export const POLICE_COURRIEL = POLICE;
