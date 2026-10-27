import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { EXEMPLES_RATTACHER_LIEU, TEXTES_RATTACHER_LIEU_PAR_LANGUE } from "~/contenus/rattacher-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * « Ce lieu est à moi » (action de routes/pro/rattacher.tsx) : je suis le gérant, comment le vérifier, et le SIRET si je
 * l'ai sous la main. Marche sans JavaScript (FormulaireCompte).
 */
export function FormulaireRattachement({ lieuId }: { lieuId: number }) {
  const T = utiliserTextes(TEXTES_RATTACHER_LIEU_PAR_LANGUE).formulaire;
  return (
    <FormulaireCompte nom="rattacher" bouton={T.bouton} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <input type="hidden" name="lieuId" value={lieuId} />
      <div className="grid gap-6">
        <CaseACocher nom="gerant">{T.gerant}</CaseACocher>
        <ChampTexte
          nom="preuve"
          libelle={T.preuve}
          aide={lierPonctuation(T.aidePreuve)}
          lignes={4}
          maximum={600}
        />
        <ChampTexte
          nom="siret"
          libelle={T.siret}
          facultatif
          aide={T.aideSiret}
          autoComplete="off"
          maximum={20}
          exemple={EXEMPLES_RATTACHER_LIEU.siret}
        />
      </div>
      <p className="mt-6 mb-2 text-sm text-gris">{lierPonctuation(T.gratuit)}</p>
    </FormulaireCompte>
  );
}
