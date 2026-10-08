// Le « bouton » de l'éditeur visuel : un appel à l'action (texte + adresse), rendu dans les mails comme un gros bouton
// jaune. Un bloc à part entière, qu'on insère, déplace ou supprime d'un coup.
import { Node } from "@tiptap/react";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    bouton: { insererBouton: (attributs: { texte: string; adresse: string }) => ReturnType };
  }
}

export const ExtensionBouton = Node.create({
  name: "bouton",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { texte: { default: "" }, adresse: { default: "" } };
  },
  parseHTML() {
    const lire = (lien: Element | null) => ({ texte: lien?.textContent ?? "", adresse: lien?.getAttribute("href") ?? "" });
    // Le paragraphe qui l'enveloppe passe avant celui des paragraphes ordinaires (priorité 50)
    return [
      { tag: "p.bouton-editeur", priority: 60, getAttrs: (element) => lire(element.querySelector("a")) },
      { tag: "a[data-bouton]", getAttrs: (element) => lire(element) },
    ];
  },
  renderHTML({ node }) {
    return ["p", { class: "bouton-editeur" }, ["a", { "data-bouton": "", href: node.attrs.adresse, title: node.attrs.adresse }, node.attrs.texte]];
  },
  addCommands() {
    return {
      insererBouton: (attributs) => ({ commands }) => commands.insertContent({ type: this.name, attrs: attributs }),
    };
  },
});
