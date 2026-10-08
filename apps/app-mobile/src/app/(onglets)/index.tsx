import { useIsFocused, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Share, View, type ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { EnTeteFil, type OngletFil } from "~/composants/fil/EnTeteFil";
import { FilVide } from "~/composants/fil/FilVide";
import { PostLieu } from "~/composants/fil/PostLieu";
import { Annonce } from "~/composants/interface/Annonce";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { calculerScoreLieu } from "~/fonctions/lieux/calculer-score-lieu";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { trouverRaisonLieu } from "~/fonctions/lieux/trouver-raison-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** Onglet « Pour toi » : les lieux en plein écran, triés selon tes envies, à faire défiler vers le haut. */
export default function PourToi() {
  const router = useRouter();
  const focus = useIsFocused();
  const marges = useSafeAreaInsets();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const [onglet, setOnglet] = useState<OngletFil>("tous");
  const [hauteur, setHauteur] = useState(0);
  const [visible, setVisible] = useState<number | null>(null);
  const [envols, setEnvols] = useState<Record<number, number>>({});
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieux = useMemo(() => {
    const permis = filtrerLieuxSelonAge(lieuxExemples, age);
    return profil ? [...permis].sort((a, b) => calculerScoreLieu(b, profil) - calculerScoreLieu(a, profil)) : permis;
  }, [profil, age]);
  const liste = onglet === "tous" ? lieux : lieux.filter((l) => l.sos || l.alerte).sort((a, b) => Number(!!b.sos) - Number(!!a.sos));

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  function rescousse(lieu: Lieu, parDoubleAppui: boolean) {
    // Le double appui donne une rescousse, il ne la reprend jamais
    if (parDoubleAppui && activite.aSauve(lieu.id)) return setEnvols((e) => ({ ...e, [lieu.id]: Date.now() }));
    const resultat = activite.basculerRescousse(lieu.id);
    if (resultat === "epuisee") return annoncer("Plus de rescousse cette semaine, reviens lundi ! 🛟");
    if (resultat === "annulee") return annoncer("Rescousse reprise");
    setEnvols((e) => ({ ...e, [lieu.id]: Date.now() }));
    const reste = activite.restantes - 1;
    if (lieu.nouveau && !lieu.decouvertPar) annoncer(`🚀 Premier sauveteur ! ${lieu.nom} est « Déniché par ${profil?.prenom ?? "toi"} »`);
    else annoncer(reste > 0 ? `Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine` : "Dernière rescousse donnée, merci pour eux ! 🦸");
  }

  function garder(lieu: Lieu) {
    annoncer(activite.basculerGarde(lieu.id) ? `🔖 ${lieu.nom} est gardé pour plus tard` : "Retiré de tes lieux gardés");
  }

  function partager(lieu: Lieu) {
    Share.share({ message: `${lieu.emoji} ${lieu.nom} (${lieu.quartier}, ${lieu.ville}) a besoin de monde ! Je l'ai trouvé sur SOS Miam 🛟 https://sosmiam.fr` }).catch(() => {});
  }

  const auChangementDeVisible = useCallback(({ viewableItems }: { viewableItems: ViewToken<Lieu>[] }) => {
    setVisible(viewableItems[0]?.item.id ?? null);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.encre }} onLayout={(e) => setHauteur(e.nativeEvent.layout.height)}>
      {focus ? <StatusBar style="light" /> : null}
      {hauteur > 0 ? (
        liste.length > 0 ? (
          <FlatList
            key={onglet}
            data={liste}
            keyExtractor={(lieu) => String(lieu.id)}
            pagingEnabled
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: hauteur, offset: hauteur * index, index })}
            onViewableItemsChanged={auChangementDeVisible}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
            windowSize={3}
            renderItem={({ item }) => (
              <PostLieu
                lieu={item}
                hauteur={hauteur}
                raison={profil ? trouverRaisonLieu(item, profil) : null}
                sauve={activite.aSauve(item.id)}
                garde={activite.estGarde(item.id)}
                envol={envols[item.id] ?? 0}
                visible={focus && visible === item.id}
                onRescousse={() => rescousse(item, false)}
                onDoubleAppui={() => rescousse(item, true)}
                onGarder={() => garder(item)}
                onPartager={() => partager(item)}
                onVoir={() => router.push({ pathname: "/lieu/[id]", params: { id: String(item.id) } })}
              />
            )}
          />
        ) : (
          <FilVide hauteur={hauteur} onVoirTout={() => setOnglet("tous")} />
        )
      ) : null}
      <EnTeteFil onglet={onglet} onChoisir={setOnglet} restantes={activite.restantes} haut={marges.top} />
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
