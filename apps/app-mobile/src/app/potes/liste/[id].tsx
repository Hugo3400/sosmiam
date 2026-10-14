import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { EnTeteListe } from "~/composants/potes/EnTeteListe";
import { LigneLieuListe } from "~/composants/potes/LigneLieuListe";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import couleurs from "~/theme/couleurs";


/**
 * Une liste partagée : qui l'a faite, qui la suit, et ses adresses (toucher → fiche du lieu).
 * Celle d'un pote se suit ou ne se suit plus ; ta liste ou une liste suivie peut recevoir des adresses ; seule la tienne peut en perdre.
 * Démo : les potes d'exemple attendent les vrais comptes.
 */
export default function EcranListePartagee() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const { trouverLieu } = utiliserLieux();
  // Distance depuis le centre de ta ville (partout en France)
  const depart = utiliserPointDeDepart();
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const cadre = (contenu: ReactNode) => (
    <View style={{ flex: 1, paddingTop: marges.top }} className="bg-creme">
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={retour}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>
      {contenu}
    </View>
  );

  // Tant que la communauté n'est pas lue sur le téléphone, une liste créée par toi semblerait introuvable
  if (!communaute.pret) return <View className="flex-1 bg-creme" />;

  const liste = communaute.listes.find((l) => l.id === id) ?? null;
  const idsBloques = new Set(communaute.bloques.map((p) => p.id));
  // La liste d'une personne bloquée disparaît pour toi, comme ses messages
  if (!liste || idsBloques.has(liste.auteur)) {
    return cadre(
      <View className="flex-1 items-center justify-center gap-4 px-8 pb-16">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-6xl">
          🗺️
        </Text>
        <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
          Cette liste s'est fait la malle
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Elle a peut-être été supprimée, ou elle n'est plus partagée avec toi. Pas de panique : les bonnes adresses, ce n'est pas ce qui manque !")}
        </Text>
        <Bouton libelle="Retour" variante="blanc" onPress={retour} />
      </View>,
    );
  }

  const estAMoi = liste.auteur === monId;
  const suivie = liste.abonnes.includes(monId);
  const peutAjouter = estAMoi || suivie;
  const auteur = communaute.trouverPote(liste.auteur);
  const abonnes = liste.abonnes
    .filter((a) => !idsBloques.has(a))
    .map((a) => communaute.trouverPote(a))
    .filter((p): p is Pote => p !== null);

  const lieux = liste.lieux.map(trouverLieu).filter((l): l is Lieu => l !== undefined);
  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));

  const basculerSuivi = () => {
    communaute.basculerSuiviListe(liste.id);
    annoncer(suivie ? "Tu ne suis plus cette liste" : "📌 C'est noté, tu suis la liste !");
  };

  const retirer = (lieu: Lieu) => {
    const confirmer = () => {
      communaute.retirerLieuListe(liste.id, lieu.id);
      annoncer(`${lieu.nom} quitte la liste`);
    };
    // Sur le web (aperçu de développement), Alert n'existe pas : on retire directement
    if (Platform.OS === "web") return confirmer();
    Alert.alert(`Retirer ${lieu.nom} ?`, lierPonctuation("L'adresse quitte ta liste. Pas de regret : tu pourras toujours la rajouter."), [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: confirmer },
    ]);
  };

  const ajouter = (lieuId: number) => {
    communaute.ajouterLieuListe(liste.id, lieuId);
    setChoixOuvert(false);
    const lieu = trouverLieu(lieuId);
    annoncer(lieu ? `😋 ${lieu.nom} rejoint la liste !` : "😋 Adresse ajoutée !");
  };

  // Rien à montrer : une invitation qui dépend de ce que tu peux faire
  const texteVide = estAMoi
    ? "Ta liste a encore le ventre vide. Ajoute ta première adresse !"
    : suivie
      ? "Pas encore d'adresse ici. Glisses-y la première !"
      : "Pas encore d'adresse ici. Suis la liste pour y glisser les tiennes !";

  return (
    <>
      {cadre(
        <ScrollView contentContainerClassName="gap-6 px-5" contentContainerStyle={{ paddingBottom: marges.bottom + 32 }}>
          <EnTeteListe
            liste={liste}
            auteur={auteur}
            abonnes={abonnes}
            nombreLieux={lieux.length}
            suivie={estAMoi ? null : suivie}
            onBasculerSuivi={basculerSuivi}
            onOuvrirAuteur={(idPote) => router.push({ pathname: "/potes/profil/[id]", params: { id: idPote } })}
          />

          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              Au menu
            </Text>
            {lieux.length === 0 ? (
              <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
                  🍽️
                </Text>
                <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texteVide)}</Text>
              </View>
            ) : (
              <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
                {lieux.map((lieu, i) => (
                  <LigneLieuListe
                    key={lieu.id}
                    lieu={lieu}
                    km={calculerKmLieu(lieu, depart)}
                    image={trouverVignetteLieu(lieu.id, publications)}
                    derniere={i === lieux.length - 1}
                    onOuvrir={(idLieu) => router.push({ pathname: "/lieu/[id]", params: { id: String(idLieu) } })}
                    onRetirer={estAMoi ? retirer : undefined}
                  />
                ))}
              </View>
            )}
            {peutAjouter ? <Bouton libelle="Ajouter un lieu" variante="blanc" indice="Choisis une adresse à ajouter à la liste" onPress={() => setChoixOuvert(true)} className="mt-1" /> : null}
          </View>

          <BandeauDemoPotes />
        </ScrollView>,
      )}

      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
      <ChoixLieu visible={choixOuvert} titre={`Ajouter à « ${liste.titre} »`} dejaChoisis={liste.lieux} onChoisir={ajouter} onFermer={() => setChoixOuvert(false)} />
    </>
  );
}
