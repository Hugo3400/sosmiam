type Onglet = "Pour toi" | "Explorer" | "Scan" | "Communauté" | "Profil";

const ONGLETS: { nom: Onglet; icone: string }[] = [
  { nom: "Pour toi", icone: "♡" },
  { nom: "Explorer", icone: "⌖" },
  { nom: "Scan", icone: "▣" },
  { nom: "Communauté", icone: "☺" },
  { nom: "Profil", icone: "◯" },
];

/** Barre d'onglets du bas de l'app dans un écran dessiné : « Potes » y devient « Communauté ». */
export function BarreOngletsApp({ actif }: { actif: Onglet }) {
  return (
    <div className="mt-auto grid shrink-0 grid-cols-5 border-t border-ligne bg-white px-1 pt-2 pb-4">
      {ONGLETS.map((onglet) => {
        const choisi = onglet.nom === actif;
        return (
          <span key={onglet.nom} className={`flex flex-col items-center gap-0.5 text-[9.5px] ${choisi ? "font-bold" : "text-gris"}`}>
            <span className={`grid h-6 w-10 place-items-center rounded-full text-[13px] ${choisi ? "bg-jaune" : ""}`}>{onglet.icone}</span>
            {onglet.nom}
          </span>
        );
      })}
    </div>
  );
}
