import { ArrowLeft, ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { POINTS_FICHE } from "~/contenus/champs-lieu.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { enregistrerLieu, lireLieu, supprimerLieu, type EnvieLieu, type SaisieLieu } from "~/services/lieux.ts";
import type { Ecran } from "~/contenus/menu.ts";
import { ApercuLieu } from "./ApercuLieu.tsx";
import { ComptesProDuLieu } from "./ComptesProDuLieu.tsx";
import { HistoriqueLieu } from "./HistoriqueLieu.tsx";
import { SuggestionsDuLieu } from "./SuggestionsDuLieu.tsx";
import { EditeurCreneaux } from "./EditeurCreneaux.tsx";
import { InfosPratiquesLieu } from "./InfosPratiquesLieu.tsx";
import { ValidationVisitesLieu } from "./ValidationVisitesLieu.tsx";
import { RechercheAdresse } from "./RechercheAdresse.tsx";

const NOUVEAU: SaisieLieu = {
  nom: "", type: "resto", emoji: "🍝", info: "", texte: "", adresse: null, quartier: "", ville: "",
  latitude: null, longitude: null, prix: "€€", prixMoyen: null, couleurs: ["#FFD60A", "#FF4D3D"], horaires: "",
  ouverture: [], plat: "", tags: [], envies: [], reservable: false, telephone: null, siteWeb: null, instagram: null,
  decouvertPar: null, statut: "brouillon", note: null,
  animaux: null, accessible: null, terrasse: null, wifi: null, enfants: null, parking: null, paiements: [], reservation: null,
};
const ENVIES: { valeur: EnvieLieu; libelle: string }[] = [
  { valeur: "terrasse", libelle: "Terrasse" },
  { valeur: "vege", libelle: "Végé" },
  { valeur: "amoureux", libelle: "En amoureux" },
  { valeur: "potes", libelle: "Entre potes" },
  { valeur: "famille", libelle: "En famille" },
];
const NOMS_CHAMPS: Record<string, string> = {
  nom: "le nom", emoji: "l'emoji", info: "« ce que c'est »", texte: "la présentation", quartier: "le quartier", ville: "la ville",
  horaires: "les horaires", plat: "le plat signature", couleurs: "les couleurs", siteWeb: "le site web (https://…)", ouverture: "les créneaux",
  latitude: "la latitude", longitude: "la longitude", tags: "les mots-clés", prixMoyen: "le prix moyen",
};

const texteOuNull = (valeur: string) => (valeur.trim() ? valeur : null);
const nombreOuNull = (valeur: string) => (valeur.trim() === "" ? null : Number(valeur.replace(",", ".")));

function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  return <Carte titre={titre}><div className="grid gap-4 md:grid-cols-2">{children}</div></Carte>;
}

/** Fiche d'un lieu à créer (id null) ou à modifier, avec l'aperçu de sa carte dans l'app. */
/** navigation : fiche précédente et suivante de la liste filtrée ; manques : ce qui manque à la fiche (contrôle qualité) */
type Props = {
  id: number | null;
  onFermer: () => void;
  allerA?: (ecran: Ecran, id: number | null) => void;
  navigation?: { position: string; precedente: (() => void) | null; suivante: (() => void) | null };
  manques?: string[];
};

