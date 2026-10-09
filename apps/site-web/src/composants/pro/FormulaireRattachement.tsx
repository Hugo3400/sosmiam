import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * « Ce lieu est à moi » (action de routes/pro/rattacher.tsx) : je suis le gérant, comment le vérifier, et le SIRET si je
 * l'ai sous la main. Marche sans JavaScript (FormulaireCompte).
 */
export function FormulaireRattachement({ lieuId }: { lieuId: number }) {
  return (
    <FormulaireCompte nom="rattacher" bouton="Envoyer ma demande" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <input type="hidden" name="lieuId" value={lieuId} />
      <div className="grid gap-6">
        <CaseACocher nom="gerant">Je suis le gérant (ou la gérante) de ce lieu</CaseACocher>
        <ChampTexte
          nom="preuve"
          libelle="Comment peut-on vérifier que c'est toi ?"
          aide={lierPonctuation("Par exemple : le numéro du lieu où te rappeler, une adresse e-mail au nom du lieu, ton nom sur l'extrait Kbis… L'équipe s'en sert seulement pour vérifier.")}
          lignes={4}
          maximum={600}
        />
        <ChampTexte
          nom="siret"
          libelle="Le SIRET du lieu"
          facultatif
          aide="14 chiffres, sur tes factures ou ton extrait Kbis. Ça va plus vite avec, mais ça marche sans."
          autoComplete="off"
          maximum={20}
          exemple="123 456 789 00012"
        />
      </div>
      <p className="mt-6 mb-2 text-sm text-gris">{lierPonctuation("C'est gratuit, sans abonnement ni commission. L'équipe SOS Miam lit chaque demande à la main.")}</p>
    </FormulaireCompte>
  );
}
