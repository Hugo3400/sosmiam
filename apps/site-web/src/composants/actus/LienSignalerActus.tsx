import type { ReactNode } from "react";
import { Link } from "react-router";

export function LienSignalerActus({ vers, children }: { vers: string; children: ReactNode }) {
  return (
    <Link
      to={vers}
      rel="nofollow"
      className="self-start text-sm text-gris underline underline-offset-2 hover:text-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
    >
      {children}
    </Link>
  );
}
