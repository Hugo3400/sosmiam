import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold, Heading1, Heading2, Italic, Link, List, ListOrdered, Minus, MousePointerClick, Quote, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2,
  type LucideIcon,
} from "lucide-react";

type Props = { editeur: Editor; avecTitres: boolean; avecBouton: boolean; onLien: () => void; onBouton: () => void };

function Outil({ icone: Icone, titre, actif = false, desactive = false, onClick }: { icone: LucideIcon; titre: string; actif?: boolean; desactive?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={titre}
      aria-label={titre}
      aria-pressed={actif}
      disabled={desactive}
      // Garder la sélection du texte : le bouton ne prend pas le focus au clic
      onMouseDown={(evenement) => evenement.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-35 ${actif ? "bg-encre text-jaune" : "text-encre hover:bg-jaune-clair"}`}
    >
      <Icone className="size-4" aria-hidden />
    </button>
  );
}

const Separateur = () => <span className="mx-1 h-5 w-px bg-ligne" aria-hidden />;

/** La barre d'outils de l'éditeur visuel : titres, gras, italique, listes, citation, lien, bouton, séparateur, annuler. */
export function BarreOutilsEditeur({ editeur, avecTitres, avecBouton, onLien, onBouton }: Props) {
  const etat = useEditorState({
    editor: editeur,
    selector: ({ editor: e }) => ({
      titre1: e.isActive("heading", { level: 1 }),
      titre2: e.isActive("heading", { level: 2 }),
      gras: e.isActive("bold"),
      italique: e.isActive("italic"),
      souligne: e.isActive("underline"),
      barre: e.isActive("strike"),
      liste: e.isActive("bulletList"),
      listeNumerotee: e.isActive("orderedList"),
      citation: e.isActive("blockquote"),
      lien: e.isActive("link"),
      bouton: e.isActive("bouton"),
      annuler: e.can().undo(),
      retablir: e.can().redo(),
    }),
  });
  const chaine = () => editeur.chain().focus();

  return (
    <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap items-center gap-0.5 border-b border-ligne bg-creme/60 px-2 py-1.5">
      <Outil icone={Undo2} titre="Annuler (Ctrl+Z)" desactive={!etat.annuler} onClick={() => chaine().undo().run()} />
      <Outil icone={Redo2} titre="Rétablir (Ctrl+Y)" desactive={!etat.retablir} onClick={() => chaine().redo().run()} />
      <Separateur />
      {avecTitres && (
        <>
          <Outil icone={Heading1} titre="Grand titre" actif={etat.titre1} onClick={() => chaine().toggleHeading({ level: 1 }).run()} />
          <Outil icone={Heading2} titre="Sous-titre" actif={etat.titre2} onClick={() => chaine().toggleHeading({ level: 2 }).run()} />
          <Separateur />
        </>
      )}
      <Outil icone={Bold} titre="Gras (Ctrl+B)" actif={etat.gras} onClick={() => chaine().toggleBold().run()} />
      <Outil icone={Italic} titre="Italique (Ctrl+I)" actif={etat.italique} onClick={() => chaine().toggleItalic().run()} />
      <Outil icone={Underline} titre="Souligné (Ctrl+U)" actif={etat.souligne} onClick={() => chaine().toggleUnderline().run()} />
      <Outil icone={Strikethrough} titre="Barré" actif={etat.barre} onClick={() => chaine().toggleStrike().run()} />
      <Separateur />
      <Outil icone={List} titre="Liste à puces" actif={etat.liste} onClick={() => chaine().toggleBulletList().run()} />
      <Outil icone={ListOrdered} titre="Liste numérotée" actif={etat.listeNumerotee} onClick={() => chaine().toggleOrderedList().run()} />
      <Outil icone={Quote} titre="Citation" actif={etat.citation} onClick={() => chaine().toggleBlockquote().run()} />
      <Separateur />
      <Outil icone={Link} titre="Lien (Ctrl+K)" actif={etat.lien} onClick={onLien} />
      {avecBouton && <Outil icone={MousePointerClick} titre="Bouton (appel à l'action)" actif={etat.bouton} onClick={onBouton} />}
      <Outil icone={Minus} titre="Séparateur" onClick={() => chaine().setHorizontalRule().run()} />
      <Separateur />
      <Outil icone={RemoveFormatting} titre="Effacer la mise en forme" onClick={() => chaine().unsetAllMarks().clearNodes().run()} />
    </div>
  );
}
