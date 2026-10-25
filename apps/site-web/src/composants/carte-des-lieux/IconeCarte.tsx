const TRACES = {
  plus: "M12 5v14M5 12h14",
  moins: "M5 12h14",
  agrandir: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  fermer: "M6 6l12 12M18 6L6 18",
  fleche: "M5 12h14M13 6l6 6-6 6",
} as const;

type Props = { nom: keyof typeof TRACES | "situer"; className?: string };

export function IconeCarte({ nom, className = "size-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {nom === "situer" ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      ) : (
        <path d={TRACES[nom]} />
      )}
    </svg>
  );
}
