import type { ReactNode } from "react";

type Onglet = "Pour toi" | "Explorer" | "Scan" | "Communauté" | "Profil";

// Pictos simplifiés des onglets de l'app, dessinés au trait
const ONGLETS: { nom: Onglet; picto: ReactNode }[] = [
  { nom: "Pour toi", picto: <path d="M12 20s-7-4.4-8.6-8.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.6 4.4C19 15.6 12 20 12 20z" /> },
  { nom: "Explorer", picto: <path d="M9 5 4 7v12l5-2 6 2 5-2V5l-5 2-6-2zm0 0v12m6-10v12" /> },
  { nom: "Scan", picto: <path d="M4 9V5h4m8 0h4v4m0 6v4h-4m-8 0H4v-4m5-6h6v6H9z" /> },
  {
    nom: "Communauté",
    picto: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5.5 8a5.5 5.5 0 0 1 11 0M16 11a2.5 2.5 0 1 0 0-5m1.5 13H21a4.5 4.5 0 0 0-3.5-4.4" />,
  },
  { nom: "Profil", picto: <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm-7 8a7 7 0 0 1 14 0" /> },
];

/** Barre d'onglets du bas de l'app dans un écran dessiné : « Potes » y devient « Communauté ». */
export function BarreOngletsApp({ actif }: { actif: Onglet }) {
  return (
    <div className="mt-auto grid shrink-0 grid-cols-5 border-t border-ligne bg-white px-1 pt-2 pb-4">
      {ONGLETS.map((onglet) => {
        const choisi = onglet.nom === actif;
        return (
          <span key={onglet.nom} className={`flex flex-col items-center gap-0.5 text-[9.5px] ${choisi ? "font-bold" : "text-gris"}`}>
            <span className={`grid h-6 w-10 place-items-center rounded-full ${choisi ? "bg-jaune" : ""}`}>
              <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {onglet.picto}
              </svg>
            </span>
            {onglet.nom}
          </span>
        );
      })}
    </div>
  );
}
