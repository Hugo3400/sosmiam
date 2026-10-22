import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pote } from "@sos-miam/commun/types/potes";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { RondPote } from "~/composants/potes/RondPote";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { BoutonRetirerAbonne } from "~/composants/suivi/BoutonRetirerAbonne";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { EncadreComptePrive } from "~/composants/suivi/EncadreComptePrive";
import { LigneSuivi } from "~/composants/suivi/LigneSuivi";
import { ListeTuSuis } from "~/composants/suivi/ListeTuSuis";
import type { OngletReseau } from "~/composants/suivi/OngletsReseau";
import { OngletsReseau } from "~/composants/suivi/OngletsReseau";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireCleSuivi } from "~/fonctions/suivi/ecrire-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLiensDe } from "~/hooks/utiliser-liens-de";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserProfilCommunautaire } from "~/hooks/utiliser-profil-communautaire";
import type { PersonneLiee } from "~/hooks/utiliser-suivis-personnes";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

const TAILLE_ROND = 48;
/** Une page du serveur (compte connecté) */
const PAR_PAGE = 50;
const NOMS = { abonnes: { un: "abonné", des: "abonnés" }, abonnements: { un: "abonnement", des: "abonnements" } } as const;

/**
 * Abonnés et abonnements d'une personne (ou les tiens, id « moi »), en deux onglets. Pour toi : tes abonnés (à retirer en
 * toute discrétion, liste figée à l'ouverture) et tout ce que tu suis. Pour quelqu'un d'autre : ses listes, avec « Suivre »
 * sur chaque ligne, ou l'encadré « Compte privé » si elles te sont fermées. Personne inconnue ou bloquée : un message et le retour.
 */
