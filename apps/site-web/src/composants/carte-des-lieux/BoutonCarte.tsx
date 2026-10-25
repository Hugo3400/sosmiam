import type { ReactNode } from "react";
import { Link } from "react-router";

type Props = {
  etiquette: string;
  children: ReactNode;
  surClic?: () => void;
  vers?: string;
  jaune?: boolean;
  grand?: boolean;
};

export function BoutonCarte({ etiquette, children, surClic, vers, jaune = false, grand = false }: Props) {
  const classes = [
    "grid shrink-0 place-items-center border-2 border-encre text-encre transition-colors",
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre",
    grand ? "size-12 rounded-[14px]" : "size-11 rounded-xl",
    jaune ? "bg-jaune hover:bg-[#F0C800]" : "bg-white hover:bg-jaune-clair",
  ].join(" ");
  if (vers) {
    return (
      <Link to={vers} aria-label={etiquette} title={etiquette} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={etiquette} title={etiquette} onClick={surClic} className={classes}>
      {children}
    </button>
  );
}
