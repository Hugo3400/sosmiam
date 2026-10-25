import type { Ref } from "react";

import { TEXTES_IMAGES_LIEU } from "~/contenus/pro-images-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export type EtatMessageImageLieu = { ok: boolean; titre?: string; texte: string; connexion: boolean };

type Props = { ref: Ref<HTMLDivElement>; id: string; message: EtatMessageImageLieu | null; lieuId: number };

export function MessageImageLieu({ ref, id, message, lieuId }: Props) {
  return (
    <div ref={ref} id={id} tabIndex={-1} className="mt-4 focus:outline-none">
      {message && (
        <div
          role={message.ok ? "status" : "alert"}
          className={`rounded-2xl border-2 px-4 py-3 ${message.ok ? "border-encre bg-jaune-clair" : "border-rouge-texte bg-rose-alerte"}`}
        >
          {message.titre && <p className="font-bold">{lierPonctuation(message.titre)}</p>}
          <p className={message.ok ? "font-semibold" : ""}>
            {message.ok && <span aria-hidden="true">✓ </span>}
            {lierPonctuation(message.texte)}
          </p>
          {message.connexion && (
            <a
              href={`/connexion?retour=${encodeURIComponent(`/lieu/${lieuId}/images`)}`}
              className="mt-2 inline-block font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre"
            >
              {TEXTES_IMAGES_LIEU.erreurs.lienConnexion}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
