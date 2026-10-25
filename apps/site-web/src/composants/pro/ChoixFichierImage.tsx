import type { ReactNode } from "react";

import { TYPES_IMAGE_SOURCE } from "~/fonctions/pro/reconnaitre-format-image";

type Props = {
  children: ReactNode;
  variante?: "jaune" | "blanc";
  description?: string;
  onFichier: (fichier: File) => void;
};

const classes = [
  "relative inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-encre px-[18px] py-2 text-[.9rem] font-semibold text-encre shadow-brut",
  "transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand active:translate-x-0.5 active:translate-y-0.5",
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-encre",
].join(" ");

export function ChoixFichierImage({ children, variante = "jaune", description, onFichier }: Props) {
  return (
    <label className={`${classes} ${variante === "jaune" ? "bg-jaune" : "bg-white"}`}>
      {children}
      <input
        type="file"
        accept={TYPES_IMAGE_SOURCE.join(",")}
        aria-describedby={description}
        className="sr-only"
        onChange={(evenement) => {
          const fichier = evenement.currentTarget.files?.[0];
          evenement.currentTarget.value = "";
          if (fichier) onFichier(fichier);
        }}
      />
    </label>
  );
}