export function FormulaireLieu({ id, onFermer, allerA, navigation, manques }: Props) {
  const [lieu, setLieu] = useState<SaisieLieu | null>(id ? null : NOUVEAU);
  const [tags, setTags] = useState("");
  // Nombres gardés en texte pendant la saisie (sinon « 43. » perdrait son point), convertis à l'enregistrement
  const [nombres, setNombres] = useState({ latitude: "", longitude: "", prixMoyen: "" });
  const [erreurChargement, setErreurChargement] = useState<ErreurApi | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const [suppression, setSuppression] = useState(false);
  /** La fiche telle qu'elle a été chargée : pour prévenir avant de quitter avec des changements non enregistrés */
  const chargee = useRef<string | null>(null);
  // Monte après une modification proposée appliquée : la fiche se relit depuis le serveur
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!id) return;
    lireLieu(id).then(
      ({ id: _id, creeLe: _c, modifieLe: _m, ...saisie }) => {
        const tagsTexte = saisie.tags.join(", ");
        const nombresTexte = { latitude: saisie.latitude?.toString() ?? "", longitude: saisie.longitude?.toString() ?? "", prixMoyen: saisie.prixMoyen?.toString() ?? "" };
        setLieu(saisie);
        setTags(tagsTexte);
        setNombres(nombresTexte);
        chargee.current = JSON.stringify({ lieu: saisie, tags: tagsTexte, nombres: nombresTexte });
      },
      (erreur: unknown) => setErreurChargement(erreur instanceof ErreurApi ? erreur : null),
    );
  }, [id, version]);

  if (!lieu) return erreurChargement ? <MessageErreur erreur={erreurChargement} /> : <Chargement />;
  const changer = (modif: Partial<SaisieLieu>) => setLieu({ ...lieu, ...modif });

  async function enregistrer(suivre = false) {
    if (!lieu) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await enregistrerLieu(id, {
        ...lieu,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        latitude: nombreOuNull(nombres.latitude),
        longitude: nombreOuNull(nombres.longitude),
        prixMoyen: nombreOuNull(nombres.prixMoyen),
      });
      if (suivre && navigation?.suivante) navigation.suivante();
      else onFermer();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ ? `Vérifie ${NOMS_CHAMPS[erreur.champ] ?? erreur.champ}.` : expliquerErreur(erreur) });
    }
  }
  /** Change de fiche sans enregistrer, après confirmation s'il y a des changements */
  function quitterVers(aller: (() => void) | null) {
    if (!aller) return;
    if (chargee.current && JSON.stringify({ lieu, tags, nombres }) !== chargee.current && !window.confirm("Tu as des changements non enregistrés sur cette fiche : les abandonner ?")) return;
    aller();
  }
  async function supprimer() {
    if (!id) return;
    setEtat({ enCours: true, erreur: null });
    await supprimerLieu(id).then(onFermer, (probleme: unknown) => setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) }));
  }

  return (
    <>
      <EnTeteEcran
        titre={id ? lieu.nom || "Lieu" : "Nouveau lieu"}
        actions={
          <>
            <Bouton icone={ArrowLeft} onClick={onFermer}>Retour</Bouton>
            {navigation && (
              <span className="flex items-center gap-1">
                <Bouton icone={ChevronLeft} titre="Fiche précédente (sans enregistrer)" desactive={!navigation.precedente} onClick={() => quitterVers(navigation.precedente)} />
                <span className="chiffres px-1 text-sm text-gris">{navigation.position}</span>
                <Bouton icone={ChevronRight} titre="Fiche suivante (sans enregistrer)" desactive={!navigation.suivante} onClick={() => quitterVers(navigation.suivante)} />
              </span>
            )}
            {id && <Bouton variante="danger" icone={Trash2} onClick={() => setSuppression(true)}>Supprimer</Bouton>}
            {navigation?.suivante && <Bouton icone={Save} chargement={etat.enCours} onClick={() => enregistrer(true)}>Enregistrer et suivante</Bouton>}
            <Bouton variante="principal" icone={Save} chargement={etat.enCours} onClick={() => enregistrer()}>Enregistrer</Bouton>
          </>
        }
      />
      {id && <SuggestionsDuLieu lieuId={id} maintenant={lieu} onDecision={() => setVersion((v) => v + 1)} />}
      {manques && (
        <p role="note" className={`mb-5 rounded-xl px-4 py-3 text-sm ${manques.length ? "border border-ligne bg-white" : "bg-vert-clair font-semibold text-vert"}`}>
          {manques.length === 0
            ? "Fiche complète ✓ : rien ne manque pour la mettre en ligne."
            : <><strong>À compléter avant la mise en ligne :</strong> {manques.map((point) => POINTS_FICHE[point] ?? point).join(" · ")}</>}
        </p>
      )}
      {etat.erreur && <p role="alert" className="mb-4 rounded-xl bg-rose-alerte px-4 py-2 text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5">
          <Groupe titre="Le lieu">
            <Champ libelle="Nom" valeur={lieu.nom} maxLength={80} onChange={(nom) => changer({ nom })} />
            <Selecteur
              libelle="Statut"
              valeur={lieu.statut}
              onChange={(statut) => changer({ statut })}
              options={[{ valeur: "brouillon", libelle: "Brouillon (invisible)" }, { valeur: "publie", libelle: "En ligne" }, { valeur: "masque", libelle: "Masqué" }]}
            />
            <Selecteur
              libelle="Type"
              valeur={lieu.type}
              onChange={(type) => changer({ type })}
              options={[{ valeur: "resto", libelle: "Resto" }, { valeur: "patisserie", libelle: "Pâtisserie" }, { valeur: "bar", libelle: "Bar" }, { valeur: "sortie", libelle: "Sortie" }]}
            />
            <Champ libelle="Ce que c'est" valeur={lieu.info} maxLength={60} placeholder="Trattoria, Bar à cocktails…" onChange={(info) => changer({ info })} />
            <Champ libelle="Emoji" valeur={lieu.emoji} maxLength={16} onChange={(emoji) => changer({ emoji })} />
            <div className="flex items-end gap-3">
              {[0, 1].map((rang) => (
                <label key={rang} className="grid gap-1.5 text-sm font-semibold">
                  Couleur {rang + 1}
                  <input
                    type="color"
                    value={lieu.couleurs[rang]}
                    onChange={(e) => changer({ couleurs: (rang === 0 ? [e.target.value, lieu.couleurs[1]] : [lieu.couleurs[0], e.target.value]) as [string, string] })}
                    className="h-10 w-20 cursor-pointer rounded-xl border border-ligne bg-white p-1"
                  />
                </label>
              ))}
            </div>
          </Groupe>

          <Groupe titre="Où le trouver">
            <Champ libelle="Adresse" valeur={lieu.adresse ?? ""} maxLength={160} onChange={(v) => changer({ adresse: texteOuNull(v) })} className="md:col-span-2" />
            <Champ libelle="Quartier" valeur={lieu.quartier} maxLength={60} onChange={(quartier) => changer({ quartier })} />
            <Champ libelle="Ville" valeur={lieu.ville} maxLength={80} onChange={(ville) => changer({ ville })} />
            <RechercheAdresse
              adresse={lieu.adresse ?? ""}
              ville={lieu.ville}
              onChoisir={(resultat) => {
                changer({ adresse: resultat.nom, ville: resultat.ville || lieu.ville });
                setNombres({ ...nombres, latitude: String(resultat.latitude), longitude: String(resultat.longitude) });
              }}
            />
            <Champ libelle="Latitude" inputMode="decimal" valeur={nombres.latitude} onChange={(latitude) => setNombres({ ...nombres, latitude })} />
            <Champ libelle="Longitude" inputMode="decimal" valeur={nombres.longitude} onChange={(longitude) => setNombres({ ...nombres, longitude })} />
          </Groupe>

          <Groupe titre="Ce qu'on y trouve">
            <ZoneTexte libelle="Présentation" valeur={lieu.texte} maximum={1000} lignes={5} onChange={(texte) => changer({ texte })} className="md:col-span-2" aide="Raconte le lieu avec chaleur, sans misérabilisme." />
            <Champ libelle="Plat signature" valeur={lieu.plat} maxLength={80} onChange={(plat) => changer({ plat })} />
            <div className="grid grid-cols-2 gap-3">
              <Selecteur libelle="Prix" valeur={lieu.prix} onChange={(prix) => changer({ prix })} options={[{ valeur: "€", libelle: "€" }, { valeur: "€€", libelle: "€€" }, { valeur: "€€€", libelle: "€€€" }]} />
              <Champ libelle="Prix moyen (€)" inputMode="numeric" valeur={nombres.prixMoyen} onChange={(prixMoyen) => setNombres({ ...nombres, prixMoyen })} />
            </div>
            <Champ libelle="Mots-clés" valeur={tags} onChange={setTags} placeholder="Pâtes fraîches, Fait maison" aide="Séparés par des virgules (12 au plus)." className="md:col-span-2" />
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-semibold">Pour quelles envies</legend>
              <div className="flex flex-wrap gap-4">
                {ENVIES.map(({ valeur, libelle }) => (
                  <CaseACocher
                    key={valeur}
                    libelle={libelle}
                    coche={lieu.envies.includes(valeur)}
                    onChange={(coche) => changer({ envies: coche ? [...lieu.envies, valeur] : lieu.envies.filter((e) => e !== valeur) })}
                  />
                ))}
              </div>
            </fieldset>
          </Groupe>

          <Carte titre="Horaires">
            <div className="grid gap-4">
              <Champ libelle="Horaires, en clair" valeur={lieu.horaires} maxLength={160} placeholder="Mar–sam, 12h–14h30 et 19h–23h" onChange={(horaires) => changer({ horaires })} />
              <EditeurCreneaux creneaux={lieu.ouverture} onChange={(ouverture) => changer({ ouverture })} />
            </div>
          </Carte>

          <Groupe titre="Infos pratiques">
            <InfosPratiquesLieu lieu={lieu} changer={changer} />
          </Groupe>
          <Groupe titre="Contact et coulisses">
            <Champ libelle="Téléphone" valeur={lieu.telephone ?? ""} maxLength={30} onChange={(v) => changer({ telephone: texteOuNull(v) })} />
            <Champ libelle="Site web" valeur={lieu.siteWeb ?? ""} maxLength={200} placeholder="https://…" onChange={(v) => changer({ siteWeb: texteOuNull(v) })} />
            <Champ libelle="Instagram" valeur={lieu.instagram ?? ""} maxLength={60} placeholder="@lieu" onChange={(v) => changer({ instagram: texteOuNull(v) })} />
            <Champ libelle="Déniché par" valeur={lieu.decouvertPar ?? ""} maxLength={40} placeholder="Prénom de la personne" onChange={(v) => changer({ decouvertPar: texteOuNull(v) })} />
            <CaseACocher libelle="Réservable" coche={lieu.reservable} onChange={(reservable) => changer({ reservable })} />
            <ZoneTexte libelle="Note interne (jamais montrée)" valeur={lieu.note ?? ""} maximum={1000} lignes={3} onChange={(v) => changer({ note: texteOuNull(v) })} className="md:col-span-2" />
          </Groupe>
          {id && <ValidationVisitesLieu lieuId={id} nom={lieu.nom} />}
        </div>
        <div className="sticky top-4 grid gap-2">
          <p className="text-sm font-semibold text-gris">Aperçu dans l'app</p>
          <ApercuLieu lieu={{ ...lieu, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }} />
          {id && <ComptesProDuLieu lieuId={id} />}
          {id && <HistoriqueLieu id={id} allerA={allerA} />}
        </div>
      </div>

      <Modale
        titre="Supprimer ce lieu ?"
        ouverte={suppression}
        onFermer={() => setSuppression(false)}
        actions={
          <>
            <Bouton onClick={() => setSuppression(false)}>Annuler</Bouton>
            <Bouton variante="danger" icone={Trash2} chargement={etat.enCours} onClick={supprimer}>Supprimer pour de bon</Bouton>
          </>
        }
      >
        <p><strong>{lieu.nom}</strong> disparaît, avec <strong>toutes ses publications</strong> et leurs vidéos et photos, et aussi les visites, rescousses, cartes de fidélité et SOS liés à ce lieu.</p>
        <p className="mt-2 text-sm text-gris">Pour le cacher sans rien perdre, passe plutôt son statut à « Masqué ».</p>
      </Modale>
    </>
  );
}
