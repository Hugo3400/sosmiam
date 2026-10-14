import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { CHAMPS_DEFI, FILTRES_PAR_MESURE, LIMITES_DEFI, MESURES_DEFI, TYPES_LIEU_DEFI } from "~/contenus/defis.ts";
import { decrireRegleDefi } from "~/fonctions/defis/decrire-regle-defi.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { creerDefi, modifierDefi, type BrouillonDefi, type DefiGestion, type MesureDefi } from "~/services/defis.ts";

const aujourdhui = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const NOUVEAU = (): BrouillonDefi => ({
  emoji: "🎯", titre: "", texte: "", mesure: "visites", filtres: null, objectif: 3, points: 30, debut: aujourdhui(), fin: null, publie: false, ordre: 10,
});
const HEURES = Array.from({ length: 12 }, (_, i) => String(12 + i));

type Props = { defi: DefiGestion | null; onFermer: () => void; onEnregistre: () => void };

/**
 * Créer ou modifier un défi : ce qui compte (mesure et filtres permis), l'objectif, les points, les jours (heure de Paris,
 * dernier jour compris), brouillon ou publié. Une fois réussi par quelqu'un, la règle ne change plus (seuls titre, texte,
 * emoji, ordre, publication et dernier jour restent modifiables).
 */
