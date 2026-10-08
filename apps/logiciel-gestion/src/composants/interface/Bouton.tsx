import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Variante = "principal" | "secondaire" | "danger" | "discret";

type Props = {
  children?: ReactNode;
  variante?: Variante;
  icone?: LucideIcon;
  /** Affiche un rond qui tourne et empêche un second clic */
  chargement?: boolean;
  desactive?: boolean;
  petit?: boolean;
  type?: "button" | "submit";
  titre?: string;
  onClick?: () => void;
  className?: string;
};

const STYLES: Record<Variante, string> = {
  principal: "border-nuit bg-jaune text-nuit shadow-brut-petit hover:bg-[#ffdf3d] active:translate-x-px active:translate-y-px active:shadow-none",
  secondaire: "border-encre bg-white text-encre hover:bg-creme",
  danger: "border-rouge-texte bg-white text-rouge-texte hover:bg-rose-alerte",
  discret: "border-transparent bg-transparent text-gris hover:bg-ligne/60 hover:text-encre",
};

/** Le bouton du logiciel : jaune pour l'action principale, blanc, rouge pour ce qui efface, ou discret. */
export function Bouton({ children, variante = "secondaire", icone: Icone, chargement, desactive, petit, type = "button", titre, onClick, className = "" }: Props) {
  return (
    <button
      type={type}
      title={titre}
      aria-label={!children ? titre : undefined}
      disabled={desactive || chargement}
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 font-semibold transition-[background-color,transform,box-shadow] duration-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Bouton à icône seule : carré, sans marge intérieure (sinon l'icône est écrasée)
        children ? (petit ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm") : petit ? "size-8" : "size-10",
        STYLES[variante],
        className,
      ].join(" ")}
    >
      {chargement ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icone ? <Icone className="size-4" aria-hidden /> : null}
      {children}
    </button>
  );
}
