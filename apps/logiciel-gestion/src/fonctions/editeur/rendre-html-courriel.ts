import type { JSONContent } from "@tiptap/react";

import { STYLES_COURRIEL } from "../../contenus/styles-courriel.ts";

const echapper = (texte: string) => texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Liens acceptés dans un mail : https://, http:// et mailto: seulement (jamais javascript: ni data:) */
export const adresseSure = (adresse: unknown): string | null =>
  typeof adresse === "string" && /^(https?:\/\/|mailto:)[^\s"<>]+$/i.test(adresse.trim()) ? adresse.trim() : null;

function rendreTexte(noeud: JSONContent): string {
  let html = echapper(noeud.text ?? "");
  for (const marque of noeud.marks ?? []) {
    if (marque.type === "bold") html = `<strong>${html}</strong>`;
    else if (marque.type === "italic") html = `<em>${html}</em>`;
    else if (marque.type === "underline") html = `<u>${html}</u>`;
    else if (marque.type === "strike") html = `<s>${html}</s>`;
    else if (marque.type === "link") {
      const adresse = adresseSure(marque.attrs?.href);
      if (adresse) html = `<a href="${echapper(adresse)}" style="${STYLES_COURRIEL.lien}">${html}</a>`;
    }
  }
  return html;
}

const enLigne = (noeud: JSONContent): string =>
  (noeud.content ?? []).map((enfant) => (enfant.type === "text" ? rendreTexte(enfant) : enfant.type === "hardBreak" ? "<br>" : enLigne(enfant))).join("");

function rendreNoeud(noeud: JSONContent): string {
  const enfants = () => (noeud.content ?? []).map(rendreNoeud).join("");
  switch (noeud.type) {
    case "doc": {
      // Les paragraphes vides de la fin (l'éditeur en garde un après un bouton) ne laissent pas de trou avant le pied
      const blocs = [...(noeud.content ?? [])];
      while (blocs.length && blocs.at(-1)?.type === "paragraph" && !enLigne(blocs.at(-1)!).trim()) blocs.pop();
      return blocs.map(rendreNoeud).join("\n");
    }
    case "paragraph":
      return `<p style="${STYLES_COURRIEL.paragraphe}">${enLigne(noeud) || "&nbsp;"}</p>`;
    case "heading": {
      const niveau = Math.min(3, Math.max(1, Number(noeud.attrs?.level) || 2));
      return `<h${niveau} style="${STYLES_COURRIEL[`titre${niveau}` as "titre1"]}">${enLigne(noeud)}</h${niveau}>`;
    }
    case "bulletList":
      return `<ul style="${STYLES_COURRIEL.liste}">${enfants()}</ul>`;
    case "orderedList":
      return `<ol style="${STYLES_COURRIEL.liste}">${enfants()}</ol>`;
    case "listItem":
      // Le texte d'un élément de liste, sans la marge de ses paragraphes ; une sous-liste reste une liste
      return `<li>${(noeud.content ?? []).map((enfant) => (enfant.type === "paragraph" ? enLigne(enfant) : rendreNoeud(enfant))).join("<br>")}</li>`;
    case "blockquote":
      return `<blockquote style="${STYLES_COURRIEL.citation}">${(noeud.content ?? []).map((enfant) => enLigne(enfant)).join("<br>")}</blockquote>`;
    case "horizontalRule":
      return `<hr style="${STYLES_COURRIEL.separateur}">`;
    case "bouton": {
      const adresse = adresseSure(noeud.attrs?.adresse);
      const texte = echapper(String(noeud.attrs?.texte ?? ""));
      return adresse && texte ? `<p style="margin:8px 0 20px"><a href="${echapper(adresse)}" style="${STYLES_COURRIEL.bouton}">${texte}</a></p>` : "";
    }
    default:
      // Nœud inconnu : son texte seulement, jamais de HTML venu d'ailleurs
      return noeud.content ? `<p style="${STYLES_COURRIEL.paragraphe}">${enLigne(noeud)}</p>` : "";
  }
}

/** Document de l'éditeur visuel → HTML d'e-mail, styles en ligne. Tout le texte est échappé ; liens https/mailto seulement. */
export function rendreHtmlCourriel(document: JSONContent): string {
  return rendreNoeud(document);
}
