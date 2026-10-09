import { Bouton } from "~/composants/interface/Bouton";
import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** « Ce lieu est à toi ? » au bas d'une fiche publique : vers la demande de rattachement de l'espace pro. */
export function EncartCeLieuEstAToi({ lieuId, verifie }: { lieuId: number; verifie: boolean }) {
  return (
    <aside aria-labelledby="ce-lieu-est-a-toi" className="rounded-carte border-2 border-encre bg-encre p-6 text-creme shadow-brut-jaune md:p-8">
      <h2 id="ce-lieu-est-a-toi" className="text-2xl font-extrabold text-jaune">{lierPonctuation("Ce lieu est à toi ?")}</h2>
      <p className="mt-2 max-w-xl text-creme/85">
        {lierPonctuation(verifie
          ? "Tu en es le gérant ? Rejoins l'espace pro pour tenir la fiche avec ton équipe. C'est gratuit."
          : "Réclame sa fiche dans l'espace pro : tu mets à jour tes horaires et tes infos, et ton lieu gagne le badge Vérifié ✓. C'est gratuit, sans abonnement ni commission.")}
      </p>
      <Bouton href={`https://${HOTE_PRO}/rattacher/${lieuId}`} className="mt-5">{verifie ? "Rejoindre l'espace pro" : "Réclamer ma fiche"}</Bouton>
    </aside>
  );
}
