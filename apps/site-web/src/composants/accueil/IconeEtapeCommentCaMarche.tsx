import type { IconeEtape } from "~/contenus/comment-ca-marche";

const TRACES: Record<Exclude<IconeEtape, "sos">, string[]> = {
  chercher: ["M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14", "m20 20-3.5-3.5"],
  addition: ["M6 3h12v18l-3-2-3 2-3-2-3 2z", "m9 11 2 2 4-4"],
  bouee: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18", "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8", "m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"],
};

export function IconeEtapeCommentCaMarche({ icone }: { icone: IconeEtape }) {
  if (icone === "sos") return <img src="/images/marque/epingle-resto-sos.svg" alt="" width={76} height={76} className="h-10 w-10" />;
  return (
    <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {TRACES[icone].map((trace) => (
        <path key={trace} d={trace} />
      ))}
    </svg>
  );
}
