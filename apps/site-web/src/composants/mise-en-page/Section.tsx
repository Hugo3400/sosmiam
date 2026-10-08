import type { ReactNode } from "react";

type Fond = "blanc" | "creme" | "jaune" | "encre";

const fonds: Record<Fond, string> = {
  blanc: "bg-white",
  creme: "bg-creme",
  jaune: "bg-jaune",
  encre: "bg-encre text-creme",
};

type Props = {
  children: ReactNode;
  id?: string;
  fond?: Fond;
  etroit?: boolean;
  className?: string;
};

/** Une bande de page : fond, marges verticales et largeur de contenu communes à tout le site. */
export function Section({ children, id, fond = "blanc", etroit = false, className = "" }: Props) {
  return (
    <section id={id} className={`py-16 md:py-24 ${fonds[fond]} ${className}`}>
      <div className={`mx-auto ${etroit ? "w-[min(760px,100%-32px)]" : "w-[min(1120px,100%-32px)]"}`}>{children}</div>
    </section>
  );
}
