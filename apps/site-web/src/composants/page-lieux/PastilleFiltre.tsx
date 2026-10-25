import type { ReactNode } from "react";
import { Link } from "react-router";

type Props = {
  vers: string;
  actif: boolean;
  children: ReactNode;
  className?: string;
  surClic?: () => void;
};

export function PastilleFiltre({ vers, actif, children, className = "", surClic }: Props) {
  return (
    <Link
      to={vers}
      preventScrollReset
      aria-current={actif ? "true" : undefined}
      onClick={surClic}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-encre px-4 py-[7px] text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre ${actif ? "bg-encre text-jaune" : "bg-white text-encre hover:bg-jaune-clair"} ${className}`}
    >
      {children}
    </Link>
  );
}
