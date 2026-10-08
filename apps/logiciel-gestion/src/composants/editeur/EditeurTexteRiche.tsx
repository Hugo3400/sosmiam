import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

import { BarreOutilsEditeur } from "./BarreOutilsEditeur.tsx";
import { ExtensionBouton } from "./extension-bouton.ts";
import { ModaleLienEditeur } from "./ModaleLienEditeur.tsx";

type Props = {
  libelle: string;
  /** Document de départ (JSON de l'éditeur), ou HTML (ancien brouillon converti) ; changer la clé du composant pour repartir */
  contenuInitial: JSONContent | string;
  onChange: (document: JSONContent) => void;
  /** Le document tel que l'éditeur l'a lu au départ (utile quand on lui a donné du HTML) */
  onPret?: (document: JSONContent) => void;
  placeholder?: string;
  avecTitres?: boolean;
  avecBouton?: boolean;
  /** Hauteur minimale de la zone de texte (classe Tailwind) */
  hauteur?: string;
};

type Fenetre = { mode: "lien" | "bouton"; texte: string; adresse: string; avecTexte: boolean; existant: boolean } | null;

/**
 * Éditeur visuel (TipTap) : ce qu'on voit est ce qui part. Titres, gras, italique, souligné, barré, listes, citation,
 * liens, bouton jaune et séparateur ; les raccourcis habituels marchent (Ctrl+B, Ctrl+I, Ctrl+Z…).
 */
export function EditeurTexteRiche({ libelle, contenuInitial, onChange, onPret, placeholder = "Écris ici…", avecTitres = true, avecBouton = true, hauteur = "min-h-[420px]" }: Props) {
  const [fenetre, setFenetre] = useState<Fenetre>(null);
  const editeur = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["mailto"] },
      }),
      Placeholder.configure({ placeholder }),
      ExtensionBouton,
    ],
    content: contenuInitial,
    editorProps: { attributes: { class: `contenu-editeur px-5 py-4 ${hauteur}`, "aria-label": libelle, role: "textbox", "aria-multiline": "true" } },
    onCreate: ({ editor }) => onPret?.(editor.getJSON()),
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  function ouvrirLien() {
    if (!editeur) return;
    const { from, to, empty } = editeur.state.selection;
    const adresse = (editeur.getAttributes("link").href as string | undefined) ?? "";
    if (adresse) editeur.chain().focus().extendMarkRange("link").run();
    setFenetre({ mode: "lien", texte: empty ? "" : editeur.state.doc.textBetween(from, to, " "), adresse, avecTexte: empty && !adresse, existant: !!adresse });
  }
  function ouvrirBouton() {
    if (!editeur) return;
    const actuel = editeur.isActive("bouton") ? editeur.getAttributes("bouton") : null;
    setFenetre({ mode: "bouton", texte: actuel?.texte ?? "", adresse: actuel?.adresse ?? "", avecTexte: true, existant: !!actuel });
  }
  function valider(texte: string, adresse: string) {
    if (!editeur || !fenetre) return;
    const chaine = editeur.chain().focus();
    if (fenetre.mode === "bouton") {
      if (fenetre.existant) chaine.updateAttributes("bouton", { texte, adresse }).run();
      else chaine.insererBouton({ texte, adresse }).run();
    } else if (fenetre.avecTexte) {
      chaine.insertContent({ type: "text", text: texte, marks: [{ type: "link", attrs: { href: adresse } }] }).insertContent(" ").run();
    } else {
      chaine.extendMarkRange("link").setLink({ href: adresse }).run();
    }
    setFenetre(null);
  }
  function retirer() {
    if (!editeur || !fenetre) return;
    if (fenetre.mode === "bouton") editeur.chain().focus().deleteSelection().run();
    else editeur.chain().focus().extendMarkRange("link").unsetLink().run();
    setFenetre(null);
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-ligne bg-white focus-within:border-encre"
      // Ctrl+K : ajouter un lien, comme dans les traitements de texte
      onKeyDown={(evenement) => {
        if ((evenement.ctrlKey || evenement.metaKey) && evenement.key.toLowerCase() === "k") {
          evenement.preventDefault();
          ouvrirLien();
        }
      }}
    >
      {editeur && <BarreOutilsEditeur editeur={editeur} avecTitres={avecTitres} avecBouton={avecBouton} onLien={ouvrirLien} onBouton={ouvrirBouton} />}
      <EditorContent editor={editeur} />
      {fenetre && (
        <ModaleLienEditeur
          mode={fenetre.mode}
          texteInitial={fenetre.texte}
          adresseInitiale={fenetre.adresse}
          avecTexte={fenetre.avecTexte}
          onValider={valider}
          onRetirer={fenetre.existant ? retirer : undefined}
          onFermer={() => setFenetre(null)}
        />
      )}
    </div>
  );
}
