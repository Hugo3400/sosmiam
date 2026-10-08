import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = { titre: string; ouverte: boolean; onFermer: () => void; children: ReactNode; actions?: ReactNode; large?: boolean };

/** Fenêtre par-dessus l'écran (élément <dialog> : Échap la ferme, le focus y reste). */
export function Modale({ titre, ouverte, onFermer, children, actions, large }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const idTitre = useId();
  useEffect(() => {
    const element = dialogue.current;
    if (!element) return;
    if (ouverte && !element.open) element.showModal();
    if (!ouverte && element.open) element.close();
  }, [ouverte]);

  return (
    <dialog
      ref={dialogue}
      aria-labelledby={idTitre}
      onClose={onFermer}
      onCancel={(evenement) => {
        evenement.preventDefault();
        onFermer();
      }}
      className={`m-auto w-[min(100%-32px,var(--largeur))] rounded-carte border-2 border-encre bg-white p-0 text-encre shadow-brut backdrop:bg-encre/40 ${large ? "[--largeur:880px]" : "[--largeur:520px]"}`}
    >
      {ouverte && (
        <div className="grid max-h-[85vh] grid-rows-[auto_1fr_auto]">
          <header className="flex items-center justify-between gap-3 border-b border-ligne px-5 py-3">
            <h2 id={idTitre} className="text-lg font-extrabold">{titre}</h2>
            <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-full p-1.5 text-gris hover:bg-creme hover:text-encre">
              <X className="size-5" aria-hidden />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {actions && <footer className="flex flex-wrap justify-end gap-2 border-t border-ligne px-5 py-3">{actions}</footer>}
        </div>
      )}
    </dialog>
  );
}
