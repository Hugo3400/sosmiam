/** Lien « Aller au contenu », visible seulement au clavier : évite de traverser le menu à chaque page. */
export function LienEvitement() {
  return (
    <a
      href="#contenu"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:border-2
        focus:border-encre focus:bg-jaune focus:px-5 focus:py-2 focus:font-semibold"
    >
      Aller au contenu
    </a>
  );
}