export default function ReseauPersonne() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id = "", onglet: ongletDemande } = useLocalSearchParams<{ id: string; onglet?: "abonnes" | "abonnements" }>();
  const { invite } = utiliserProfil();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const suivis = utiliserSuivisPersonnes();
  const [onglet, setOnglet] = useState<OngletReseau>(ongletDemande === "abonnements" ? "abonnements" : "abonnes");
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const estMoi = id === monId;

  // Tes abonnés au moment où l'écran s'ouvre : quelqu'un qu'on retire reste affiché (« Ne te suit plus »), rien ne bouge sous le doigt
  const [mesAbonnes, setMesAbonnes] = useState<PersonneLiee[] | null>(() => (suivis.pret ? suivis.abonnes : null));
  useEffect(() => {
    if (mesAbonnes === null && suivis.pret) setMesAbonnes(suivis.abonnes);
  }, [mesAbonnes, suivis.pret, suivis.abonnes]);
  // Compte connecté : la page suivante (« Voir plus ») s'ajoute au bout, sans bouger ce qui est déjà là
  useEffect(() => {
    setMesAbonnes((avant) => {
      if (avant === null) return avant;
      const deja = new Set(avant.map((a) => a.pote.id));
      const nouveaux = suivis.abonnes.filter((a) => !deja.has(a.pote.id));
      return nouveaux.length > 0 ? [...avant, ...nouveaux] : avant;
    });
  }, [suivis.abonnes]);
  // Compte connecté : son profil (ses compteurs, votre lien) et ses listes, lues sur le serveur (si tu es dans sa bande)
  const lecture = utiliserProfilCommunautaire(estMoi ? "" : id);
  const liensDe = utiliserLiensDe(estMoi ? "" : id, onglet);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/potes"));

  if (invite) {
    return (
      <EcranReglage titre="Abonnés et abonnements" sousTitre="Crée ton compte pour suivre des gens et voir qui suit qui. C'est gratuit, et ça prend une minute.">
        <Bouton libelle="Je m'inscris (1 min)" variante="encre" indice="Ouvre l'inscription" onPress={() => router.push("/compte")} />
      </EcranReglage>
    );
  }

  const pote = communaute.trouverPote(id);
  const bloque = communaute.bloques.some((p) => p.id === id);
  // Pendant la lecture de son profil : un écran crème plutôt qu'un faux « introuvable »
  if (lecture.chargement && !pote) return <View style={{ flex: 1, backgroundColor: couleurs.creme }} />;
  if (!pote || bloque) {
    return (
      <EcranReglage titre="Personne à l'horizon" sousTitre="On ne trouve pas ce profil : la personne a peut-être quitté SOS Miam, ou le lien s'est emmêlé.">
        <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  const compteurs = suivis.pret ? suivis.compteursDe(id) : null;
  const relation = estMoi ? null : suivis.relationAvec(id);

  /** Une ligne de personne : son rond, son prénom (« Toi » pour toi) et son @pseudo ; elle ouvre son profil */
  const ligne = (personne: Pote, derniere: boolean, sousTitre: string, action?: ReactNode) => (
    <LigneSuivi
      key={personne.id}
      cle={ecrireCleSuivi({ type: "personne", id: personne.id })}
      emoji={personne.avatar}
      nom={personne.id === monId ? "Toi" : personne.prenom}
      sousTitre={sousTitre}
      rond={<RondPote pote={personne} taille={TAILLE_ROND} />}
      indice={personne.id === monId ? "Ouvre ton profil" : "Ouvre son profil"}
      derniere={derniere}
      onOuvrir={() => router.push({ pathname: "/potes/profil/[id]", params: { id: personne.id } })}
      onAnnoncer={annoncer}
      action={personne.id === monId ? null : action}
    />
  );

  const videParDefaut = (texte: string) => (
    <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
        🦗
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
    </View>
  );

  let contenu: ReactNode = null;
  if (!suivis.pret) {
    contenu = null;
  } else if (estMoi && onglet === "abonnements") {
    contenu = <ListeTuSuis onAnnoncer={annoncer} />;
  } else if (estMoi) {
    // Une personne devenue inconnue ou bloquée depuis l'ouverture disparaît tout de suite
    const lignes = (mesAbonnes ?? []).filter(({ pote: p }) => {
      const r = suivis.relationAvec(p.id);
      return r !== null && !(!r.verdict.permis && r.verdict.raison === "bloque");
    });
    const demandes = suivis.demandesRecues.length;
    contenu = (
      <View className="gap-4">
        {demandes > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Demandes d'abonnement, ${demandes}`}
            accessibilityHint="Ouvre tes notifications pour les accepter ou les refuser"
            onPress={() => {
              vibrerLegerement();
              router.push("/notifications");
            }}
            className="min-h-14 flex-row items-center gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-4 py-3 active:opacity-80"
          >
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
              📨
            </Text>
            <Text className="flex-1 font-texte-gras text-base text-encre">{`Demandes d'abonnement (${demandes})`}</Text>
            <Ionicons name="chevron-forward" size={20} color={couleurs.encre} />
          </Pressable>
        ) : null}
        {lignes.length === 0 ? (
          videParDefaut("Personne ne te suit encore… Partage ton profil : tes potes t'ajoutent avec ton QR code.")
        ) : (
          <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
            {lignes.map(({ pote: p }, i) => {
              const meSuitEncore = suivis.abonnes.some((a) => a.pote.id === p.id);
              return ligne(
                p,
                i === lignes.length - 1,
                `@${p.pseudo}${meSuitEncore ? "" : " · Ne te suit plus"}`,
                // Le bouton reste en place et devient « Retiré » (VoiceOver s'y pose : il ne perd pas sa place dans la liste)
                <BoutonRetirerAbonne id={p.id} prenom={p.prenom} onAnnoncer={annoncer} />,
              );
            })}
          </View>
        )}
        {suivis.suites.abonnes ? (
          <BoutonVoirPlus
            restants={Math.max(1, (compteurs?.abonnes ?? 0) - suivis.abonnes.length)}
            prochains={Math.min(PAR_PAGE, Math.max(1, (compteurs?.abonnes ?? 0) - suivis.abonnes.length))}
            nom={NOMS.abonnes}
            onVoirPlus={() => suivis.chargerSuite("abonnes")}
          />
        ) : null}
      </View>
    );
  } else {
    const { liste } = liensDe;
    if (liste === null) {
      contenu = liensDe.ratee ? (
        videParDefaut("Le réseau fait des siennes : impossible de lire cette liste pour l'instant. Réessaie dans un instant !")
      ) : (
        <View className="mt-4 items-center">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="Chargement de la liste" />
        </View>
      );
    } else if (liste === "ferme") {
      contenu = (
        <View className="gap-4">
          {/* « Touche Suivre », dit l'encadré : le bouton est là aussi, juste au-dessus (rien s'il n'est pas permis) */}
          <BoutonSuivreProfil cle={ecrireCleSuivi({ type: "personne", id })} nom={pote.prenom} emoji={pote.avatar} onAnnoncer={annoncer} taille="grand" />
          <EncadreComptePrive
            prenom={pote.prenom}
            demandeEnvoyee={relation?.jeSuis === "demande"}
            listesSeules={relation?.visibilite === "complet"}
            bande={suivis.source === "compte"}
          />
        </View>
      );
    } else if (liste.length === 0) {
      contenu = videParDefaut(onglet === "abonnes" ? `${pote.prenom} n'a pas encore d'abonnés. La première place est libre !` : `${pote.prenom} ne suit personne pour l'instant.`);
    } else {
      contenu = (
        <View className="gap-4">
          <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
            {liste.map((p, i) => ligne(p, i === liste.length - 1, p.pseudo ? `@${p.pseudo}` : ""))}
          </View>
          <BoutonVoirPlus restants={liensDe.restants} prochains={Math.min(PAR_PAGE, liensDe.restants)} nom={NOMS[onglet]} onVoirPlus={liensDe.chargerSuite} />
        </View>
      );
    }
  }

  const titre = estMoi ? communaute.moi.prenom : pote.prenom;
  const pseudo = estMoi ? communaute.moi.pseudo : pote.pseudo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <View accessible accessibilityRole="header" accessibilityLabel={pseudo ? `${titre}, @${pseudo}` : titre} className="flex-1">
          <Text numberOfLines={1} className="font-titre text-2xl text-encre">
            {titre}
          </Text>
          {pseudo ? (
            <Text numberOfLines={1} className="font-texte text-sm text-gris">
              @{pseudo}
            </Text>
          ) : null}
        </View>
      </View>

      {suivis.pret ? <OngletsReseau onglet={onglet} onChoisir={setOnglet} abonnes={compteurs?.abonnes ?? null} abonnements={compteurs?.abonnements ?? null} /> : null}

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10 pt-5">
        {contenu}
      </ScrollView>

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
