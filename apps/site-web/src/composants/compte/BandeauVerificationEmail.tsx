import { useEffect, useState } from "react";
import { Form, useActionData } from "react-router";

import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Juste après l'inscription : le lien vient de partir */
  justeInscrit?: boolean;
  /** Nom du formulaire « Renvoyer le lien » (services/verification-email.server.ts) */
  formulaire: string;
  /** Un autre texte que « Confirme ton adresse e-mail… » (page /verifier-email, lien qui ne marche plus) */
  texte?: string;
  bouton?: string;
};

/**
 * Bandeau discret de l'espace tant que l'e-mail n'est pas confirmé, avec « Renvoyer le lien » (formulaire POST : marche
 * sans JavaScript). La réponse (envoyé, attente à respecter) s'affiche dessous, lue par les lecteurs d'écran.
 */
export function BandeauVerificationEmail({ justeInscrit = false, formulaire, texte: autreTexte, bouton = "Renvoyer le lien" }: Props) {
  const donnees = useActionData<ReponseFormulaire>();
  const reponse = donnees?.formulaire === formulaire ? donnees : undefined;
  const [enAttente, setEnAttente] = useState(false);
  // Chaque réponse (même identique à la précédente) arrête « Envoi… »
  useEffect(() => setEnAttente(false), [donnees]);
  const texte = autreTexte ?? (justeInscrit
    ? "On t'a envoyé un lien pour confirmer ton e-mail (il marche 7 jours). Pense à regarder tes indésirables !"
    : "Confirme ton adresse e-mail : on t'a envoyé un lien.");
  return (
    <div className="mb-8 rounded-2xl border-2 border-dashed border-encre/40 bg-white/70 px-4 py-3">
      <Form method="post" onSubmit={() => setEnAttente(true)} className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <input type="hidden" name="formulaire" value={formulaire} />
        <p className="min-w-0 flex-[1_1_16rem]">
          <span aria-hidden="true">✉️ </span>
          {lierPonctuation(texte)}
        </p>
        <button
          type="submit"
          className="rounded-full border-2 border-encre bg-white px-4 py-1.5 text-sm font-semibold transition-[translate,box-shadow] duration-150
            hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-petit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
        >
          {enAttente ? "Envoi…" : bouton}
        </button>
      </Form>
      <p role="status" className={`text-sm font-semibold ${reponse?.ok ? "text-encre" : "text-rouge-texte"} ${reponse?.message ? "mt-2" : ""}`}>
        {!enAttente && reponse?.message}
      </p>
    </div>
  );
}
