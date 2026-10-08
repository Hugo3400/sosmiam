const echapper = (texte: string) =>
  texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gras, italique et liens dans une ligne déjà échappée. Liens acceptés : https:// et mailto: seulement. */
function enrichirLigne(ligne: string, styleLien: string): string {
  return ligne
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_(.+?)_(?=[\s).,!?;:]|$)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(((?:https:\/\/|mailto:)[^\s)]+)\)/g, `<a href="$2" style="${styleLien}">$1</a>`);
}

export type StylesMarkdown = { titre1: string; titre2: string; paragraphe: string; liste: string; lien: string };

/**
 * Markdown simple de la newsletter → HTML d'e-mail (styles en ligne, seuls lus par les messageries).
 * Reconnaît : « # titre », « ## sous-titre », listes « - », **gras**, _italique_, [lien](https://…), paragraphes.
 * Tout le reste est affiché tel quel : le texte est échappé avant d'être enrichi.
 */
export function convertirMarkdown(texte: string, styles: StylesMarkdown): string {
  const blocs: string[] = [];
  let liste: string[] = [];
  let paragraphe: string[] = [];
  const fermer = () => {
    if (paragraphe.length) blocs.push(`<p style="${styles.paragraphe}">${paragraphe.join("<br>")}</p>`);
    if (liste.length) blocs.push(`<ul style="${styles.liste}">${liste.map((element) => `<li>${element}</li>`).join("")}</ul>`);
    paragraphe = [];
    liste = [];
  };
  for (const brute of texte.replace(/\r\n?/g, "\n").split("\n")) {
    const ligne = enrichirLigne(echapper(brute.trim()), styles.lien);
    if (!ligne) {
      fermer();
    } else if (/^##\s/.test(brute.trim())) {
      fermer();
      blocs.push(`<h2 style="${styles.titre2}">${ligne.replace(/^##\s+/, "")}</h2>`);
    } else if (/^#\s/.test(brute.trim())) {
      fermer();
      blocs.push(`<h1 style="${styles.titre1}">${ligne.replace(/^#\s+/, "")}</h1>`);
    } else if (/^[-*]\s/.test(brute.trim())) {
      if (paragraphe.length) fermer();
      liste.push(ligne.replace(/^[-*]\s+/, ""));
    } else {
      if (liste.length) fermer();
      paragraphe.push(ligne);
    }
  }
  fermer();
  return blocs.join("\n");
}
