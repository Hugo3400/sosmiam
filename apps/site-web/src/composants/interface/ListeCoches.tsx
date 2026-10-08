import type { ReactNode } from "react";

type Element = { fort: string; suite: ReactNode };

/** Liste à puces cochées : « ✓ Fort : suite du texte ». */
export function ListeCoches({ elements, sombre = false }: { elements: Element[]; sombre?: boolean }) {
  return (
    <ul className="grid gap-3.5">
      {elements.map(({ fort, suite }) => (
        <li key={fort} className="relative pl-9">
          <span
            aria-hidden="true"
            className={`absolute top-0.5 left-0 grid h-6 w-6 place-items-center rounded-full text-sm font-extrabold ${sombre ? "bg-encre text-jaune" : "bg-jaune text-encre"}`}
          >
            ✓
          </span>
          <strong>{fort}</strong>{` ${suite}`}
        </li>
      ))}
    </ul>
  );
}
