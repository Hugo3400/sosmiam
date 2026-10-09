import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { lireDernierTestSauvegarde, testerSauvegarde } from "~/services/sauvegardes.ts";

/**
 * La preuve qu'on pourra restaurer : la dernière sauvegarde est déchiffrée (si elle était abîmée, ça se verrait) et relue
 * en entier, table par table. Fait chaque nuit après la sauvegarde, et à la demande. Rien n'est restauré.
 */
export function CarteTestSauvegarde() {
  const { donnees: test, recharger } = utiliserChargement(lireDernierTestSauvegarde, []);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const [details, setDetails] = useState(false);

  async function tester() {
    setEtat({ enCours: true, erreur: null });
    try {
      await testerSauvegarde();
      setEtat({ enCours: false, erreur: null });
      recharger();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  const lignes = test?.tables.reduce((total, table) => total + table.lignes, 0) ?? 0;
  return (
    <Carte titre="Test des sauvegardes" actions={<Bouton petit icone={ShieldCheck} chargement={etat.enCours} onClick={tester}>Tester la dernière</Bouton>}>
      <div className="grid gap-2 text-sm">
        {!test && <p className="text-gris">Pas encore testée : le premier test se fera cette nuit, après la sauvegarde, ou maintenant avec le bouton.</p>}
        {test && (
          <p className={`rounded-xl px-3 py-2 font-semibold ${test.ok ? "bg-vert-clair text-vert" : "bg-rose-alerte text-rouge-texte"}`}>
            {test.ok
              ? `✅ Relue en entier ${formaterDateRelative(test.testeLe)} : ${test.tables.length} tables, ${formaterNombre(lignes)} lignes, en ${formaterNombre(test.dureeMs)} ms.`
              : `❌ Test raté ${formaterDateRelative(test.testeLe)} : ${test.erreur ?? "erreur inconnue"}. Préviens vite, et fais une sauvegarde à la main.`}
          </p>
        )}
        {test && <p className="text-gris">Sauvegarde testée : {test.nom}</p>}
        {test && test.tables.length > 0 && (
          <>
            <button type="button" className="w-fit text-[13px] font-semibold underline" onClick={() => setDetails(!details)}>{details ? "Masquer" : "Voir"} le détail par table</button>
            {details && (
              <div className="max-h-72 overflow-y-auto rounded-xl border border-ligne">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-white text-left text-gris"><tr><th className="px-3 py-1.5">Table</th><th className="chiffres px-3 py-1.5 text-right">Dans la sauvegarde</th><th className="chiffres px-3 py-1.5 text-right">Aujourd'hui</th></tr></thead>
                  <tbody>
                    {test.tables.map((table) => (
                      <tr key={table.table} className="border-t border-ligne/70">
                        <td className="px-3 py-1 font-mono">{table.table}</td>
                        <td className="chiffres px-3 py-1 text-right">{formaterNombre(table.lignes)}</td>
                        <td className="chiffres px-3 py-1 text-right text-gris">{table.aujourdhui === null ? "—" : formaterNombre(table.aujourdhui)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {etat.erreur && <p role="alert" className="font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Carte>
  );
}
