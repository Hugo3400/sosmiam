import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { isoVersSaisie } from "~/fonctions/dates/iso-vers-saisie.ts";
import { saisieVersIso } from "~/fonctions/dates/saisie-vers-iso.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { listerLieux } from "~/services/lieux.ts";
import { enregistrerPublication, lirePublication, supprimerPublication, type Media, type SaisiePublication } from "~/services/publications.ts";
import { ApercuPublication } from "./ApercuPublication.tsx";
import { GestionMedias } from "./GestionMedias.tsx";

const NOMS_CHAMPS: Record<string, string> = {
  lieuId: "le lieu", auteurPseudo: "le pseudo du créateur", partenariat: "la collaboration", legende: "la légende (500 caractères au plus)", publieeLe: "la date",
};

/** Une publication à créer ou modifier : lieu, auteur, légende, mentions obligatoires, date, médias et aperçu. */
export function FormulairePublication({ id: idDepart, onFermer }: { id: number | null; onFermer: () => void }) {
  const [id, setId] = useState(idDepart);
  const lieux = utiliserChargement(() => listerLieux(), []);
  const [saisie, setSaisie] = useState<SaisiePublication | null>(null);
  const [date, setDate] = useState("");
  const [medias, setMedias] = useState<Media[]>([]);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null; message: string | null }>({ enCours: false, erreur: null, message: null });
  const [suppression, setSuppression] = useState(false);
  const [suspendue, setSuspendue] = useState(false);

  useEffect(() => {
    if (!idDepart) return;
    lirePublication(idDepart).then(
      (publication) => {
        const { lieuId, auteurType, auteurPseudo, partenariat, legende, illustration, statut, publieeLe } = publication;
        setSaisie({ lieuId, auteurType, auteurPseudo, partenariat, legende, illustration, statut, publieeLe });
        setDate(isoVersSaisie(publieeLe));
        setMedias(publication.medias);
        setSuspendue(publication.suspendue);
      },
      (probleme: unknown) => setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), message: null }),
    );
  }, [idDepart]);
  useEffect(() => {
    if (!idDepart && !saisie && lieux.donnees) {
      setSaisie({ lieuId: lieux.donnees[0]?.id ?? 0, auteurType: "lieu", auteurPseudo: null, partenariat: null, legende: "", illustration: false, statut: "brouillon", publieeLe: null });
    }
  }, [idDepart, saisie, lieux.donnees]);

  if (!saisie) return etat.erreur ? <p className="font-semibold text-rouge-texte">{etat.erreur}</p> : <Chargement />;
  const changer = (modif: Partial<SaisiePublication>) => setSaisie({ ...saisie, ...modif });
  const lieu = lieux.donnees?.find((l) => l.id === saisie.lieuId) ?? null;

  async function enregistrer() {
    if (!saisie) return;
    setEtat({ enCours: true, erreur: null, message: null });
    try {
      const publication = await enregistrerPublication(id, { ...saisie, publieeLe: saisieVersIso(date) });
      setId(publication.id);
      setDate(isoVersSaisie(publication.publieeLe));
      setEtat({ enCours: false, erreur: null, message: id ? "Enregistrée ✅" : "Créée ✅ Tu peux maintenant ajouter la vidéo ou les photos." });
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ ? `Vérifie ${NOMS_CHAMPS[erreur.champ] ?? erreur.champ}.` : expliquerErreur(erreur), message: null });
    }
  }

  if (lieux.donnees && lieux.donnees.length === 0) {
    return <p className="rounded-carte bg-white p-6">Il faut d'abord créer un lieu (écran « Lieux ») : chaque publication montre un lieu. <Bouton className="ml-3" onClick={onFermer}>Retour</Bouton></p>;
  }
  return (
    <>
      <EnTeteEcran
        titre={id ? `Publication n° ${id}` : "Nouvelle publication"}
        sousTitre={suspendue ? "⚠️ Suspendue pour tout le monde par un signalement grave : décide dans « Modération »." : undefined}
        actions={
          <>
            <Bouton icone={ArrowLeft} onClick={onFermer}>Retour</Bouton>
            {id && <Bouton variante="danger" icone={Trash2} onClick={() => setSuppression(true)}>Supprimer</Bouton>}
            <Bouton variante="principal" icone={Save} chargement={etat.enCours} onClick={enregistrer}>Enregistrer</Bouton>
          </>
        }
      />
      {(etat.erreur || etat.message) && (
        <p role="status" className={`mb-4 rounded-xl px-4 py-2 text-sm font-semibold ${etat.erreur ? "bg-rose-alerte text-rouge-texte" : "bg-vert-clair text-vert"}`}>{etat.erreur ?? etat.message}</p>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-5">
          <Carte titre="Qui et quoi">
            <div className="grid gap-4 md:grid-cols-2">
              <Selecteur
                libelle="Lieu"
                valeur={String(saisie.lieuId)}
                onChange={(valeur) => changer({ lieuId: Number(valeur) })}
                options={(lieux.donnees ?? []).map((l) => ({ valeur: String(l.id), libelle: `${l.emoji} ${l.nom} (${l.ville})` }))}
              />
              <div className="grid gap-1.5">
                <span className="text-sm font-semibold">Publiée par</span>
                <Onglets
                  libelle="Publiée par"
                  valeur={saisie.auteurType}
                  onChange={(auteurType) => changer({ auteurType, ...(auteurType === "lieu" ? { auteurPseudo: null, partenariat: null } : {}) })}
                  options={[{ valeur: "lieu", libelle: "Le lieu" }, { valeur: "createur", libelle: "Un créateur" }]}
                />
              </div>
              {saisie.auteurType === "createur" && (
                <>
                  <Champ libelle="Pseudo du créateur" valeur={saisie.auteurPseudo ?? ""} maxLength={40} placeholder="@pseudo" onChange={(v) => changer({ auteurPseudo: v || null })} />
                  <Champ
                    libelle="Collaboration commerciale"
                    valeur={saisie.partenariat ?? ""}
                    maxLength={120}
                    placeholder="Repas offert, rémunération…"
                    onChange={(v) => changer({ partenariat: v || null })}
                    aide="Si le lieu a offert ou payé quoi que ce soit, dis quoi : l'app affichera « Collaboration commerciale » (obligatoire)."
                  />
                </>
              )}
              <ZoneTexte libelle="Légende" valeur={saisie.legende} maximum={500} lignes={4} onChange={(legende) => changer({ legende })} className="md:col-span-2" />
              <div className="md:col-span-2">
                <CaseACocher
                  libelle="Média d'illustration"
                  coche={saisie.illustration}
                  onChange={(illustration) => changer({ illustration })}
                  aide="Vidéo ou photos qui illustrent le lieu sans y avoir été tournées : l'app l'indique, pour ne tromper personne."
                />
              </div>
            </div>
          </Carte>
          <Carte titre="Quand">
            <div className="grid gap-4 md:grid-cols-2">
              <Selecteur
                libelle="Statut"
                valeur={saisie.statut}
                onChange={(statut) => changer({ statut })}
                options={[{ valeur: "brouillon", libelle: "Brouillon (invisible)" }, { valeur: "publiee", libelle: "Publiée" }, { valeur: "masquee", libelle: "Masquée" }]}
              />
              <Champ
                libelle="Date de publication"
                type="datetime-local"
                valeur={date}
                onChange={setDate}
                aide="Vide = tout de suite. Une date à venir la programme : elle apparaîtra toute seule à ce moment-là."
              />
            </div>
          </Carte>
          <Carte titre="Vidéo ou photos">
            {id ? <GestionMedias idPublication={id} medias={medias} onChange={setMedias} /> : <p className="text-sm text-gris">Enregistre d'abord la publication, puis ajoute sa vidéo ou ses photos ici.</p>}
          </Carte>
        </div>
        <div className="sticky top-4 grid gap-2">
          <p className="text-sm font-semibold text-gris">Aperçu dans le fil</p>
          <ApercuPublication publication={saisie} lieu={lieu} medias={medias} />
        </div>
      </div>
      <Modale
        titre="Supprimer cette publication ?"
        ouverte={suppression}
        onFermer={() => setSuppression(false)}
        actions={
          <>
            <Bouton onClick={() => setSuppression(false)}>Annuler</Bouton>
            <Bouton variante="danger" icone={Trash2} onClick={() => id && supprimerPublication(id).then(onFermer, () => setSuppression(false))}>Supprimer pour de bon</Bouton>
          </>
        }
      >
        <p>La publication et ses fichiers disparaissent. Pour la retirer sans rien perdre, passe-la plutôt en « Masquée ».</p>
      </Modale>
    </>
  );
}
