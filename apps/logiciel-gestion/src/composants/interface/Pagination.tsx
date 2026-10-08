import { ChevronLeft, ChevronRight } from "lucide-react";

import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { Bouton } from "./Bouton.tsx";

/** « 1–50 sur 312 », avec page précédente et suivante. */
export function Pagination({ page, parPage, total, onChange }: { page: number; parPage: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / parPage));
  if (total <= parPage) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-end gap-2 text-sm text-gris">
      <span className="chiffres">
        {formaterNombre((page - 1) * parPage + 1)}–{formaterNombre(Math.min(page * parPage, total))} sur {formaterNombre(total)}
      </span>
      <Bouton petit icone={ChevronLeft} titre="Page précédente" desactive={page <= 1} onClick={() => onChange(page - 1)} />
      <Bouton petit icone={ChevronRight} titre="Page suivante" desactive={page >= pages} onClick={() => onChange(page + 1)} />
    </nav>
  );
}
