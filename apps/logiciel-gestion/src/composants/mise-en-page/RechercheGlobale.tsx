import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Ecran } from "~/contenus/menu.ts";
import { listerResultatsRecherche } from "~/fonctions/recherche/lister-resultats-recherche.ts";
import { rechercherPartout, type ResultatsRecherche } from "~/services/recherche.ts";

type Props = { ouverte: boolean; onFermer: () => void; onAller: (ecran: Ecran, id: number | null) => void };

/** Ctrl+K : chercher un lieu, un compte, une publication, un BIG SOS ou un écran, et l'ouvrir au clavier (↑ ↓ Entrée). */
export function RechercheGlobale({ ouverte, onFermer, onAller }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<ResultatsRecherche | null>(null);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const element = dialogue.current;
    if (!element) return;
    if (ouverte && !element.open) {
      setQ("");
      setResultats(null);
      element.showModal();
    }
    if (!ouverte && element.open) element.close();
  }, [ouverte]);

  // On cherche quand la frappe s'arrête ; une réponse dépassée est ignorée
  useEffect(() => {
    if (q.trim().length < 2) return setResultats(null);
    let annule = false;
    const minuteur = setTimeout(() => rechercherPartout(q).then((r) => !annule && setResultats(r), () => {}), 200);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [q]);

  const liste = listerResultatsRecherche(q, resultats);
  useEffect(() => setActif(0), [q, resultats]);
  const aller = (index: number) => {
    const choix = liste[index];
    if (!choix) return;
    onAller(choix.ecran, choix.id);
    onFermer();
  };

  return (
    <dialog
      ref={dialogue}
      aria-label="Rechercher partout"
      onClose={onFermer}
      onCancel={(e) => { e.preventDefault(); onFermer(); }}
      className="mx-auto mt-[12vh] w-[min(100%-32px,640px)] rounded-carte border-2 border-encre bg-white p-0 text-encre shadow-brut backdrop:bg-encre/40"
    >
      {ouverte && (
        <div className="grid">
          <label className="flex items-center gap-3 border-b border-ligne px-4">
            <Search className="size-5 text-gris" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActif((i) => Math.min(i + 1, liste.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActif((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter") { e.preventDefault(); aller(actif); }
              }}
              placeholder="Un lieu, un prénom, une adresse, un numéro, un écran…"
              aria-label="Rechercher"
              role="combobox"
              aria-expanded={liste.length > 0}
              aria-controls="resultats-recherche"
              aria-activedescendant={liste[actif] ? `resultat-${liste[actif]!.cle}` : undefined}
              className="h-14 flex-1 bg-transparent text-base outline-none"
            />
            <kbd className="rounded border border-ligne px-1.5 text-xs text-gris">Échap</kbd>
          </label>
          <ul id="resultats-recherche" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
            {liste.map((resultat, i) => (
              <li
                key={resultat.cle}
                id={`resultat-${resultat.cle}`}
                role="option"
                aria-selected={i === actif}
                onMouseEnter={() => setActif(i)}
                onClick={() => aller(i)}
                className={`grid cursor-pointer gap-0.5 rounded-xl px-3 py-2 ${i === actif ? "bg-jaune-clair" : ""}`}
              >
                {(i === 0 || liste[i - 1]!.groupe !== resultat.groupe) && <span className="text-[11px] font-bold tracking-wider text-gris uppercase">{resultat.groupe}</span>}
                <span className="truncate text-sm font-semibold">{resultat.titre}</span>
                <span className="truncate text-[13px] text-gris">{resultat.detail}</span>
              </li>
            ))}
            {q.trim().length >= 2 && resultats && liste.length === 0 && <li className="px-3 py-4 text-sm text-gris">Rien trouvé pour « {q} ».</li>}
            {q.trim().length < 2 && <li className="px-3 py-4 text-sm text-gris">Tape au moins 2 lettres : nom d'un lieu, prénom, adresse e-mail, ville, numéro (« n° 12 »)…</li>}
          </ul>
        </div>
      )}
    </dialog>
  );
}
