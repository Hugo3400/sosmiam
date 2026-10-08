import type { ReactNode } from "react";

type Props = { titre?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; sansMarge?: boolean };

/** Un panneau blanc à bord fin, avec un titre et des actions facultatifs. */
export function Carte({ titre, actions, children, className = "", sansMarge }: Props) {
  return (
    <section className={`rounded-carte border border-ligne bg-white ${className}`}>
      {(titre || actions) && (
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-ligne px-5 py-2.5">
          {titre && <h2 className="text-base font-extrabold">{titre}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={sansMarge ? "" : "p-5"}>{children}</div>
    </section>
  );
}
