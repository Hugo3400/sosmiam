/**
 * Le lien « Me désinscrire » personnel en bas d'une newsletter (texte et HTML) : avant </body> s'il y en a un, sinon à la
 * fin. Le contenu de la campagne est le même pour tous ; seul ce lien change d'une personne à l'autre.
 */
export function ajouterLienDesinscription(contenu: { html: string; texte: string }, lien: string): { html: string; texte: string } {
  const adresse = lien.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const bloc = `<p style="margin:24px 0 0;text-align:center;font-size:13px;color:#6B6B6B">Plus envie de recevoir la newsletter ? <a href="${adresse}" style="color:#6B6B6B">Me désinscrire</a> (en un clic, promis).</p>`;
  const html = /<\/body>/i.test(contenu.html) ? contenu.html.replace(/<\/body>/i, `${bloc}</body>`) : `${contenu.html}${bloc}`;
  return { html, texte: `${contenu.texte.trimEnd()}\n\nPlus envie de recevoir la newsletter ? Me désinscrire (en un clic) : ${lien}\n` };
}
