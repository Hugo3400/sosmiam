import { formaterDate } from "~/fonctions/texte/formater-date.ts";

/** « e-mail vérifié ✓ » quand la personne a cliqué le lien reçu à l'inscription, sinon « e-mail pas vérifié ». */
export function PastilleEmailVerifie({ le }: { le: string | null | undefined }) {
  return le ? (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-vert" title={`Adresse confirmée le ${formaterDate(le, true)}`}>
      e-mail vérifié ✓
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[13px] text-gris" title="La personne n'a pas encore cliqué le lien reçu par mail">
      e-mail pas vérifié
    </span>
  );
}
