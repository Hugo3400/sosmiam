import type { ReactNode } from "react";

type Props = {
  /** Le logo ou l'emoji de la ligne (décoratif) */
  icone: ReactNode;
  nom: string;
  /** Activé ou relié : la coche verte ; sinon, l'état en gris */
  actif: boolean;
  etat: string;
  /** À droite de la ligne : « Relier », « Délier »… */
  action?: ReactNode;
  /** Sous la ligne, sur toute la largeur : un formulaire, une explication */
  children?: ReactNode;
};

/** Une façon de se connecter dans « Mon compte » : e-mail et mot de passe, Google ou Apple, avec son état et ses actions. */
export function LigneConnexion({ icone, nom, actif, etat, action, children }: Props) {
  return (
    <li className="rounded-2xl border-2 border-encre bg-creme/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-encre bg-white text-xl">{icone}</span>
          <div className="min-w-0">
            <p className="font-bold">{nom}</p>
            <p className={actif ? "font-semibold text-encre" : "text-gris"}>
              {actif && <span aria-hidden="true">✓ </span>}{etat}
            </p>
          </div>
        </div>
        {action}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </li>
  );
}
