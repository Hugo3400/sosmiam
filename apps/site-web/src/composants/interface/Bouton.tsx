import { Link } from "react-router";
import type { ReactNode } from "react";

type Variante = "jaune" | "blanc" | "encre";

type Props = {
  children: ReactNode;
  variante?: Variante;
  petit?: boolean;
  /** Lien vers une page du site (navigation sans rechargement) */
  vers?: string;
  /** Lien externe, ancre (#section) ou mailto */
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

const couleurs: Record<Variante, string> = {
  jaune: "bg-jaune text-encre shadow-brut hover:shadow-brut-grand",
  blanc: "bg-white text-encre shadow-brut hover:shadow-brut-grand",
  encre: "bg-encre text-jaune shadow-[4px_4px_0_#fff] hover:shadow-[6px_6px_0_#fff]",
};

/** Le bouton SOS Miam : bord noir, ombre décalée. Devient un lien si `vers` ou `href` est donné. */
export function Bouton({ children, variante = "jaune", petit, vers, href, type = "button", onClick, className = "" }: Props) {
  const classes = [
    "inline-flex items-center justify-center rounded-full border-2 border-encre font-semibold",
    "transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5",
    "active:translate-x-0.5 active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre",
    petit ? "px-[18px] py-2 text-[.9rem]" : "px-[26px] py-3.5",
    couleurs[variante],
    className,
  ].join(" ");

  if (vers) return <Link to={vers} onClick={onClick} className={classes}>{children}</Link>;
  if (href) return <a href={href} onClick={onClick} className={classes}>{children}</a>;
  return <button type={type} onClick={onClick} className={classes}>{children}</button>;
}
