import type { JSONContent } from "@tiptap/react";

import { adresseSure } from "./rendre-html-courriel.ts";

/** Le texte tapé ne doit jamais devenir de la mise en forme Discord par accident (une étoile, un tiret bas…) */
const echapper = (texte: string) => texte.replace(/([\\*_~`|[\]])/g, "\\$1");

function enLigne(noeud: JSONContent): string {
  return (noeud.content ?? [])
    .map((enfant) => {
      if (enfant.type === "hardBreak") return "\n";
      if (enfant.type !== "text") return enLigne(enfant);
      let texte = echapper(enfant.text ?? "");
      if (!texte.trim()) return texte;
      for (const marque of enfant.marks ?? []) {
        if (marque.type === "bold") texte = `**${texte}**`;
        else if (marque.type === "italic") texte = `*${texte}*`;
        else if (marque.type === "underline") texte = `__${texte}__`;
        else if (marque.type === "strike") texte = `~~${texte}~~`;
        else if (marque.type === "link") {
          const adresse = adresseSure(marque.attrs?.href);
          // Discord n'ouvre pas les liens mailto : on écrit l'adresse en clair
          if (adresse?.startsWith("mailto:")) texte = `${texte} (${adresse.slice(7)})`;
          else if (adresse) texte = `[${texte}](${adresse})`;
        }
      }
      return texte;
    })
    .join("");
}

function rendreBloc(noeud: JSONContent, retrait = ""): string[] {
  switch (noeud.type) {
    case "heading":
      return [`${"#".repeat(Math.min(3, Math.max(1, Number(noeud.attrs?.level) || 2)))} ${enLigne(noeud)}`];
    case "paragraph":
      // Un « # » ou un « - » tapé en début de ligne reste du texte
      return [enLigne(noeud).replace(/^([#>-]|\d+\.)/, "\\$1")];
    case "bulletList":
    case "orderedList":
      return (noeud.content ?? []).flatMap((element, i) => {
        const puce = noeud.type === "orderedList" ? `${i + 1}. ` : "- ";
        const [premiere = "", ...suite] = (element.content ?? []).flatMap((enfant) => rendreBloc(enfant, `${retrait}  `));
        return [`${retrait}${puce}${premiere.replace(/^\\/, "")}`, ...suite.filter(Boolean)];
      });
    case "blockquote":
      return (noeud.content ?? []).map((enfant) => `> ${enLigne(enfant)}`);
    case "horizontalRule":
      return ["———"];
    case "bouton": {
      const adresse = adresseSure(noeud.attrs?.adresse);
      const texte = echapper(String(noeud.attrs?.texte ?? ""));
      return adresse && texte ? [`👉 **[${texte}](${adresse})**`] : [];
    }
    default:
      return noeud.content ? [enLigne(noeud)] : [];
  }
}

/** Document de l'éditeur visuel → mise en forme Discord (titres #, **gras**, *italique*, __souligné__, listes, liens…). */
export function rendreMarkdownDiscord(document: JSONContent): string {
  return (document.content ?? []).map((bloc) => rendreBloc(bloc).join("\n")).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
