import type { JSONContent } from "@tiptap/react";

const enLigne = (noeud: JSONContent): string =>
  (noeud.content ?? [])
    .map((enfant) => {
      if (enfant.type === "hardBreak") return "\n";
      if (enfant.type !== "text") return enLigne(enfant);
      const lien = enfant.marks?.find((marque) => marque.type === "link")?.attrs?.href;
      return lien && lien !== enfant.text ? `${enfant.text} (${lien})` : (enfant.text ?? "");
    })
    .join("");

function rendreBloc(noeud: JSONContent, prefixe = ""): string[] {
  switch (noeud.type) {
    case "heading":
    case "paragraph":
      return [enLigne(noeud)];
    case "bulletList":
    case "orderedList":
      return (noeud.content ?? []).flatMap((element, i) => {
        const puce = noeud.type === "orderedList" ? `${i + 1}. ` : "- ";
        const [premiere = "", ...suite] = (element.content ?? []).flatMap((enfant) => rendreBloc(enfant, `${prefixe}  `));
        return [`${prefixe}${puce}${premiere}`, ...suite.filter(Boolean)];
      });
    case "blockquote":
      return (noeud.content ?? []).map((enfant) => `> ${enLigne(enfant)}`);
    case "horizontalRule":
      return ["———"];
    case "bouton":
      return [`${noeud.attrs?.texte ?? ""} : ${noeud.attrs?.adresse ?? ""}`];
    default:
      return noeud.content ? [enLigne(noeud)] : [];
  }
}

/** Document de l'éditeur visuel → texte brut lisible (version texte des mails) : un bloc par paragraphe. */
export function rendreTexteBrut(document: JSONContent): string {
  return (document.content ?? []).map((bloc) => rendreBloc(bloc).join("\n")).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
