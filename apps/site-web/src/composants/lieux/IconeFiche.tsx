export type NomIcone =
  | "itineraire" | "appeler" | "reserver" | "site" | "instagram" | "partager" | "agrandir" | "imprimer" | "fermer" | "chercher"
  | "telephone" | "epingle" | "terrasse" | "wifi" | "accessible" | "enfants" | "parking" | "animaux" | "paiement" | "non";

const TRACES: Record<NomIcone, string> = {
  itineraire: "M3 11l18-8-8 18-2-8z",
  appeler: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  reserver: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18",
  site: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  instagram: "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zM12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM17.5 6.5h.01",
  partager: "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13",
  agrandir: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  imprimer: "M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z",
  fermer: "M6 6l12 12M18 6L6 18",
  chercher: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.5-3.5",
  telephone: "M9 2h6a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM11 18h2",
  epingle: "M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  terrasse: "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v9M8 21h8",
  wifi: "M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01",
  accessible: "M12.5 5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3zM12 8v6h5l2 5M12 10.5h5M9 10.5a6 6 0 1 0 7.5 8",
  enfants: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0",
  parking: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 17V7h4a3 3 0 0 1 0 6H9",
  animaux:
    "M5.5 11a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3zM9.5 7a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3zM14.5 7a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3zM18.5 11a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3zM12 11c-3 0-6 4.5-6 7a2.5 2.5 0 0 0 3 2.5c1-.3 2-.5 3-.5s2 .2 3 .5a2.5 2.5 0 0 0 3-2.5c0-2.5-3-7-6-7z",
  paiement: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2 10h20M6 15h4",
  non: "M6 6l12 12M18 6L6 18",
};

export function IconeFiche({ nom, className = "h-[18px] w-[18px]" }: { nom: NomIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <path d={TRACES[nom]} />
    </svg>
  );
}