export function ModaleDefi({ defi, onFermer, onEnregistre }: Props) {
  const [saisie, setSaisie] = useState<BrouillonDefi>(() => (defi ? { ...defi } : NOUVEAU()));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fige = (defi?.reussites ?? 0) > 0;
  const changer = (champs: Partial<BrouillonDefi>) => setSaisie((avant) => ({ ...avant, ...champs }));
  const filtres = saisie.filtres ?? {};
  const permis = FILTRES_PAR_MESURE[saisie.mesure];
  const changerFiltre = (champs: Partial<NonNullable<BrouillonDefi["filtres"]>>) => {
    const suivant = Object.fromEntries(Object.entries({ ...filtres, ...champs }).filter(([, valeur]) => valeur !== undefined && valeur !== false && !(Array.isArray(valeur) && valeur.length === 0)));
    changer({ filtres: Object.keys(suivant).length ? suivant : null });
  };

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      if (defi) {
        const { emoji, titre, texte, ordre, publie, fin, mesure, filtres: f, objectif, debut, points } = saisie;
        await modifierDefi(defi.id, fige ? { emoji, titre, texte, ordre, publie, fin, points } : { emoji, titre, texte, ordre, publie, fin, mesure, filtres: f, objectif, debut, points });
      } else {
        await creerDefi(saisie);
      }
      onEnregistre();
      onFermer();
    } catch (probleme) {
      const api = probleme instanceof ErreurApi ? probleme : null;
      const champ = api?.champ as keyof BrouillonDefi | null | undefined;
      setErreur(api?.code === "champ-invalide" ? `« ${champ ? CHAMPS_DEFI[champ] ?? champ : "un champ"} » ne va pas (limites, emoji d'alcool interdit, gros mot…).`
        : api?.code === "defi-deja-reussi" ? "Quelqu'un l'a déjà réussi : la règle (ce qui compte, filtres, objectif, premier jour) ne change plus."
        : expliquerErreur(api));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modale
      large
      titre={defi ? `Défi n° ${defi.id}` : "Nouveau défi"}
      ouverte
      onFermer={onFermer}
      actions={<><Bouton onClick={onFermer}>Annuler</Bouton><Bouton variante="principal" chargement={envoi} desactive={!saisie.titre.trim() || !saisie.texte.trim()} onClick={enregistrer}>Enregistrer</Bouton></>}
    >
      <div className="grid gap-4">
        {fige && <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm">Déjà réussi par {defi?.reussites} personne(s) : la règle est figée. Tu peux encore changer le titre, le texte, l'emoji, l'ordre, la publication, les points et le dernier jour.</p>}
        <div className="grid gap-4 sm:grid-cols-[90px_1fr]">
          <Champ libelle="Emoji" valeur={saisie.emoji} maxLength={16} onChange={(emoji) => changer({ emoji })} />
          <Champ libelle="Titre" valeur={saisie.titre} maxLength={LIMITES_DEFI.titre} onChange={(titre) => changer({ titre })} placeholder="Tournée des pâtisseries" />
        </div>
        <ZoneTexte libelle="Texte (vu dans l'app)" valeur={saisie.texte} maximum={LIMITES_DEFI.texte} lignes={2} onChange={(texte) => changer({ texte })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Selecteur libelle="Ce qui compte" valeur={saisie.mesure} options={Object.entries(MESURES_DEFI).map(([valeur, [, pluriel]]) => ({ valeur: valeur as MesureDefi, libelle: pluriel[0]!.toUpperCase() + pluriel.slice(1) }))}
            onChange={(mesure) => !fige && changer({ mesure, filtres: null })} />
          <Champ libelle="Objectif" type="number" min={1} max={100} disabled={fige} valeur={String(saisie.objectif)} onChange={(v) => changer({ objectif: Number(v) })} />
          <Champ libelle="Points gagnés" type="number" min={0} max={200} valeur={String(saisie.points)} onChange={(v) => changer({ points: Number(v) })} />
        </div>
        {permis.length > 0 && (
          <fieldset className="grid gap-2 rounded-xl border border-ligne p-3" disabled={fige}>
            <legend className="px-1 text-sm font-semibold">Filtres (facultatifs)</legend>
            {permis.includes("typesLieu") && (
              <div className="flex flex-wrap gap-4">
                {Object.entries(TYPES_LIEU_DEFI).map(([type, libelle]) => (
                  <CaseACocher key={type} libelle={libelle} coche={Boolean(filtres.typesLieu?.includes(type))}
                    onChange={(coche) => changerFiltre({ typesLieu: coche ? [...(filtres.typesLieu ?? []), type] : (filtres.typesLieu ?? []).filter((t) => t !== type) })} />
                ))}
                <span className="text-[13px] text-gris">Rien de coché : tous les lieux. Jamais les bars (loi Évin).</span>
              </div>
            )}
            {permis.includes("apresHeure") && (
              <Selecteur libelle="Visites après" valeur={filtres.apresHeure !== undefined ? String(filtres.apresHeure) : ""} className="w-48"
                options={[{ valeur: "", libelle: "N'importe quelle heure" }, ...HEURES.map((h) => ({ valeur: h, libelle: `${h} h (jusqu'à 5 h)` }))]}
                onChange={(h) => changerFiltre({ apresHeure: h ? Number(h) : undefined })} />
            )}
            {permis.includes("pendantSos") && <CaseACocher libelle="Seulement pendant un SOS du lieu" coche={Boolean(filtres.pendantSos)} onChange={(pendantSos) => changerFiltre({ pendantSos })} />}
            {permis.includes("avecPhoto") && <CaseACocher libelle="Seulement les avis avec photo" coche={Boolean(filtres.avecPhoto)} onChange={(avecPhoto) => changerFiltre({ avecPhoto })} />}
          </fieldset>
        )}
        <p className="text-sm">Règle : <strong>{decrireRegleDefi(saisie)}</strong></p>
        <div className="grid items-end gap-4 sm:grid-cols-4">
          <Champ libelle="Premier jour" type="date" disabled={fige} valeur={saisie.debut} onChange={(debut) => changer({ debut })} />
          <Champ libelle="Dernier jour (compris)" type="date" valeur={saisie.fin ?? ""} onChange={(fin) => changer({ fin: fin || null })} aide="Vide : sans fin." />
          <Champ libelle="Ordre" type="number" min={0} max={999} valeur={String(saisie.ordre)} onChange={(v) => changer({ ordre: Number(v) })} aide="Le plus petit d'abord." />
          <div className="pb-2"><CaseACocher libelle="Publié dans l'app" coche={saisie.publie} onChange={(publie) => changer({ publie })} /></div>
        </div>
        {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
      </div>
    </Modale>
  );
}
