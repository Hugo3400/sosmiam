import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";

type Props = { visible: boolean; message: string; surClic: () => void };

export function BoutonChercherZone({ visible, message, surClic }: Props) {
  return (
    <>
      {visible && (
        <button
          type="button"
          onClick={surClic}
          className="pointer-events-auto rounded-full border-2 border-encre bg-jaune px-[18px] py-2.5 text-sm font-bold shadow-brut-petit hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          {TEXTES_CARTE_DES_LIEUX.boutons.chercherZone}
        </button>
      )}
      <p role="status" className={message ? "pointer-events-auto max-w-sm rounded-xl border-2 border-encre bg-white px-3 py-2 text-center text-sm font-semibold shadow-brut-petit" : "sr-only"}>
        {message}
      </p>
    </>
  );
}
