import { LifeBuoy } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { creerBigSos } from "~/services/big-sos.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { listerLieux } from "~/services/lieux.ts";

/** Ouvrir un BIG SOS depuis le logiciel (un lieu t'a appelé, un ambassadeur t'en a parlé…) : le lieu et son histoire. */
export function ModaleNouveauBigSos({ onFermer, onCree }: { onFermer: () => void; onCree: (id: number) => void }) {
  const lieux = utiliserChargement(() => listerLieux(), []);
  const [lieuId, setLieuId] = useState("");
  const [histoire, setHistoire] = useState("");
  const [note, setNote] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  async function creer() {
    setEtat({ enCours: true, erreur: null });
    try {
      const { id } = await creerBigSos({ lieuId: Number(lieuId), histoire: histoire.trim(), note: note.trim() || null });
      onCree(id);
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  const options = [
    { valeur: "", libelle: lieux.donnees ? "Choisis le lieu" : "Chargement…" },
    ...(lieux.donnees ?? [])
      .map((lieu) => ({ valeur: String(lieu.id), libelle: `${lieu.emoji} ${lieu.nom} · ${lieu.ville}${lieu.statut === "publie" ? "" : " (pas en ligne)"}` }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
  ];

  return (
    <Modale
      large
      titre="Nouveau BIG SOS"
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={LifeBuoy} desactive={!lieuId || histoire.trim().length < 20} chargement={etat.enCours} onClick={creer}>Ouvrir le BIG SOS</Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        <Selecteur libelle="Lieu" valeur={lieuId} onChange={setLieuId} options={options} className="w-full" />
        <ZoneTexte
          libelle="Son histoire (affichée sur la page du BIG SOS)"
          valeur={histoire}
          onChange={setHistoire}
          maximum={3000}
          lignes={7}
          placeholder="Ce qui leur arrive, avec leurs mots : des travaux devant la porte depuis des mois, une inondation, une rue devenue déserte…"
          aide="Avec dignité, jamais de misérabilisme : on raconte des gens qui se battent, pas des victimes."
        />
        <ZoneTexte libelle="Note privée (jamais montrée)" valeur={note} onChange={setNote} maximum={2000} lignes={2} />
        <p className="text-sm text-gris">Il démarre « à étudier ». Ensuite : vérification sur place par un ambassadeur, vote de la communauté (avec l'app), ta validation, 7 jours à la une, puis le bilan.</p>
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Modale>
  );
}
